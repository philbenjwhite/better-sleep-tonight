import type { Meta, StoryObj } from '@storybook/react';
import { BackButton } from './BackButton';

const meta = {
  title: 'Components/BackButton',
  component: BackButton,
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
} satisfies Meta<typeof BackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Back',
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Back',
    disabled: true,
  },
};
