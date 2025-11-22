import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createYouTubeMcpServer } from './server-utils.js';

export async function startMcpServer() {
    const server = createYouTubeMcpServer();

    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log the server info
    console.log(`YouTube MCP Server started successfully`);
    console.log(`Server will validate YouTube API key when tools are called`);

    return server;
}