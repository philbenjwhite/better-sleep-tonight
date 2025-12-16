'use client';

import styles from './SeeOptionsPrompt.module.css';

export interface SeeOptionsPromptContent {
  promptText: string;
  buttonText: string;
  avatarResponseOnClick?: string;
  avatarEmotionOnClick?: string;
}

export interface SeeOptionsPromptProps {
  content: SeeOptionsPromptContent;
  onContinue: () => void;
  disabled?: boolean;
}

export const SeeOptionsPrompt: React.FC<SeeOptionsPromptProps> = ({
  content,
  onContinue,
  disabled = false,
}) => {
  return (
    <div className={styles.seeOptionsContainer}>
      <h2 className={styles.promptText}>{content.promptText}</h2>

      <button
        type="button"
        className={styles.seeOptionsButton}
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

export default SeeOptionsPrompt;
