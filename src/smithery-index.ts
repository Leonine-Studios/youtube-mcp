import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createStatelessServer } from '@smithery/sdk/server/stateless.js';
import { z } from 'zod';
import { VideoService } from './services/video.js';
import { TranscriptService } from './services/transcript.js';
import { PlaylistService } from './services/playlist.js';
import { ChannelService } from './services/channel.js';

// Configuration schema for Smithery
export const configSchema = z.object({
    youtubeApiKey: z.string().describe("Your YouTube Data API key"),
    youtubeTranscriptLang: z.string().default("en").describe("Default language for YouTube transcripts"),
});

export default function createServer({ config }: { config?: z.infer<typeof configSchema> }) {
    const server = new McpServer({
        name: 'youtube-mcp',
        version: '0.1.2',
    });

    const videoService = new VideoService();
    const transcriptService = new TranscriptService();
    const playlistService = new PlaylistService();
    const channelService = new ChannelService();

    // Set environment variables from config
    if (config?.youtubeApiKey) {
        process.env.YOUTUBE_API_KEY = config.youtubeApiKey;
    }
    if (config?.youtubeTranscriptLang) {
        process.env.YOUTUBE_TRANSCRIPT_LANG = config.youtubeTranscriptLang;
    }

    // Register tools using the original working pattern from f61b77f
    server.registerTool("videos_getVideo", {
        title: "Get Video Details",
        description: "Get detailed information about a YouTube video including URL",
        inputSchema: z.object({
            videoId: z.string().describe("The YouTube video ID"),
            parts: z.array(z.string()).optional().describe("Parts of the video to retrieve"),
        }),
    }, async ({ videoId, parts }) => {
        const result = await videoService.getVideo({ videoId, parts });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    });

    server.registerTool("videos_searchVideos", {
        title: "Search Videos",
        description: "Search for videos on YouTube and return results with URLs",
        inputSchema: z.object({
            query: z.string().describe("Search query"),
            maxResults: z.number().optional().describe("Maximum number of results to return"),
        }),
    }, async ({ query, maxResults }) => {
        const result = await videoService.searchVideos({ query, maxResults });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    });

    server.registerTool("transcripts_getTranscript", {
        title: "Get Video Transcript",
        description: "Get the transcript of a YouTube video",
        inputSchema: z.object({
            videoId: z.string().describe("The YouTube video ID"),
            language: z.string().optional().describe("Language code for the transcript"),
        }),
    }, async ({ videoId, language }) => {
        const result = await transcriptService.getTranscript({ videoId, language });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    });

    server.registerTool("channels_getChannel", {
        title: "Get Channel Information",
        description: "Get information about a YouTube channel",
        inputSchema: z.object({
            channelId: z.string().describe("The YouTube channel ID"),
        }),
    }, async ({ channelId }) => {
        const result = await channelService.getChannel({ channelId });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    });

    server.registerTool("channels_listVideos", {
        title: "List Channel Videos",
        description: "Get videos from a specific channel",
        inputSchema: z.object({
            channelId: z.string().describe("The YouTube channel ID"),
            maxResults: z.number().optional().describe("Maximum number of results to return"),
        }),
    }, async ({ channelId, maxResults }) => {
        const result = await channelService.listVideos({ channelId, maxResults });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    });

    server.registerTool("playlists_getPlaylist", {
        title: "Get Playlist Information",
        description: "Get information about a YouTube playlist",
        inputSchema: z.object({
            playlistId: z.string().describe("The YouTube playlist ID"),
        }),
    }, async ({ playlistId }) => {
        const result = await playlistService.getPlaylist({ playlistId });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    });

    server.registerTool("playlists_getPlaylistItems", {
        title: "Get Playlist Items",
        description: "Get videos in a YouTube playlist",
        inputSchema: z.object({
            playlistId: z.string().describe("The YouTube playlist ID"),
            maxResults: z.number().optional().describe("Maximum number of results to return"),
        }),
    }, async ({ playlistId, maxResults }) => {
        const result = await playlistService.getPlaylistItems({ playlistId, maxResults });
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    });

    return server.server;
}

// Create the stateless server for Smithery deployment
createStatelessServer(createServer).app.listen(process.env.PORT || 3000);