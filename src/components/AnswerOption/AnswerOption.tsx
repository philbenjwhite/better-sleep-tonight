import classNames from 'classnames';
import styles from './AnswerOption.module.css';

export interface AnswerOptionProps {
  /** The option identifier (e.g., "A", "B", "C", "D") */
  letter: string;
  /** The display label for the option */
  label: string;
  /** The value to submit when selected */
  value: string;
  /** Whether this option is currently selected */
  isSelected?: boolean;
  /** Callback when the option is clicked */
  onSelect?: (value: string) => void;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({
  letter,
  label,
  value,
  isSelected = false,
  onSelect,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onSelect) {
      e.preventDefault();
      onSelect(value);
    }
  };

  return (
    <div
      className={classNames(styles.answerOption, {
        [styles.selected]: isSelected,
        [styles.disabled]: disabled,
      })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      <span className={styles.label}>
        {letter}. {label}
      </span>
    </div>
  );
};
