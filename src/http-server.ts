#!/usr/bin/env node

import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createYouTubeMcpServer } from './server-utils.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Store active transports by session ID
const activeTransports = new Map<string, SSEServerTransport>();

// Check for required environment variables
if (!process.env.YOUTUBE_API_KEY) {
    console.error('Error: YOUTUBE_API_KEY environment variable is required.');
    console.error('Please set it before running this server.');
    process.exit(1);
}

// Enable JSON parsing for POST requests
app.use(express.json());

// Root endpoint - Server info
app.get('/', (req, res) => {
    res.json({
        name: 'YouTube MCP Server',
        version: '0.1.13',
        transport: 'HTTP/SSE',
        endpoints: {
            health: '/health',
            sse: '/sse',
            message: '/message (POST)'
        },
        documentation: 'https://github.com/kenzaelk98/youtube-mcp',
        status: 'running'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'YouTube MCP Server',
        transport: 'HTTP/SSE',
        timestamp: new Date().toISOString()
    });
});

// MCP endpoint with SSE transport
app.get('/sse', async (req, res) => {
    console.log('New SSE connection from:', req.ip);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Create a new MCP server instance for this connection
    const server = createYouTubeMcpServer();
    const transport = new SSEServerTransport('/message', res);
    
    // Get the session ID from the transport (it generates it internally)
    const sessionId = transport.sessionId;
    
    // Store the transport for message routing
    activeTransports.set(sessionId, transport);
    
    // Clean up when connection closes
    req.on('close', () => {
        console.log(`SSE connection closed for session ${sessionId}`);
        activeTransports.delete(sessionId);
    });
    
    try {
        // Connect the server to the transport (this automatically calls start())
        await server.connect(transport);
        console.log(`MCP Server connected via SSE with session ${sessionId}`);
    } catch (error) {
        console.error('Error connecting MCP server to transport:', error);
        activeTransports.delete(sessionId);
        if (!res.headersSent) {
            res.status(500).end();
        }
    }
});

// Handle POST to /sse for newer MCP clients that try streamable HTTP first
app.post('/sse', async (req, res) => {
    console.log('POST request to /sse from:', req.ip);
    // Return error to force fallback to GET SSE
    res.status(404).json({ 
        error: 'Streamable HTTP not supported, use GET /sse for SSE transport' 
    });
});

// CORS preflight
app.options('/message', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(204);
});

// POST endpoint for messages - route to the appropriate transport
app.post('/message', async (req, res) => {
    // The session ID can come from various places
    const messageBody = req.body;
    
    // Check multiple possible locations for session ID
    let sessionId = req.query.sessionId as string || 
                    req.headers['x-mcp-session-id'] as string ||
                    req.headers['x-session-id'] as string;
    
    console.log(`Received POST /message`);
    console.log(`  Query params:`, req.query);
    console.log(`  Headers:`, Object.keys(req.headers));
    console.log(`  Session ID found: ${sessionId}`);
    console.log(`  Active sessions: ${Array.from(activeTransports.keys()).join(', ')}`);
    
    // Try to find the transport
    let transport = sessionId ? activeTransports.get(sessionId) : undefined;
    
    // If no session ID found or no matching transport, try to use the only active transport
    if (!transport && activeTransports.size === 1) {
        transport = Array.from(activeTransports.values())[0];
        console.log(`Using single active transport with session: ${transport.sessionId}`);
    }
    
    // If still no transport and we have multiple, this is an error
    if (!transport) {
        console.error(`No active transport found. Session ID: ${sessionId}, Active transports: ${activeTransports.size}`);
        return res.status(404).json({ 
            error: 'Session not found or expired',
            activeTransports: activeTransports.size
        });
    }
    
    try {
        console.log(`Routing message to transport ${transport.sessionId}`);
        // The transport will handle the message internally
        // Pass the parsed body from express
        await transport.handlePostMessage(req, res, messageBody);
    } catch (error) {
        console.error('Error handling message:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 YouTube MCP HTTP Server started!');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 SSE endpoint: http://localhost:${PORT}/sse`);
    console.log(`✅ YouTube API Key: ${process.env.YOUTUBE_API_KEY ? 'Configured' : 'MISSING'}`);
});

export { app };
