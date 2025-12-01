'use client';

import { useState } from 'react';
import classNames from 'classnames';
import styles from './QuestionBlock.module.css';
import { AnswerOption } from '../AnswerOption';

/** Answer option from CMS */
export interface CMSAnswerOption {
  optionId: string;
  label: string;
  value: string;
  order?: number;
  avatarResponse?: string;
  avatarEmotion?: string;
  tags?: string[];
}

/** Question content from CMS */
export interface CMSQuestionContent {
  questionText: string;
  inputType?: 'radio' | 'dropdown' | 'checkbox' | 'button-group';
  helperText?: string;
  isRequired?: boolean;
  answerOptions: CMSAnswerOption[];
}

export interface QuestionBlockProps {
  /** The question content from CMS */
  questionContent: CMSQuestionContent;
  /** Callback when an answer is selected */
  onAnswerSelect?: (option: CMSAnswerOption) => void;
  /** Currently selected value (controlled mode) */
  selectedValue?: string;
  /** Whether the block is disabled */
  disabled?: boolean;
  /** Optional class name */
  className?: string;
}

/** Convert index to letter (0 -> A, 1 -> B, etc.) */
const indexToLetter = (index: number): string => {
  return String.fromCharCode(65 + index);
};

export const QuestionBlock: React.FC<QuestionBlockProps> = ({
  questionContent,
  onAnswerSelect,
  selectedValue,
  disabled = false,
  className,
}) => {
  const [internalSelected, setInternalSelected] = useState<string | undefined>(
    selectedValue
  );

  // Use controlled value if provided, otherwise use internal state
  const currentValue = selectedValue !== undefined ? selectedValue : internalSelected;

  // Sort options by order if available
  const sortedOptions = [...questionContent.answerOptions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const handleSelect = (value: string) => {
    if (disabled) return;

    // Update internal state for uncontrolled mode
    if (selectedValue === undefined) {
      setInternalSelected(value);
    }

    // Find the selected option and call the callback
    const selectedOption = sortedOptions.find((opt) => opt.value === value);
    if (selectedOption && onAnswerSelect) {
      onAnswerSelect(selectedOption);
    }
  };

  return (
    <div className={classNames(styles.questionBlock, className)}>
      <h2 className={styles.questionText}>{questionContent.questionText}</h2>

      {questionContent.helperText && (
        <p className={styles.helperText}>{questionContent.helperText}</p>
      )}

      <div className={styles.answersContainer}>
        <div className={styles.answersList}>
          {sortedOptions.map((option, index) => (
            <AnswerOption
              key={option.optionId}
              letter={indexToLetter(index)}
              label={option.label}
              value={option.value}
              isSelected={currentValue === option.value}
              onSelect={handleSelect}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
