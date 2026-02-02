import { TranscriptParams, SearchTranscriptParams } from '../types.js';
import ytTranscriptApi from 'yt-transcript-api';
const { YouTubeTranscriptApi } = ytTranscriptApi;

/**
 * Service for interacting with YouTube video transcripts
 */
export class TranscriptService {
  // No YouTube API key needed for transcripts, but we'll implement the same pattern
  private initialized = false;

  constructor() {
    // No initialization needed
  }

  private initialize() {
    if (this.initialized) return;
    // No API key needed for transcripts, but we'll check if language is set
    this.initialized = true;
  }

  /**
   * Get the transcript of a YouTube video
   */
  async getTranscript({ 
    videoId, 
    language = process.env.YOUTUBE_TRANSCRIPT_LANG || 'en' 
  }: TranscriptParams): Promise<unknown> {
    try {
      this.initialize();
      
      // Use yt-transcript-api to fetch subtitles (lang parameter not supported in current version)
      const transcript = await YouTubeTranscriptApi.getTranscript(videoId);
      
      return {
        videoId,
        language,
        transcript
      };
    } catch (error) {
      throw new Error(`Failed to get transcript: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search within a transcript
   */
  async searchTranscript({ 
    videoId, 
    query,
    language = process.env.YOUTUBE_TRANSCRIPT_LANG || 'en' 
  }: SearchTranscriptParams): Promise<unknown> {
    try {
      this.initialize();
      
      const transcript = await YouTubeTranscriptApi.getTranscript(videoId);
      
      // Search through transcript for the query
      const matches = transcript.filter((item: any) => 
        item.text.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        videoId,
        language,
        query,
        matches,
        totalMatches: matches.length
      };
    } catch (error) {
      throw new Error(`Failed to search transcript: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get transcript with timestamps
   */
  async getTimestampedTranscript({ 
    videoId, 
    language = process.env.YOUTUBE_TRANSCRIPT_LANG || 'en' 
  }: TranscriptParams): Promise<unknown> {
    try {
      this.initialize();
      
      const transcript = await YouTubeTranscriptApi.getTranscript(videoId);
      
      // Format timestamps in human-readable format
      const timestampedTranscript = transcript.map((item: any) => {
        const seconds = parseFloat(item.start);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        return {
          timestamp: formattedTime,
          text: item.text,
          startTimeMs: parseFloat(item.start) * 1000,
          durationMs: parseFloat(item.duration) * 1000
        };
      });
      
      return {
        videoId,
        language,
        timestampedTranscript
      };
    } catch (error) {
      throw new Error(`Failed to get timestamped transcript: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}