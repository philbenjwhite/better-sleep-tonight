'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './EmailCaptureForm.module.css';

export interface EmailCaptureFormProps {
  /** Label on the submit button. */
  buttonText: string;
  /** Called with an address that has already passed validation. */
  onSubmit: (email: string) => Promise<void>;
  /** Label while the submit is in flight, and after it resolves. */
  submittingText?: string;
  placeholder?: string;
  /** Extra class on the form, for callers that own the surrounding layout. */
  className?: string;
  /** Class for the submit button, so each caller keeps its own CTA styling. */
  buttonClassName?: string;
  ariaLabel?: string;
  /**
   * Put the cursor in the field on mount. Ignored on touch devices whatever
   * this says: see the effect below.
   */
  autoFocus?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The funnel's one email field.
 *
 * Extracted from StoreLocations so the summary step and the booking step
 * cannot drift apart on validation, the submitting lockout or the mobile
 * focus rule. Those behaviours are load-bearing rather than incidental, and
 * each one was added here for a reason recorded below.
 */
export const EmailCaptureForm: React.FC<EmailCaptureFormProps> = ({
  buttonText,
  onSubmit,
  submittingText = 'Submitting...',
  placeholder = 'Enter your email',
  className,
  buttonClassName,
  ariaLabel = 'Email address',
  autoFocus = true,
}) => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Put the cursor in the field on arrival, so the one thing being asked for
   * can be typed without a click.
   *
   * Not on a touch device. Focus there summons the keyboard, which covers
   * roughly half the screen the moment the field appears, over Ashley, who is
   * the reason the address is being asked for. Nothing is lost by waiting for
   * the tap that means the user is ready to type.
   *
   * preventScroll because the field can sit below the fold on a short
   * viewport, and the browser would jump to it and take the heading above it
   * off screen.
   */
  useEffect(() => {
    if (!autoFocus) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!EMAIL_PATTERN.test(email)) {
        setIsValid(false);
        return;
      }
      setIsValid(true);
      setIsSubmitting(true);
      try {
        await onSubmit(email);
        setHasSubmitted(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, onSubmit],
  );

  /*
    hasSubmitted is deliberately never cleared. Where the submit ends in a
    navigation, releasing the button would flash a live CTA pointing somewhere
    the user is no longer going, and would let a second submit land during the
    redirect.
  */
  const isLocked = isSubmitting || hasSubmitted;

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.form} ${className || ''}`}
      noValidate
    >
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (!isValid) setIsValid(true);
          }}
          placeholder={placeholder}
          className={`${styles.input} ${!isValid ? styles.inputInvalid : ''}`}
          disabled={isSubmitting}
          aria-label={ariaLabel}
          aria-invalid={!isValid}
        />
        {!isValid && (
          <span className={styles.error} role="alert">
            Please enter a valid email
          </span>
        )}
      </div>
      <button
        type="submit"
        className={buttonClassName}
        disabled={isLocked || !email.trim()}
      >
        {isLocked ? submittingText : buttonText}
      </button>
    </form>
  );
};
