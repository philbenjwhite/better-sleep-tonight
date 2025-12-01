import figma from '@figma/code-connect';
import { AnswerOption } from './AnswerOption';

// Update FIGMA_NODE_URL with actual Figma component URL
figma.connect(AnswerOption, 'FIGMA_NODE_URL', {
  props: {
    letter: figma.string('Letter'),
    label: figma.string('Label'),
    isSelected: figma.boolean('Selected'),
  },
  example: (props) => (
    <AnswerOption
      letter={props.letter}
      label={props.label}
      value="option-value"
      isSelected={props.isSelected}
      onSelect={(value) => console.log('Selected:', value)}
    />
  ),
});
