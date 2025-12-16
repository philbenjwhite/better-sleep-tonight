# Plan: Replace HeyGen Streaming with Pre-recorded MP4s

## Overview

Replace the HeyGen streaming avatar with pre-recorded MP4 video files. This simplifies the codebase, removes API dependencies, and allows for higher quality pre-produced videos.

## Current State

- HeyGen streaming avatar connects via WebSocket and renders to a `<video>` element via MediaStream
- `speak(text)` function triggers the avatar to speak dynamically
- `isAvatarTalking` state tracks when avatar starts/stops speaking
- Avatar responses exist in CMS but most are currently disabled (only intro, summary sequence, and termination messages play)

## Proposed Architecture

### Video Types Needed

Based on the current flow, we need MP4s for:

1. **Intro Video** - Already exists: `/uploads/Mattress_Shopping.mp4` (background video)
2. **Avatar Intro Speech** - Ashley's intro script (~15-20 seconds)
3. **Answer Summary** - Dynamic, but could be 3-5 template variations
4. **Empathy Message** - 1-2 variations
5. **Email CTA Message** - 1 video

### Background While User Answers Questions

**Decision**: No separate idle loop video. Options:
- **Looping video** behind the question overlay (subtle movement)
- **Static image** of Ashley (simpler, current fallback already exists)

Video will include natural pause at the end before auto-advancing to next step.

### Storage

**Decision**: `/public/videos/` in the repo for now. Can move to CDN later if needed.

---

## Implementation Plan

### Phase 1: Create VideoAvatar Component (Replaces HeyGenAvatar)

**New component: `src/components/VideoAvatar/`**

```
VideoAvatar/
├── VideoAvatar.tsx        # Video element with MP4 source
├── VideoAvatar.module.css # Reuse existing HeyGen styles
├── VideoAvatarContext.tsx # Provider with play(), isPlaying state
└── index.ts
```

**Key changes from HeyGen:**
- `srcObject={stream}` → `<source src={videoUrl} />`
- `speak(text)` → `play(videoId)` - plays a specific MP4
- HeyGen events → HTML5 video events (`onPlay`, `onEnded`, `onLoadedData`)
- `isAvatarTalking` → `isVideoPlaying`

**VideoAvatarContext interface:**
```typescript
interface VideoAvatarContextType {
  isPlaying: boolean;
  isLoaded: boolean;
  currentVideoId: string | null;
  play: (videoId: string) => Promise<void>;
  stop: () => void;
  preload: (videoIds: string[]) => void;
}
```

### Phase 2: Video Registry

**New file: `src/config/videos.ts`**

```typescript
export const VIDEO_REGISTRY = {
  // Intro/idle
  'avatar-intro': '/videos/avatar/intro.mp4',
  'avatar-idle': '/videos/avatar/idle-loop.mp4',

  // Summary sequence
  'summary-back-pain': '/videos/avatar/summary-back-pain.mp4',
  'empathy-general': '/videos/avatar/empathy-general.mp4',
  'email-cta': '/videos/avatar/email-cta.mp4',

  // Termination
  'termination-no-issues': '/videos/avatar/termination-no-issues.mp4',

  // Future: per-question responses (optional)
  // 'q1-every-night': '/videos/avatar/q1-every-night.mp4',
};

export type VideoId = keyof typeof VIDEO_REGISTRY;
```

### Phase 3: Update page.tsx Flow Logic

**Replace speak() calls with play():**

```typescript
// Before (HeyGen)
speak(introMessage);

// After (MP4)
play('avatar-intro');
```

**Replace isAvatarTalking checks:**

```typescript
// Before
if (avatarStartedTalking && !isAvatarTalking) {
  // Avatar finished speaking
}

// After
if (videoStarted && !isVideoPlaying) {
  // Video finished playing
}
```

### Phase 4: Simplify Flow JSON

Since videos are pre-recorded, we can simplify the CMS:

```json
{
  "stepId": "intro-step",
  "headerContent": {
    "headline": "Wake Up Without Back Pain",
    "avatarVideoId": "avatar-intro",  // NEW: Reference to video
    // Remove: avatarIntroScript (text is baked into video)
  }
}
```

Or keep text for captions/accessibility while video plays.

### Phase 5: Remove HeyGen Dependencies

**Files to delete:**
- `src/components/HeyGenAvatar/` (entire folder)
- `src/app/api/heygen-token/route.ts`
- `src/app/api/heygen-avatars/route.ts`

**Dependencies to remove:**
```bash
npm uninstall @heygen/streaming-avatar
```

**Environment variables to remove:**
- `HEYGEN_API_KEY`

---

## Video Production Requirements

### Required MP4s (Minimum Viable)

| Video ID | Content | Est. Duration |
|----------|---------|---------------|
| `avatar-intro` | Ashley's intro script | 15-20s |
| `avatar-idle` | Subtle idle animation (loop) | 3-5s |
| `summary-back-pain` | Summary for back pain flow | 10-15s |
| `empathy-general` | Empathy message | 5-8s |
| `email-cta` | Email CTA prompt | 5-8s |
| `termination-general` | Generic termination | 8-10s |

### Video Specs

- **Resolution**: 1080p (1920x1080) or 720p (1280x720)
- **Format**: MP4 (H.264 codec for broad compatibility)
- **Aspect Ratio**: Match current avatar display (portrait-ish, ~9:16 or 3:4)
- **Frame Rate**: 30fps
- **Audio**: AAC, normalized levels

---

## Migration Strategy

### Option A: Big Bang (Recommended for this project)
1. Build VideoAvatar component
2. Update page.tsx to use new component
3. Remove HeyGen entirely
4. Test thoroughly
5. Deploy

### Option B: Feature Flag
1. Build VideoAvatar alongside HeyGen
2. Add toggle: `const USE_MP4_AVATAR = true`
3. Gradually migrate triggers
4. Remove HeyGen when stable

---

## Estimated Effort

| Task | Effort |
|------|--------|
| VideoAvatar component | 2-3 hours |
| Video registry & config | 30 min |
| Update page.tsx flow logic | 2-3 hours |
| Remove HeyGen code | 30 min |
| Testing | 1-2 hours |
| **Total** | **6-9 hours** |

(Does not include video production time)

---

## Decisions Made

1. **Video hosting**: `/public/videos/` in repo ✓
2. **Idle state**: Either looping video or static image behind question overlay - no separate idle video needed ✓
3. **Timing**: Videos include natural pause at end, then auto-advance ✓

## Open Questions

1. **Captions**: Display text alongside video for accessibility?
2. **Fallback**: What to show if video fails to load?
3. **Background**: Looping video vs static image while questions display?

---

## Next Steps

1. [ ] Decide on video hosting approach
2. [ ] Get/create placeholder MP4s for development
3. [ ] Build VideoAvatar component
4. [ ] Update page.tsx to use VideoAvatar
5. [ ] Remove HeyGen dependencies
6. [ ] Test full flow
7. [ ] Production video assets
