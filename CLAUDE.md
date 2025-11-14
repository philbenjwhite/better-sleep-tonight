# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Better Sleep Shop is a Next.js 15 application using TypeScript, CSS Modules, and Storybook for component development. The project integrates with Figma Code Connect for design-to-code workflows and includes HeyGen streaming avatar functionality.

## Key Commands

### Development
```bash
npm run dev            # Start Next.js development server (http://localhost:3000)
npm run storybook      # Start Storybook dev server (http://localhost:6006)
```

### Build & Production
```bash
npm run build                # Build Next.js for production
npm run start                # Start production server
npm run build-storybook      # Build Storybook static site
```

### Code Quality
```bash
npm run lint           # Run ESLint
```

### Figma Integration
```bash
npm run figma:connect  # Validate Figma Code Connect mappings
npm run figma:publish  # Publish component connections to Figma
```

## Architecture

### Component Structure

All components follow a consistent directory pattern:

```
src/components/ComponentName/
├── ComponentName.tsx           # Component implementation
├── ComponentName.module.css    # CSS Modules styles
├── ComponentName.stories.tsx   # Storybook stories
├── ComponentName.figma.tsx     # Figma Code Connect mapping
└── index.ts                    # Barrel export
```

**Key Patterns:**
- Components use TypeScript interfaces exported as `ComponentNameProps`
- CSS Modules for scoped styling (imported as `styles`)
- `classnames` library for conditional class composition
- Props typically include variants, size, and callbacks

### App Router Structure

Uses Next.js 15 App Router:
- `src/app/layout.tsx` - Root layout with metadata
- `src/app/page.tsx` - Home page
- `src/app/globals.css` - Global styles

### Path Aliases

TypeScript is configured with `@/*` alias mapping to `src/*`:
```tsx
import { Button } from '@/components/Button';
```

### Styling Approach

- **CSS Modules** for component-scoped styles
- Global styles in `src/app/globals.css`
- `classnames` utility for combining CSS classes conditionally

Example pattern:
```tsx
import classNames from 'classnames';
import styles from './Component.module.css';

className={classNames(
  styles.baseClass,
  styles[variant],
  { [styles.modifier]: condition }
)}
```

### Storybook Integration

- Stories located alongside components in `*.stories.tsx` files
- Storybook configured for Next.js framework (@storybook/nextjs)
- All `src/**/*.stories.tsx` files automatically discovered
- Uses addon-essentials, addon-interactions, and addon-links

### Figma Code Connect

Components are mapped to Figma designs using `*.figma.tsx` files:
- Pattern: `figma.connect(Component, 'FIGMA_NODE_URL', { props, example })`
- Props map Figma component properties to React props
- Config: `figma.config.json` specifies included/excluded patterns
- Update Figma node URLs before using `figma:connect` or `figma:publish`

### Component Examples

**Button Component** - Reference implementation showing:
- TypeScript props with variants (`primary`, `secondary`, `tertiary`)
- Size variants (`small`, `medium`, `large`)
- CSS Modules with conditional classNames
- Complete Storybook stories
- Figma Code Connect mapping

**Card Component** - Demonstrates:
- Default props pattern
- Optional button rendering
- Variant system (`default`, `no-border`)
- Image placeholder handling

**CardGrid Component** - Shows:
- Children-based composition
- Grid layout with CSS Modules

## Key Dependencies

- `@heygen/streaming-avatar` - HeyGen avatar streaming integration
- `classnames` - CSS class composition utility
- `date-fns` - Date manipulation (prefer over moment.js)
- React 19 and Next.js 15.1.4

## Development Guidelines

### Creating New Components

1. Create component directory in `src/components/`
2. Add `.tsx`, `.module.css`, `.stories.tsx`, and `.figma.tsx` files
3. Export via `index.ts` barrel file
4. Follow existing naming and typing conventions

### Working with Figma

1. Create `*.figma.tsx` file alongside component
2. Use `figma.connect()` to map Figma properties to React props
3. Replace `FIGMA_NODE_URL` placeholder with actual Figma component URL
4. Validate with `npm run figma:connect`
5. Publish with `npm run figma:publish`
