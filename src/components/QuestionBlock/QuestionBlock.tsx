'use client';

import { useState } from 'react';
import classNames from 'classnames';
import styles from './QuestionBlock.module.css';
import { AnswerOption } from '../AnswerOption';
import { TextInput } from '../TextInput';

/** Answer option from CMS */
export interface CMSAnswerOption {
  optionId: string;
  label: string;
  value: string;
  order?: number;
  avatarResponse?: string;
  avatarEmotion?: string;
  nextStepOverride?: string;
  terminateFlow?: boolean;
  terminationMessage?: string;
  tags?: string[];
}

/** Question content from CMS */
export interface CMSQuestionContent {
  questionText: string;
  inputType?: 'radio' | 'dropdown' | 'checkbox' | 'button-group' | 'text';
  inputSubtype?: 'text' | 'number' | 'email';
  placeholder?: string;
  helperText?: string;
  isRequired?: boolean;
  answerOptions?: CMSAnswerOption[];
  validation?: {
    min?: number;
    max?: number;
    errorMessage?: string;
  };
  avatarResponse?: string;
  avatarEmotion?: string;
}

export interface QuestionBlockProps {
  /** The question content from CMS */
  questionContent: CMSQuestionContent;
  /** Callback when an answer is selected */
  onAnswerSelect?: (option: CMSAnswerOption) => void;
  /** Callback when text input value changes */
  onTextSubmit?: (value: string) => void;
  /** Currently selected value (controlled mode) */
  selectedValue?: string;
  /** Current text value for text inputs */
  textValue?: string;
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
  onTextSubmit,
  selectedValue,
  textValue = '',
  disabled = false,
  className,
}) => {
  const [internalSelected, setInternalSelected] = useState<string | undefined>(
    selectedValue
  );
  const [internalTextValue, setInternalTextValue] = useState<string>(textValue);
  const [textError, setTextError] = useState<string>('');

  // Use controlled value if provided, otherwise use internal state
  const currentValue = selectedValue !== undefined ? selectedValue : internalSelected;
  // For text input, only use prop value if explicitly passed (not just default empty string)
  const currentTextValue = internalTextValue;

  // Sort options by order if available (only if we have answerOptions)
  const sortedOptions = questionContent.answerOptions
    ? [...questionContent.answerOptions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

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

  const handleTextChange = (value: string) => {
    setInternalTextValue(value);
    setTextError('');
  };

  const handleTextSubmit = () => {
    if (disabled) return;

    // Validate if validation rules exist
    if (questionContent.validation) {
      const numValue = Number(currentTextValue);
      const { min, max, errorMessage } = questionContent.validation;

      if (questionContent.inputSubtype === 'number') {
        if (isNaN(numValue)) {
          setTextError('Please enter a valid number');
          return;
        }
        if (min !== undefined && numValue < min) {
          setTextError(errorMessage || `Value must be at least ${min}`);
          return;
        }
        if (max !== undefined && numValue > max) {
          setTextError(errorMessage || `Value must be at most ${max}`);
          return;
        }
      }
    }

    if (onTextSubmit) {
      onTextSubmit(currentTextValue);
    }
  };

  // Render text input if inputType is 'text'
  if (questionContent.inputType === 'text') {
    return (
      <div className={classNames(styles.questionBlock, className)}>
        <TextInput
          label={questionContent.questionText}
          value={currentTextValue}
          onChange={handleTextChange}
          onSubmit={handleTextSubmit}
          placeholder={questionContent.placeholder}
          type={questionContent.inputSubtype || 'text'}
          helperText={questionContent.helperText}
          error={textError}
          required={questionContent.isRequired}
          disabled={disabled}
        />
      </div>
    );
  }

  // Render option-based inputs (radio, dropdown, etc.)
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
              hasSelection={currentValue !== undefined}
              onSelect={handleSelect}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
