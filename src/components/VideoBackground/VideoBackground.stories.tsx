import type { Meta, StoryObj } from '@storybook/react';
import { VideoBackground } from './VideoBackground';

const meta: Meta<typeof VideoBackground> = {
  title: 'Components/VideoBackground',
  component: VideoBackground,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    overlayOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
    },
    overlayColor: {
      control: 'color',
    },
    playbackRate: {
      control: { type: 'range', min: 0.25, max: 2, step: 0.25 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VideoBackground>;

// Using a free video from Pexels as placeholder
const placeholderVideo = 'https://player.vimeo.com/external/396759244.sd.mp4?s=55946e1bdf8de0027028e797e0c0b7f5e30d8ef1&profile_id=165&oauth2_token_id=57447761';
const placeholderPoster = 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1920&h=1080&fit=crop';

export const Default: Story = {
  args: {
    sources: {
      webm: placeholderVideo,
      mp4: placeholderVideo,
    },
    poster: placeholderPoster,
    alt: 'Peaceful bedroom scene with soft lighting',
    overlayOpacity: 0.3,
    overlayColor: '#000000',
    lazy: false,
  },
  render: (args) => (
    <VideoBackground {...args}>
      <div style={{ textAlign: 'center', maxWidth: '900px' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', marginBottom: '1.5rem', fontWeight: 700, lineHeight: 1.2, textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
          Transform Your Sleep
        </h1>
        <p style={{ fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', marginBottom: '2.5rem', opacity: 0.95, textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>
          Discover premium sleep solutions designed for your comfort
        </p>
      </div>
    </VideoBackground>
  ),
};

export const DarkOverlay: Story = {
  args: {
    ...Default.args,
    overlayOpacity: 0.6,
    overlayColor: '#000000',
  },
  render: Default.render,
};

export const ColoredOverlay: Story = {
  args: {
    ...Default.args,
    overlayOpacity: 0.5,
    overlayColor: '#1e3a8a',
  },
  render: Default.render,
};

export const LightOverlay: Story = {
  args: {
    ...Default.args,
    overlayOpacity: 0.2,
    overlayColor: '#000000',
  },
  render: Default.render,
};

export const WithCTAButtons: Story = {
  args: Default.args,
  render: (args) => (
    <VideoBackground {...args}>
      <div style={{ textAlign: 'center', maxWidth: '900px' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', marginBottom: '1.5rem', fontWeight: 700, lineHeight: 1.2, textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
          Better Sleep,<br />Better Life
        </h1>
        <p style={{ fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', marginBottom: '2.5rem', opacity: 0.95, textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)', lineHeight: 1.6 }}>
          Join 50,000+ people sleeping better with science-backed solutions
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{ padding: '1rem 2rem', fontSize: '1.125rem', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'white', color: '#000', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            Take Sleep Quiz
          </button>
          <button style={{ padding: '1rem 2rem', fontSize: '1.125rem', fontWeight: 600, borderRadius: '8px', border: '2px solid white', background: 'transparent', color: 'white', cursor: 'pointer' }}>
            Learn More
          </button>
        </div>
        <div style={{ marginTop: '2rem', fontSize: '0.875rem', opacity: 0.9 }}>
          ⭐⭐⭐⭐⭐ 4.8 (2,847 reviews) • 90-Night Trial • Free Shipping
        </div>
      </div>
    </VideoBackground>
  ),
};

export const SlowMotion: Story = {
  args: {
    ...Default.args,
    playbackRate: 0.75,
  },
  render: (args) => (
    <VideoBackground {...args}>
      <div style={{ textAlign: 'center', maxWidth: '900px' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', marginBottom: '1.5rem', fontWeight: 700, lineHeight: 1.2, textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
          Slow Motion<br />Dreamy Effect
        </h1>
        <p style={{ fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', marginBottom: '2.5rem', opacity: 0.95, textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>
          Video playing at 75% speed for ethereal feel
        </p>
      </div>
    </VideoBackground>
  ),
};

export const MinimalContent: Story = {
  args: Default.args,
  render: (args) => (
    <VideoBackground {...args}>
      <h1 style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', fontWeight: 700, textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5)', letterSpacing: '-0.02em' }}>
        Sleep Better
      </h1>
    </VideoBackground>
  ),
};
