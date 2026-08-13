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
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof NextButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Next',
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Next',
    disabled: true,
  },
};
