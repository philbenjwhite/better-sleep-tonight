import figma from '@figma/code-connect';
import { QuestionBlock } from './QuestionBlock';

// Update FIGMA_NODE_URL with actual Figma component URL (node-id: 5101:503)
figma.connect(QuestionBlock, 'FIGMA_NODE_URL', {
  props: {
    questionText: figma.string('Question Text'),
  },
  example: (props) => (
    <QuestionBlock
      questionContent={{
        questionText: props.questionText,
        inputType: 'radio',
        answerOptions: [
          { optionId: 'opt1', label: 'Option A', value: 'a', order: 1 },
          { optionId: 'opt2', label: 'Option B', value: 'b', order: 2 },
          { optionId: 'opt3', label: 'Option C', value: 'c', order: 3 },
          { optionId: 'opt4', label: 'Option D', value: 'd', order: 4 },
        ],
      }}
      onAnswerSelect={(option) => console.log('Selected:', option)}
    />
  ),
});
