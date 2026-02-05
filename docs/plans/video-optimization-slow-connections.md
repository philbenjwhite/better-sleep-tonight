# Video Optimization Plan for Slow Internet Connections

## Problem Statement

Users on slow internet connections experience poor video playback with long load times, buffering, and high data usage. The app currently serves full-quality videos (~72MB total) without adapting to connection speed.

---

## Current Architecture

### Video Components
- **VideoBackground** ([VideoBackground.tsx](../../src/components/VideoBackground/VideoBackground.tsx)) - Background video with lazy loading via IntersectionObserver, WebM/MP4 format selection, `preload="metadata"`
- **VideoAvatar** ([VideoAvatar.tsx](../../src/components/VideoAvatar/VideoAvatar.tsx)) - Avatar videos with fallback image support
- **VideoAvatarContext** ([VideoAvatarContext.tsx](../../src/components/VideoAvatar/VideoAvatarContext.tsx)) - Centralized state management with preload mechanism

### Video Assets (in `/public/videos/ashley/`)
| File | Size |
|------|------|
| ashley-1.mp4 | 12.9 MB |
| ashley-2.mp4 | 21.1 MB |
| ashley-3.mp4 | 28.0 MB |
| ashley-4.mp4 | 5.4 MB |
| last-step-avatar.mp4 | 1.1 MB |
| last-step.mp4 | 3.5 MB |
| **Total** | **~72 MB** |

### What's Missing
- No connection quality detection
- No adaptive bitrate/quality switching
- No bandwidth throttling detection
- No user preference for video quality
- No CDN configuration

---

## Implementation Plan

### Phase 1: Connection Quality Detection

#### 1.1 Create `useNetworkStatus` Hook

**New file:** `src/hooks/useNetworkStatus.ts`

Detect connection quality using:
- Network Information API (`navigator.connection`) where supported
- Fallback: timed fetch of small test file (~10KB)
- Monitor `navigator.onLine` for offline detection

```typescript
export enum ConnectionQuality {
  FAST = 'fast',       // >5 Mbps, 4g/wifi
  MODERATE = 'moderate', // 1-5 Mbps, 3g
  SLOW = 'slow',       // <1 Mbps, 2g
  OFFLINE = 'offline'
}
```

#### 1.2 Create `NetworkStatusContext`

**New file:** `src/contexts/NetworkStatusContext.tsx`

Provide network status app-wide following existing context patterns.

---

### Phase 2: Video Quality Tiers

#### 2.1 Create Lower Quality Video Assets

For each video, create additional versions:

| Tier | Resolution | Target Size Reduction |
|------|------------|----------------------|
| High | Original | - |
| Medium | 720p | ~50% |
| Low | 480p | ~75% |

**Naming convention:**
```
ashley-1.mp4          # High (original)
ashley-1-medium.mp4   # Medium (720p)
ashley-1-low.mp4      # Low (480p)
```

#### 2.2 Create `useAdaptiveVideo` Hook

**New file:** `src/hooks/useAdaptiveVideo.ts`

Select video source based on connection quality:
- FAST: Original quality
- MODERATE: Medium quality (-medium.mp4)
- SLOW: Low quality (-low.mp4)
- OFFLINE: Poster image only

---

### Phase 3: Component Updates

#### 3.1 Enhance VideoAvatarContext

**Modify:** `src/components/VideoAvatar/VideoAvatarContext.tsx`

Changes:
- Integrate `useNetworkStatus` for connection awareness
- Adaptive preloading strategy:
  - Fast: Preload next 2 videos
  - Moderate: Preload next 1 video
  - Slow: No preloading, on-demand only
- Add buffering detection via `waiting` event
- New context values: `connectionQuality`, `isBuffering`

#### 3.2 Update VideoAvatar Component

**Modify:** `src/components/VideoAvatar/VideoAvatar.tsx`

New states:
- Buffering indicator overlay
- Poster-only mode for very slow connections
- "Tap to play" prompt when autoplay disabled

#### 3.3 Update VideoBackground Component

**Modify:** `src/components/VideoBackground/VideoBackground.tsx`

Changes:
- Add `disableOnSlowConnection` prop
- Auto-disable video on SLOW/OFFLINE, show poster instead
- Progressive enhancement: start with poster, upgrade to video

---

### Phase 4: User Preferences

#### 4.1 Respect System Save-Data Preference

Check `navigator.connection.saveData` - when enabled:
- Default to poster images
- Disable video preloading
- Show "Tap to play video" prompt

#### 4.2 User Preference Storage

**Skipped** - Quality selection will be fully automatic with no user-facing controls.

---

### Phase 5: Graceful Degradation

Implement fallback cascade:
```
Attempt selected quality video
  ↓ (timeout 10s / error)
Fall back to lower quality
  ↓ (timeout / error)
Show poster image with play button
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useNetworkStatus.ts` | Connection quality detection |
| `src/hooks/useAdaptiveVideo.ts` | Quality-based source selection |
| `src/contexts/NetworkStatusContext.tsx` | App-wide network state |

*Note: No user preferences file needed - quality selection is fully automatic.*

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/VideoAvatar/VideoAvatarContext.tsx` | Add network awareness, adaptive preloading |
| `src/components/VideoAvatar/VideoAvatar.tsx` | Add buffering/poster states |
| `src/components/VideoAvatar/VideoAvatar.module.css` | New loading state styles |
| `src/components/VideoBackground/VideoBackground.tsx` | Add auto-disable option |
| `src/app/layout.tsx` | Wrap with NetworkStatusProvider |

## Video Assets to Create

Run FFmpeg to generate lower quality versions:
```bash
# Medium quality (720p)
ffmpeg -i ashley-1.mp4 -vf scale=-2:720 -c:v libx264 -crf 28 ashley-1-medium.mp4

# Low quality (480p)
ffmpeg -i ashley-1.mp4 -vf scale=-2:480 -c:v libx264 -crf 32 ashley-1-low.mp4
```

---

## Browser Support Notes

**Network Information API:**
- Chrome/Edge: Full support
- Firefox: No support (use fallback)
- Safari: Limited support (use fallback)

**Fallback:** Timed fetch test measures actual download speed.

---

## Verification

1. **Chrome DevTools** - Use Network Throttling presets (Fast 3G, Slow 3G)
2. **Real device testing** - Test on actual slow mobile connections
3. **Check analytics** - Track `video_load_time` events by connection type
4. **Verify graceful degradation** - Disable network, confirm poster fallback works

---

## Implementation Priority

1. **High Impact:** `useNetworkStatus` hook + VideoAvatarContext integration
2. **High Impact:** Create lower-quality video assets
3. **Medium Impact:** VideoAvatar buffering states
4. **Medium Impact:** VideoBackground auto-disable
