#!/usr/bin/env node

import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createYouTubeMcpServer } from './server-utils.js';

const app = express();
const PORT = process.env.PORT || 3000;

const activeTransports = new Map<string, StreamableHTTPServerTransport>();

if (!process.env.YOUTUBE_API_KEY) {
    console.error('Error: YOUTUBE_API_KEY environment variable is required.');
    console.error('Please set it before running this server.');
    process.exit(1);
}

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        name: 'YouTube MCP Server',
        version: '0.1.13',
        transport: 'Streamable HTTP',
        endpoints: {
            health: '/health',
            mcp: '/mcp (POST / GET / DELETE)',
        },
        documentation: 'https://github.com/Leonine-Studios/youtube-mcp',
        status: 'running',
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'YouTube MCP Server',
        transport: 'Streamable HTTP',
        timestamp: new Date().toISOString(),
    });
});

function setCorsHeaders(res: express.Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
}

app.options('/mcp', (req, res) => {
    setCorsHeaders(res);
    res.sendStatus(204);
});

// Helper: spin up a fresh transport + server pair and track it
async function createTransportSession(): Promise<StreamableHTTPServerTransport> {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
    });

    const server = createYouTubeMcpServer();

    transport.onclose = () => {
        if (transport.sessionId) {
            activeTransports.delete(transport.sessionId);
        }
    };

    await server.connect(transport);

    return transport;
}

// POST /mcp — initialize or route to an existing session
app.post('/mcp', async (req, res) => {
    setCorsHeaders(res);

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    let transport: StreamableHTTPServerTransport;

    if (sessionId && activeTransports.has(sessionId)) {
        transport = activeTransports.get(sessionId)!;
    } else {
        // No session, stale/expired session, or fresh initialize — always create
        // a new transport and let the SDK handle protocol-level validation.
        // This prevents returning a bare 404 that clients misread as
        // "Streamable HTTP not supported", which causes spurious SSE fallbacks.
        transport = await createTransportSession();
    }

    await transport.handleRequest(req, res, req.body);

    // After handling initialize, the transport gets its session ID.
    // Store it so subsequent requests can find this transport.
    if (transport.sessionId && !activeTransports.has(transport.sessionId)) {
        activeTransports.set(transport.sessionId, transport);
    }
});

// GET /mcp — SSE notification stream for an active session
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

app.listen(PORT, () => {
    console.log('YouTube MCP HTTP Server started');
    console.log(`  Server:  http://localhost:${PORT}`);
    console.log(`  Health:  http://localhost:${PORT}/health`);
    console.log(`  MCP:     http://localhost:${PORT}/mcp`);
    console.log(`  API Key: ${process.env.YOUTUBE_API_KEY ? 'configured' : 'MISSING'}`);
});

export { app };
