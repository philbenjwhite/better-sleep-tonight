import type { Meta, StoryObj } from '@storybook/react';
import { NextButton } from './NextButton';

const meta = {
  title: 'Components/NextButton',
  component: NextButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
    },
    variant: {
      control: 'inline-radio',
      options: ['ghost', 'primary'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof NextButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Getting past a segment that is still playing. */
export const Skip: Story = {
  args: {
    label: 'Skip',
    variant: 'ghost',
    disabled: false,
  },
};

/** Carrying an answered question forward, the state a step back leaves. */
export const Next: Story = {
  args: {
    label: 'Next',
    variant: 'primary',
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Next',
    disabled: true,
  },
};
