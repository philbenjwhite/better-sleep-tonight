# Better Sleep Shop

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
better-sleep-shop/
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

## Example Component

The Button component demonstrates best practices:

- TypeScript types for props
- CSS Modules for styling
- Storybook stories for documentation
- Figma Code Connect integration
