'use client';

import { useState, useCallback } from 'react';
import styles from './EmailCapture.module.css';

export interface EmailCaptureContent {
  promptText: string;
  placeholderText: string;
  submitButtonText: string;
  avatarResponseOnSubmit?: string;
  skipOptionText?: string;
  avatarResponseOnSkip?: string;
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
      <div className={styles.contentWrapper}>
        <h2 className={styles.promptText}>{content.promptText}</h2>
        <p className={styles.subtext}>
          Get your personalized sleep report delivered instantly
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.formWrapper}>
        <div className={styles.inputRow}>
          <div className={styles.inputWrapper}>
            <div className={styles.inputWithIcon}>
              <svg
                className={styles.emailIcon}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m2 5 8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
            </div>
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
            <span className={styles.buttonText}>{content.submitButtonText}</span>
            <svg
              className={styles.arrowIcon}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="m5 10 5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="rotate(-90 10 10)"
              />
            </svg>
          </button>
        </div>
      </form>

      <p className={styles.privacyText}>
        <svg
          className={styles.lockIcon}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="2" y="6" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        We respect your privacy. No spam, ever.
      </p>

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
