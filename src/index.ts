import { z } from 'zod';
import { createYouTubeMcpServer } from './server-utils.js';

// Configuration schema for Smithery
export const configSchema = z.object({
    youtubeApiKey: z.string().describe("Your YouTube Data API key"),
    youtubeTranscriptLang: z.string().default("en").describe("Default language for YouTube transcripts"),
});

// Required: Export default createServer function for Smithery
export default function createServer({ config }: { config?: z.infer<typeof configSchema> }) {
    // Set environment variables from config before creating the server
    if (config?.youtubeApiKey) {
        process.env.YOUTUBE_API_KEY = config.youtubeApiKey;
    }
    if (config?.youtubeTranscriptLang) {
        process.env.YOUTUBE_TRANSCRIPT_LANG = config.youtubeTranscriptLang;
    }

    // Create the server using shared utilities
    const server = createYouTubeMcpServer();

    // Must return the MCP server object for Smithery
    return server.server;
}
