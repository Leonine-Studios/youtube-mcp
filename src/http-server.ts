#!/usr/bin/env node

import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createYouTubeMcpServer } from './server-utils.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Store active transports by session ID (stateful mode)
const activeTransports = new Map<string, StreamableHTTPServerTransport>();

// Check for required environment variables
if (!process.env.YOUTUBE_API_KEY) {
    console.error('Error: YOUTUBE_API_KEY environment variable is required.');
    console.error('Please set it before running this server.');
    process.exit(1);
}

app.use(express.json());

// Root endpoint - server info
app.get('/', (req, res) => {
    res.json({
        name: 'YouTube MCP Server',
        version: '0.1.13',
        transport: 'Streamable HTTP',
        endpoints: {
            health: '/health',
            mcp: '/mcp (GET / POST / DELETE)'
        },
        documentation: 'https://github.com/Leonine-Studios/youtube-mcp',
        status: 'running'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'YouTube MCP Server',
        transport: 'Streamable HTTP',
        timestamp: new Date().toISOString()
    });
});

// CORS preflight for /mcp
app.options('/mcp', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
    res.sendStatus(204);
});

// Shared CORS middleware for /mcp
function setCorsHeaders(res: express.Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
}

// POST /mcp — handles initialize (creates new session) and subsequent messages
app.post('/mcp', async (req, res) => {
    setCorsHeaders(res);

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    let transport: StreamableHTTPServerTransport;

    const isInitialize = req.body?.method === 'initialize';

    if (sessionId && activeTransports.has(sessionId)) {
        // Route to existing session
        transport = activeTransports.get(sessionId)!;
    } else if (!sessionId || isInitialize) {
        // No session ID, or client sent a stale session ID with an initialize request — create a new session
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
        });

        const server = createYouTubeMcpServer();

        transport.onclose = () => {
            if (transport.sessionId) {
                activeTransports.delete(transport.sessionId);
            }
        };

        await server.connect(transport);

        if (transport.sessionId) {
            activeTransports.set(transport.sessionId, transport);
        }
    } else {
        res.status(404).json({ error: 'Session not found or expired' });
        return;
    }

    await transport.handleRequest(req, res, req.body);
});

// GET /mcp — optional SSE stream for server-initiated notifications
app.get('/mcp', async (req, res) => {
    setCorsHeaders(res);

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !activeTransports.has(sessionId)) {
        res.status(400).json({ error: 'Missing or invalid mcp-session-id header' });
        return;
    }

    const transport = activeTransports.get(sessionId)!;
    await transport.handleRequest(req, res);
});

// DELETE /mcp — terminate a session
app.delete('/mcp', async (req, res) => {
    setCorsHeaders(res);

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !activeTransports.has(sessionId)) {
        res.status(404).json({ error: 'Session not found or expired' });
        return;
    }

    const transport = activeTransports.get(sessionId)!;
    await transport.handleRequest(req, res);
    activeTransports.delete(sessionId);
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 YouTube MCP HTTP Server started!');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`✅ YouTube API Key: ${process.env.YOUTUBE_API_KEY ? 'Configured' : 'MISSING'}`);
});

export { app };
