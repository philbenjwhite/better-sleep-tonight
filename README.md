# Better Sleep Tonight

A Next.js application built with TypeScript, CSS Modules, and Storybook.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **CSS Modules** - Scoped styling
- **Storybook** - Component development and documentation
- **Figma Code Connect** - Design-code integration

## Key Packages

- `@heygen/streaming-avatar` - HeyGen streaming avatar integration
- `classnames` - CSS class name utility
- `date-fns` - Date manipulation library

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

Run the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Storybook

Run Storybook for component development:

```bash
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) to view Storybook.

## Project Structure

```
better-sleep-tonight/
├── .storybook/          # Storybook configuration
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── layout.tsx  # Root layout
│   │   ├── page.tsx    # Home page
│   │   └── globals.css # Global styles
│   └── components/     # Reusable components
│       └── Button/     # Example Button component
│           ├── Button.tsx
│           ├── Button.module.css
│           ├── Button.stories.tsx
│           ├── Button.figma.tsx
│           └── index.ts
├── figma.config.json   # Figma Code Connect configuration
├── next.config.ts      # Next.js configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Figma Code Connect

This project is configured to work with Figma Code Connect. To link your components to Figma:

1. Update the Figma node URLs in `*.figma.tsx` files
2. Run `npm run figma:connect` to validate connections
3. Run `npm run figma:publish` to publish to Figma

See [Figma Code Connect documentation](https://www.figma.com/developers/code-connect) for more details.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run storybook` - Start Storybook
- `npm run build-storybook` - Build Storybook for deployment
- `npm run figma:connect` - Validate Figma connections
- `npm run figma:publish` - Publish to Figma

## CSS Modules

Components use CSS Modules for scoped styling. Import styles like:

```tsx
import styles from './Component.module.css';
```

## HeyGen Avatar Dev Mode

The HeyGen avatar integration includes a **dev mode** to avoid API calls during development:

### Enable Dev Mode

In [src/app/page.tsx](src/app/page.tsx), set the constant:

```tsx
const HEYGEN_DEV_MODE = true;  // Skip API calls, show placeholder
const HEYGEN_DEV_MODE = false; // Use real HeyGen API
```

### What Dev Mode Does

1. **Provider (`devMode` prop)** - Simulates avatar behavior without API calls:
   - Connection delay (1 second simulated)
   - Speaking duration based on word count (~100ms per word)
   - Logs actions to console with `[DEV MODE]` prefix

2. **Avatar Component (`placeholder` prop)** - Shows a styled placeholder:
   - Displays the fallback image
   - Overlays "Avatar Placeholder" label with dashed border
   - Matches exact dimensions of the real avatar

### Usage

```tsx
// In the provider
<HeyGenProvider avatarId="Ann_Therapist_public" devMode={HEYGEN_DEV_MODE}>

// In the avatar component
<HeyGenAvatar placeholder={HEYGEN_DEV_MODE} />
```

This saves HeyGen credits during UI development while maintaining the full flow logic.

### Skip to Question (URL Parameter)

Use the `step` query parameter to skip directly to a specific question:

```
http://localhost:3000/?step=1  # Question 1 (skips intro)
http://localhost:3000/?step=2  # Question 2
http://localhost:3000/?step=3  # Question 3
http://localhost:3000/         # Normal flow with intro
```

This is useful for testing specific questions without clicking through the entire flow.

## Example Component

The Button component demonstrates best practices:

- TypeScript types for props
- CSS Modules for styling
- Storybook stories for documentation
- Figma Code Connect integration
