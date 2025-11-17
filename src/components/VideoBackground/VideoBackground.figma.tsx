import figma from '@figma/code-connect';
import { VideoBackground } from './VideoBackground';

figma.connect(
  VideoBackground,
  'FIGMA_NODE_URL', // Replace with actual Figma node URL
  {
    props: {
      overlayOpacity: figma.enum('Overlay', {
        Light: 0.2,
        Medium: 0.4,
        Dark: 0.6,
      }),
      overlayColor: figma.string('Overlay Color'),
      children: figma.children('Content'),
    },
    example: ({ overlayOpacity, overlayColor, children }) => (
      <VideoBackground
        sources={{
          webm: '/videos/hero-background.webm',
          mp4: '/videos/hero-background.mp4',
          webmMobile: '/videos/hero-background-mobile.webm',
          mp4Mobile: '/videos/hero-background-mobile.mp4',
        }}
        poster="/images/hero-poster.jpg"
        overlayOpacity={overlayOpacity}
        overlayColor={overlayColor}
        lazy={false}
      >
        {children}
      </VideoBackground>
    ),
  }
);
