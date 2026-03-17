# YouTube MCP Server

> **Fork of [sfiorini/youtube-mcp](https://github.com/sfiorini/youtube-mcp)** - Transcript extraction is now **working**! Fixed and optimized for Docker deployment.

A Model Context Protocol (MCP) server for YouTube that enables AI assistants to extract video transcripts, search videos, and access channel information.

## 🔧 Why This Fork?

The original project had **broken transcript extraction** due to the deprecated `youtube-transcript` library. 

This fork fixes it by using `@egoist/youtube-transcript-plus` v1.1.2 instead. **Transcript extraction now works perfectly** with timestamps, multi-language support, and consistent reliability.

## Features

- ✅ **Working transcript extraction** - Fixed with `@egoist/youtube-transcript-plus`
- ✅ **Timestamped captions** - Get start time and duration for each segment
- ✅ **Multi-language transcripts** - Support for all YouTube caption languages
- ✅ **Search YouTube** - Find videos and channels
- ✅ **Video details** - Get title, description, views, likes, etc.
- ✅ **Multi-user Streamable HTTP** - Multiple AI clients can connect simultaneously
- ✅ **Docker-ready** - One command deployment
- ✅ **Resources & Prompts** - Smithery-optimized with discoverable resources

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository:**
```bash
git clone https://github.com/Leonine-Studios/youtube-mcp.git
cd youtube-mcp
```

2. **Create `.env` file:**
```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
YOUTUBE_TRANSCRIPT_LANG=en
```

3. **Start the server:**
```bash
docker-compose up -d
```

4. **Verify it's running:**
```bash
curl http://localhost:3000/health
```

### Using Pre-built Image

```bash
docker pull ghcr.io/leonine-studios/youtube-mcp:latest

docker run -d \
  --name youtube-mcp \
  -p 3000:3000 \
  -e YOUTUBE_API_KEY=your_api_key \
  --restart unless-stopped \
  ghcr.io/leonine-studios/youtube-mcp:latest
```

## Configuration

Configure via `.env` file or environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `YOUTUBE_API_KEY` | ✅ Yes | - | Your YouTube Data API v3 key |
| `YOUTUBE_TRANSCRIPT_LANG` | ❌ No | `en` | Default language for transcripts |
| `PORT` | ❌ No | `3000` | Server port |

### Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials (API Key)
5. Copy the API key

## Connect Your AI Assistant

Add to your MCP client configuration (Cursor, Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "youtube": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

For remote server:
```json
{
  "mcpServers": {
    "youtube": {
      "url": "http://your-server-ip:3000/mcp"
    }
  }
}
```

## Available Tools

Once connected, your AI assistant can use:

- `transcripts_getTranscript` - **Get video transcript with timestamps** ⭐ (now working!)
- `videos_getVideo` - Get video details
- `videos_searchVideos` - Search YouTube videos
- `channels_getChannel` - Get channel information
- `channels_listVideos` - List channel videos
- `playlists_getPlaylist` - Get playlist details
- `playlists_getPlaylistItems` - List playlist items
- `comments_getComments` - Get video comments

### Resources & Prompts

* **Resources**:
  * `youtube://transcript/{videoId}`: Access transcripts directly via resource URIs
  * `youtube://info`: Server information and usage documentation
* **Prompts**:
  * `summarize-video`: Automated workflow to get and summarize video content
  * `analyze-channel`: Comprehensive analysis of a channel's content strategy
* **Annotations**: All tools include capability hints (read-only, idempotent) for better LLM performance

## Development

To build from source:

```bash
# Clone repository
git clone https://github.com/Leonine-Studios/youtube-mcp.git
cd youtube-mcp

# Create .env file
cp .env.example .env
# Add your YOUTUBE_API_KEY

# Build and run
docker-compose -f docker-compose.dev.yml up
```

## Multi-User Setup

This server supports multiple simultaneous connections:

- ✅ Single server instance
- ✅ Multiple AI clients can connect
- ✅ Shared YouTube API key
- ✅ Isolated sessions per client

Perfect for teams or remote deployments!

## Architecture

This project uses a **dual-architecture service-based design**:

* **Shared Utilities**: Single source of truth for all MCP server configuration (`src/server-utils.ts`)
* **Modern McpServer**: Updated from deprecated `Server` class to the new `McpServer`
* **Dynamic Version Management**: Version automatically read from `package.json`
* **Type-Safe Tool Registration**: Uses `zod` schemas for input validation
* **ES Modules**: Full ES module support with proper `.js` extensions
* **Enhanced Video Responses**: All video operations include `url` and `videoId` fields
* **Lazy Initialization**: YouTube API client initialized only when needed

### Project Structure

```
src/
├── server-utils.ts        # Shared MCP server utilities (single source of truth)
├── index.ts              # Smithery deployment entry point
├── server.ts             # CLI deployment entry point
├── services/             # Core business logic
│   ├── video.ts         # Video operations (search, getVideo)
│   ├── transcript.ts    # Transcript retrieval
│   ├── playlist.ts      # Playlist operations
│   ├── channel.ts       # Channel operations
│   └── comment.ts       # Comment retrieval
├── types.ts             # TypeScript interfaces
└── cli.ts               # CLI wrapper for standalone execution
```

## Troubleshooting

**Connection timeout?**
```bash
# Check if server is running
docker ps

# View logs
docker logs youtube-mcp
```

**API key issues?**
```bash
# Verify API key is set
docker exec youtube-mcp printenv | grep YOUTUBE_API_KEY

# Test API key
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=YOUR_KEY"
```

## What's Changed from Original

**Main Fix:** Transcript extraction now works. The original used the broken `youtube-transcript` library. This fork uses `@egoist/youtube-transcript-plus` v1.1.2 which is reliable and actively maintained.

**Other Changes:** Docker-first deployment with pre-built GHCR images, Streamable HTTP transport for multi-user support, simplified setup focused on containers, production-ready security hardening, and added comment retrieval.

## License

MIT - See LICENSE file

---

**Original Project:** [sfiorini/youtube-mcp](https://github.com/sfiorini/youtube-mcp)  
**This Fork:** [Leonine-Studios/youtube-mcp](https://github.com/Leonine-Studios/youtube-mcp)
