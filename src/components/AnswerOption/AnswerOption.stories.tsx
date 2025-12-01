import type { Meta, StoryObj } from '@storybook/react';
import { AnswerOption } from './AnswerOption';

const meta = {
  title: 'Components/AnswerOption',
  component: AnswerOption,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light-gray',
      values: [
        { name: 'light-gray', value: '#f0ebe5' },
        { name: 'white', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'selected' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnswerOption>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    letter: 'A',
    label: 'I sleep quietly',
    value: 'sleep-quietly',
  },
};

export const Selected: Story = {
  args: {
    letter: 'B',
    label: 'I snore occasionally',
    value: 'snore-occasionally',
    isSelected: true,
  },
};

export const LongText: Story = {
  args: {
    letter: 'C',
    label: 'I have irregular breathing patterns throughout the night',
    value: 'irregular-breathing',
  },
};

export const Disabled: Story = {
  args: {
    letter: 'D',
    label: 'I snore often',
    value: 'snore-often',
    disabled: true,
  },
};

export const AllOptions: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      <AnswerOption letter="A" label="I sleep quietly" value="a" />
      <AnswerOption letter="B" label="I snore occasionally" value="b" />
      <AnswerOption letter="C" label="I snore often" value="c" isSelected />
      <AnswerOption letter="D" label="I have irregular breathing" value="d" />
    </div>
  ),
};
