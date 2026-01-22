export interface SubtitleCue {
  startTime: number; // seconds
  endTime: number; // seconds
  text: string; // word or phrase
}

export interface SubtitleTrack {
  cues: SubtitleCue[];
  format: 'vtt' | 'srt';
}
