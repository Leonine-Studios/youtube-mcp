import { google } from 'googleapis';
import { CommentsParams } from '../types.js';

/**
 * Service for retrieving YouTube video comments
 */
export class CommentService {
  private youtube;
  private initialized = false;

  constructor() {
    // Don't initialize in constructor
  }

  /**
   * Initialize the YouTube client only when needed
   */
  private initialize() {
    if (this.initialized) return;
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is not set.');
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
    
    this.initialized = true;
  }

  /**
   * Get comments for a YouTube video
   */
  async getComments({
    videoId,
    maxResults = 20
  }: CommentsParams): Promise<unknown> {
    try {
      this.initialize();

      const response = await this.youtube.commentThreads.list({
        part: ['snippet', 'replies'],
        videoId,
        maxResults,
        order: 'relevance'
      });

      return response.data.items || [];
    } catch (error) {
      // Handle case where comments are disabled
      if (error instanceof Error && error.message.includes('disabled comments')) {
        return { error: 'Comments are disabled for this video' };
      }
      throw new Error(`Failed to get comments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
