# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Better Sleep Tonight is a Tempur-Pedic interactive sleep quiz built with Next.js 15, React 19, and TypeScript. Users watch video avatar segments, answer sleep-related questions, receive mattress recommendations, find nearby stores via Mapbox, and optionally provide their email. All funnel data is tracked in Epsilon PeopleCloud.

## Key Commands

```bash
npm run dev              # Next.js dev server (localhost:3000)
npm run dev:tina         # Dev with TinaCMS local content API
npm run build            # Production build
npm run lint             # ESLint
npm run storybook        # Storybook (localhost:6006)
npm run figma:connect    # Validate Figma Code Connect mappings
npm run figma:publish    # Publish component connections to Figma
```

Node.js is pinned to 22.x (see `engines` in package.json and `.nvmrc`). Vercel builds fail on Node 24 due to `better-sqlite3` (TinaCMS dependency) lacking prebuilt binaries.

No test framework is configured. Use Storybook for visual component review and `?step=N` query param for jumping to specific flow steps during development.

## Architecture

### Flow Engine (the core of the app)

`src/app/page.tsx` is the main orchestrator — a large single-page component that manages the entire quiz flow. It controls:

- **View states**: `currentView` toggles between "intro" and "question" phases
- **Step progression**: `currentStepIndex` walks through steps defined in the flow JSON
- **Answer collection**: `storedAnswers[]` accumulates all user responses with timestamps
- **Video playback**: coordinates with `VideoAvatarProvider` context for avatar videos
- **Session tracking**: `crypto.randomUUID()` per page load, used as Epsilon CustomerKey

**Flow variants**: The `?flow=back-pain` (etc.) query param swaps intro headline/subheadline via `FLOW_CONDITIONS` in page.tsx. All variants use the same underlying flow data from `content/flows/primary-flow.json`.

### Content & Flow Definitions

Flow content lives in `content/` managed by TinaCMS:

- `content/flows/primary-flow.json` — the main flow with all steps
- `content/stepTypes/` — step template schemas
- `content/inputTypes/` — input widget configurations
- `content/locations/` — store location data

Flow steps are typed in `src/config/types.ts` as `FlowStep` with a `_template` discriminator (`questionStep`, `videoStep`, `emailCaptureStep`, `storeLocationsStep`, etc.).

`src/config/flows.ts` loads and registers flows. `src/config/utils.ts` provides `buildFlowData()` and `getProgressSteps()`. `src/config/constants.ts` holds product recommendation data and CTA labels.

### Video Avatar System

The app uses pre-recorded videos (not live HeyGen streaming) stored in `public/videos/ashley/`:

- `VideoAvatarContext` (`src/components/VideoAvatar/VideoAvatarContext.tsx`) manages a playback state machine: IDLE → LOADING → READY → PLAYING → ENDED
- Video registry maps IDs like `'avatar-intro'` to file paths
- Adaptive preloading based on network quality via `useNetworkStatus` hook
- VTT subtitle files parsed by `src/lib/subtitles/` and synced via `useSubtitleSync`

### API Routes — Epsilon PeopleCloud

Two endpoints in `src/app/api/epsilon/`:

| Route | Purpose |
|-------|---------|
| `/api/epsilon/event` | Per-step tracking — POST creates record (step 0), PUT updates subsequent steps |
| `/api/epsilon/submit` | Final email submission — POST with fallback to PUT on duplicate |

Shared auth logic in `_shared.ts`: OAuth token caching, step-to-field mapping (`STEP_TO_EPSILON_FIELD`), list endpoint URL. Records are keyed by `CustomerKey` (sessionId for events, email for submit).

Epsilon calls are fire-and-forget — failures are logged but don't block the user flow. The `EPSILON_OUID` env var gates whether tracking is active.

### Thank-You Page

After email submission on the booking CTA step, users are redirected to `/thank-you`. The Epsilon submit call is fire-and-forget so it never blocks the redirect. The page shares the same Header (no volume button) and Footer (no progress bar) as the main app.

### Analytics

Three tracking layers:
1. **GTM/GA4** — configured in `src/app/layout.tsx`
2. **Epsilon PeopleCloud** — per-step + final submission (see API routes above)
3. **Custom analytics** in `src/lib/analytics/` — video engagement, scroll depth, conversions

GA4 events are fired programmatically via `gtag()` in `src/lib/analytics/conversionTracking.ts`. Key events: `quiz_start`, `quiz_step` (with `quiz_step` number and `step_id`), `quiz_complete`, `buy_now_click`, `store_search`. Since this is a SPA with no URL changes between steps, GTM triggers must be event-based, not pageview-based.

### Key Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useProgressPersistence` | `src/hooks/` | localStorage save/load with 7-day expiration |
| `useNetworkStatus` | `src/hooks/` | Connection quality detection (FAST/4G/3G/SLOW) |
| `useAdaptiveVideo` | `src/hooks/` | Video preload strategy based on network |
| `useSubtitleSync` | `src/hooks/` | Sync VTT captions to video playback |
| `useVideoAvatar` | `src/components/VideoAvatar/` | Context consumer for video state |

### Store Locator

Uses Mapbox GL for map rendering and geocoding (`src/lib/geocoding.ts`). The `StoreLocations` component accepts a postal code, geocodes it, and displays nearby stores from CMS data.

## Conventions

- **Path alias**: `@/*` maps to `src/*`
- **Styling**: CSS Modules with `classnames` for conditional composition
- **Icons**: `@phosphor-icons/react`
- **Animations**: GSAP
- **Component structure**: `ComponentName/` directory with `.tsx`, `.module.css`, `.stories.tsx`, `.figma.tsx`, `index.ts`
- **Props pattern**: TypeScript interface exported as `ComponentNameProps`

## Environment Variables

```
NEXT_PUBLIC_MAPBOX_TOKEN       # Mapbox (store locator + geocoding)
NEXT_PUBLIC_TINA_CLIENT_ID     # TinaCMS client ID
TINA_TOKEN                     # TinaCMS read-only token
NEXT_PUBLIC_APP_URL            # App URL
EPSILON_CLIENT_ID              # Epsilon OAuth
EPSILON_CLIENT_SECRET
EPSILON_API_USERNAME
EPSILON_API_PASSWORD
EPSILON_OUID                   # Epsilon org unit ID (omit to disable tracking)
```
