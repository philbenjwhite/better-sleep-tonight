import type { Meta, StoryObj } from '@storybook/react';
import { QuestionBlock, CMSQuestionContent } from './QuestionBlock';

const meta = {
  title: 'Components/QuestionBlock',
  component: QuestionBlock,
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
    onAnswerSelect: { action: 'answer selected' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuestionBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample CMS data matching the back-pain flow
const painLocationQuestion: CMSQuestionContent = {
  questionText: 'First things first - where exactly do you feel your back pain the most?',
  inputType: 'radio',
  helperText: 'Select the area that bothers you most',
  isRequired: true,
  answerOptions: [
    {
      optionId: 'bp2-opt1',
      label: 'Lower back (lumbar area)',
      value: 'lower-back',
      order: 1,
      avatarResponse: 'Ah, the lower back - that\'s the most common spot...',
    },
    {
      optionId: 'bp2-opt2',
      label: 'Middle back (thoracic area)',
      value: 'middle-back',
      order: 2,
      avatarResponse: 'Middle back pain is tricky...',
    },
    {
      optionId: 'bp2-opt3',
      label: 'Upper back (between shoulder blades)',
      value: 'upper-back',
      order: 3,
      avatarResponse: 'That area between your shoulder blades...',
    },
    {
      optionId: 'bp2-opt4',
      label: 'Multiple areas',
      value: 'multiple-areas',
      order: 4,
      avatarResponse: 'When the pain shows up in multiple places...',
    },
  ],
};

const sleepExperienceQuestion: CMSQuestionContent = {
  questionText: 'How would you describe your typical sleep experience at night?',
  inputType: 'radio',
  isRequired: true,
  answerOptions: [
    {
      optionId: 'opt1',
      label: 'I sleep quietly',
      value: 'sleep-quietly',
      order: 1,
    },
    {
      optionId: 'opt2',
      label: 'I snore occasionally',
      value: 'snore-occasionally',
      order: 2,
    },
    {
      optionId: 'opt3',
      label: 'I snore often',
      value: 'snore-often',
      order: 3,
    },
    {
      optionId: 'opt4',
      label: 'I have irregular breathing',
      value: 'irregular-breathing',
      order: 4,
    },
  ],
};

const discomfortTypeQuestion: CMSQuestionContent = {
  questionText: 'How would you describe the sensation? What does your pain actually feel like?',
  inputType: 'radio',
  helperText: 'Choose the description that fits best',
  isRequired: true,
  answerOptions: [
    {
      optionId: 'bp3-opt1',
      label: 'Tight and tense',
      value: 'tightness',
      order: 1,
    },
    {
      optionId: 'bp3-opt2',
      label: 'Sharp or stabbing',
      value: 'sharp-pain',
      order: 2,
    },
    {
      optionId: 'bp3-opt3',
      label: 'Dull and achy',
      value: 'dull-ache',
      order: 3,
    },
    {
      optionId: 'bp3-opt4',
      label: 'Stiff and hard to move',
      value: 'stiffness',
      order: 4,
    },
    {
      optionId: 'bp3-opt5',
      label: 'Burning or radiating',
      value: 'burning',
      order: 5,
    },
    {
      optionId: 'bp3-opt6',
      label: 'It varies day to day',
      value: 'varies',
      order: 6,
    },
  ],
};

export const Default: Story = {
  args: {
    questionContent: sleepExperienceQuestion,
  },
};

export const WithHelperText: Story = {
  args: {
    questionContent: painLocationQuestion,
  },
};

export const ManyOptions: Story = {
  args: {
    questionContent: discomfortTypeQuestion,
  },
};

export const WithSelectedValue: Story = {
  args: {
    questionContent: sleepExperienceQuestion,
    selectedValue: 'snore-occasionally',
  },
};

export const Disabled: Story = {
  args: {
    questionContent: sleepExperienceQuestion,
    disabled: true,
  },
};

export const FromCMSBackPainFlow: Story = {
  name: 'CMS: Back Pain - Pain Location',
  args: {
    questionContent: painLocationQuestion,
  },
};

export const Interactive: StoryObj = {
  name: 'Interactive Demo',
  render: function InteractiveDemo() {
    return (
      <QuestionBlock
        questionContent={painLocationQuestion}
        onAnswerSelect={(option) => {
          console.log('Selected:', option);
          alert(`You selected: ${option.label}\n\nAshley says: "${option.avatarResponse}"`);
        }}
      />
    );
  },
};
