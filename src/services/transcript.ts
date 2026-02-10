import { TranscriptParams, SearchTranscriptParams } from '../types.js';
import { fetchTranscript } from '@egoist/youtube-transcript-plus';

/**
 * Service for interacting with YouTube video transcripts
 */
export class TranscriptService {
  private initialized = false;

  constructor() {
    // No initialization needed
  }

  private initialize() {
    if (this.initialized) return;
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
      
      // Use @egoist/youtube-transcript-plus to fetch transcripts with language support
      const result = await fetchTranscript(videoId, {
        lang: language
      });
      
      return {
        videoId,
        language,
        title: result.title,
        transcript: result.segments
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
      
      const result = await fetchTranscript(videoId, {
        lang: language
      });
      
      // Search through transcript for the query
      const matches = result.segments.filter((item: any) => 
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
      
      const result = await fetchTranscript(videoId, {
        lang: language
      });
      
      // Format timestamps in human-readable format
      const timestampedTranscript = result.segments.map((item: any) => {
        const seconds = item.offset / 1000;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        return {
          timestamp: formattedTime,
          text: item.text,
          startTimeMs: item.offset,
          durationMs: item.duration
        };
      });
      
      return {
        videoId,
        language,
        title: result.title,
        timestampedTranscript
      };
    } catch (error) {
      throw new Error(`Failed to get timestamped transcript: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
