import { SubtitleCue, SubtitleTrack } from './types';

function parseTimestamp(timestamp: string): number {
  // Handle both VTT (.) and SRT (,) decimal separators
  const normalized = timestamp.replace(',', '.');
  const [time, ms] = normalized.split('.');
  const parts = time.split(':').map(Number);

  // Handle both HH:MM:SS and MM:SS formats
  let hours = 0, minutes = 0, seconds = 0;
  if (parts.length === 3) {
    [hours, minutes, seconds] = parts;
  } else if (parts.length === 2) {
    [minutes, seconds] = parts;
  }

  return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
}

export function parseVtt(vttContent: string): SubtitleTrack {
  const lines = vttContent.trim().split('\n');
  const cues: SubtitleCue[] = [];

  // Skip WEBVTT header
  let i = lines[0]?.startsWith('WEBVTT') ? 1 : 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for timestamp line (supports both HH:MM:SS.mmm and MM:SS.mmm formats)
    const timestampMatch = line.match(
      /(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})/
    );

    if (timestampMatch) {
      const startTime = parseTimestamp(timestampMatch[1]);
      const endTime = parseTimestamp(timestampMatch[2]);

      // Next line(s) contain the text
      i++;
      let text = '';
      while (i < lines.length && lines[i].trim() !== '') {
        text += (text ? ' ' : '') + lines[i].trim();
        i++;
      }

      if (text) {
        cues.push({ startTime, endTime, text });
      }
    }
    i++;
  }

  return { cues, format: 'vtt' };
}

export function getVttPathFromVideo(videoPath: string): string {
  return videoPath.replace(/\.(mp4|webm)$/, '.vtt');
}
