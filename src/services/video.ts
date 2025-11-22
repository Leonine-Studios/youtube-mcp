import { google } from 'googleapis';
import { VideoParams, SearchParams, TrendingParams, RelatedVideosParams } from '../types.js';

/**
 * Service for interacting with YouTube videos
 */
export class VideoService {
  private youtube;
  private initialized = false;

  constructor() {
    // Don't initialize in constructor
  }

  /**
   * Create a structured video object with URL
   */
  private createStructuredVideo(videoData: unknown): unknown {
    if (!videoData) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = videoData as any;
    const videoId = v.id || v.id?.videoId;
    const url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

    return {
      ...v,
      url,
      videoId
    };
  }

  /**
   * Create structured video objects with URLs for arrays
   */
  private createStructuredVideos(videos: unknown[]): unknown[] {
    return videos.map(video => this.createStructuredVideo(video)).filter(Boolean);
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
   * Get detailed information about a YouTube video
   */
  async getVideo({
    videoId,
    parts = ['snippet', 'contentDetails', 'statistics']
  }: VideoParams): Promise<unknown> {
    try {
      this.initialize();

      const response = await this.youtube.videos.list({
        part: parts,
        id: [videoId]
      });

      const videoData = response.data.items?.[0] || null;
      return this.createStructuredVideo(videoData);
    } catch (error) {
      throw new Error(`Failed to get video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for videos on YouTube
   */
  async searchVideos({
    query,
    maxResults = 10
  }: SearchParams): Promise<unknown[]> {
    try {
      this.initialize();

      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        maxResults,
        type: ['video']
      });

      const videos = response.data.items || [];
      return this.createStructuredVideos(videos);
    } catch (error) {
      throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get video statistics like views, likes, and comments
   */
  async getVideoStats({ 
    videoId 
  }: { videoId: string }): Promise<unknown> {
    try {
      this.initialize();
      
      const response = await this.youtube.videos.list({
        part: ['statistics'],
        id: [videoId]
      });
      
      return response.data.items?.[0]?.statistics || null;
    } catch (error) {
      throw new Error(`Failed to get video stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos({
    regionCode = 'US',
    maxResults = 10,
    videoCategoryId = ''
  }: TrendingParams): Promise<unknown[]> {
    try {
      this.initialize();

      const params = {
        part: ['snippet', 'contentDetails', 'statistics'],
        chart: 'mostPopular',
        regionCode,
        maxResults,
        ...(videoCategoryId && { videoCategoryId })
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.youtube.videos.list(params as any);
      const videos = response.data.items || [];
      return this.createStructuredVideos(videos);
    } catch (error) {
      throw new Error(`Failed to get trending videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get related videos for a specific video
   */
  async getRelatedVideos({
    videoId,
    maxResults = 10
  }: RelatedVideosParams): Promise<unknown[]> {
    try {
      this.initialize();

      const response = await this.youtube.search.list({
        part: ['snippet'],
        relatedToVideoId: videoId,
        maxResults,
        type: ['video']
      });

      const videos = response.data.items || [];
      return this.createStructuredVideos(videos);
    } catch (error) {
      throw new Error(`Failed to get related videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}