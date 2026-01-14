declare module 'youtube-caption-extractor' {
  export interface Subtitle {
    text: string;
    start: string;
    dur: string;
  }

  export interface VideoDetails {
    title: string;
    description: string;
    lengthSeconds: string;
    viewCount: string;
  }

  export function getSubtitles(options: { videoID: string; lang?: string }): Promise<Subtitle[]>;
  export function getVideoDetails(options: { videoID: string; lang?: string }): Promise<VideoDetails>;
}