'use client';

import styles from './ActionPrompt.module.css';

export interface ActionPromptContent {
  promptText: string;
  buttonText: string;
  avatarResponseOnClick?: string;
}

export interface ActionPromptProps {
  content: ActionPromptContent;
  onContinue: () => void;
  disabled?: boolean;
}

export const ActionPrompt: React.FC<ActionPromptProps> = ({
  content,
  onContinue,
  disabled = false,
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.promptText}>{content.promptText}</h2>

      <button
        type="button"
        className={styles.actionButton}
        onClick={onContinue}
        disabled={disabled}
      >
        <span>{content.buttonText}</span>
        <svg
          className={styles.arrowIcon}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.16669 10H15.8334M15.8334 10L10 4.16669M15.8334 10L10 15.8334"
            stroke="currentColor"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default ActionPrompt;
