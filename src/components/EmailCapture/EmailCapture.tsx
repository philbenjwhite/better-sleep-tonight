'use client';

import { useState, useCallback } from 'react';
import styles from './EmailCapture.module.css';

export interface EmailCaptureContent {
  promptText: string;
  placeholderText: string;
  submitButtonText: string;
  avatarResponseOnSubmit?: string;
  avatarEmotionOnSubmit?: string;
  skipOptionText?: string;
  avatarResponseOnSkip?: string;
  avatarEmotionOnSkip?: string;
}

export interface EmailCaptureProps {
  content: EmailCaptureContent;
  onSubmit: (email: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
}

export const EmailCapture: React.FC<EmailCaptureProps> = ({
  content,
  onSubmit,
  onSkip,
  disabled = false,
}) => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(true);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled) return;

      if (!validateEmail(email)) {
        setIsValid(false);
        return;
      }

      setIsValid(true);
      onSubmit(email);
    },
    [email, disabled, onSubmit]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (!isValid) {
      setIsValid(true);
    }
  };

  return (
    <div className={styles.emailCaptureContainer}>
      <h2 className={styles.promptText}>{content.promptText}</h2>

      <form onSubmit={handleSubmit} className={styles.formWrapper}>
        <div className={styles.inputRow}>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              value={email}
              onChange={handleInputChange}
              placeholder={content.placeholderText}
              className={`${styles.emailInput} ${!isValid ? styles.invalid : ''}`}
              disabled={disabled}
              aria-label="Email address"
              aria-invalid={!isValid}
              autoFocus
            />
            {!isValid && (
              <span className={styles.errorMessage}>
                Please enter a valid email address
              </span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={disabled || !email.trim()}
          >
            {content.submitButtonText}
          </button>
        </div>
      </form>

      {content.skipOptionText && onSkip && (
        <button
          type="button"
          className={styles.skipButton}
          onClick={onSkip}
          disabled={disabled}
        >
          {content.skipOptionText}
        </button>
      )}
    </div>
  );
};

export default EmailCapture;
