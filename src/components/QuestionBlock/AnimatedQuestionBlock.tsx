'use client';

import { useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { QuestionBlockProps, CMSQuestionContent } from './QuestionBlock';
import styles from './AnimatedQuestionBlock.module.css';

export interface AnimatedQuestionBlockProps extends Omit<QuestionBlockProps, 'questionContent'> {
  /** The question content from CMS */
  questionContent: CMSQuestionContent;
  /** Unique key to trigger re-animation when question changes */
  questionKey: string;
  /** Whether the component is entering (true) or exiting (false) */
  isEntering?: boolean;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
}

export const AnimatedQuestionBlock: React.FC<AnimatedQuestionBlockProps> = ({
  questionContent,
  questionKey,
  isEntering = true,
  onExitComplete,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef<string>('');
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Use useLayoutEffect for animations to prevent flicker
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const questionText = container.querySelector('[data-animate="question"]');
    const options = container.querySelectorAll('[data-animate="option"]');

    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    if (isEntering && hasAnimated.current !== questionKey) {
      // Mark as animated for this question
      hasAnimated.current = questionKey;

      // Set initial states immediately using native style manipulation for Safari compatibility
      // Safari sometimes doesn't execute GSAP.set synchronously in useLayoutEffect
      if (questionText instanceof HTMLElement) {
        questionText.style.opacity = '0';
        questionText.style.transform = 'translateY(20px)';
      }
      options.forEach((option) => {
        if (option instanceof HTMLElement) {
          option.style.opacity = '0';
          option.style.transform = 'translateX(-15px)';
        }
      });

      // Force a reflow to ensure styles are applied before animation starts (Safari fix)
      void container.offsetHeight;

      // Create entrance timeline with a small delay to ensure initial states are rendered
      const tl = gsap.timeline({ delay: 0.016 }); // ~1 frame delay
      timelineRef.current = tl;

      // Animate question text first
      tl.to(questionText, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
        clearProps: 'transform', // Clear inline transform after animation
      });

      // Animate options sequentially with stagger
      tl.to(options, {
        opacity: 1,
        x: 0,
        duration: 0.35,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform', // Clear inline transform after animation
      }, '-=0.15'); // Slight overlap with question animation

    } else if (isEntering && hasAnimated.current === questionKey) {
      // Already animated this question - ensure elements are visible
      gsap.set(questionText, { opacity: 1, y: 0 });
      gsap.set(options, { opacity: 1, x: 0 });
    } else if (!isEntering) {
      // Exit animation
      const tl = gsap.timeline({
        onComplete: () => {
          onExitComplete?.();
        }
      });
      timelineRef.current = tl;

      // Fade out all options first (reverse stagger)
      tl.to(options, {
        opacity: 0,
        x: 15,
        duration: 0.25,
        stagger: 0.04,
        ease: 'power2.in',
      });

      // Then fade out question
      tl.to(questionText, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        ease: 'power2.in',
      }, '-=0.15');
    }

    return () => {
      // Clean up any running animations
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [questionKey, isEntering, onExitComplete]);

  return (
    <div ref={containerRef} className={styles.animatedContainer}>
      <QuestionBlockAnimated
        questionContent={questionContent}
        {...rest}
      />
    </div>
  );
};

// Internal component that adds data attributes for GSAP targeting
const QuestionBlockAnimated: React.FC<QuestionBlockProps> = ({
  questionContent,
  onAnswerSelect,
  selectedValue,
  disabled = false,
}) => {
  // Sort options by order if available
  const sortedOptions = questionContent.answerOptions
    ? [...questionContent.answerOptions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  const indexToLetter = (index: number): string => {
    return String.fromCharCode(65 + index);
  };

  const handleSelect = useCallback((value: string) => {
    if (disabled) return;
    const selectedOption = sortedOptions.find((opt) => opt.value === value);
    if (selectedOption && onAnswerSelect) {
      onAnswerSelect(selectedOption);
    }
  }, [disabled, sortedOptions, onAnswerSelect]);

  // Keyboard shortcuts: A, B, C, D to select answers
  useEffect(() => {
    // Only add keyboard shortcuts for option-based inputs (not text inputs)
    if (questionContent.inputType === 'text') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      const keyToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

      if (key in keyToIndex) {
        const index = keyToIndex[key];
        if (sortedOptions[index] && !disabled) {
          e.preventDefault();
          handleSelect(sortedOptions[index].value);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questionContent.inputType, sortedOptions, disabled, handleSelect]);

  // For text inputs, render differently
  if (questionContent.inputType === 'text') {
    return (
      <div className={styles.questionBlock}>
        <div data-animate="question" className={styles.questionWrapper}>
          <label className={styles.questionText}>{questionContent.questionText}</label>
        </div>
        <div data-animate="option" className={styles.textInputWrapper}>
          {/* Text input would go here - simplified for now */}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.questionBlock}>
      <div data-animate="question" className={styles.questionWrapper}>
        <h2 className={styles.questionText}>{questionContent.questionText}</h2>
        {questionContent.helperText && (
          <p className={styles.helperText}>{questionContent.helperText}</p>
        )}
      </div>

      <div className={styles.answersContainer}>
        <div className={styles.answersList}>
          {sortedOptions.map((option, index) => (
            <div
              key={option.optionId}
              data-animate="option"
              className={styles.optionWrapper}
            >
              <button
                type="button"
                className={`${styles.answerOption} ${selectedValue === option.value ? styles.selected : ''} ${selectedValue && selectedValue !== option.value ? styles.notSelected : ''}`}
                onClick={() => handleSelect(option.value)}
                disabled={disabled}
              >
                <span className={styles.letter}>{indexToLetter(index)}</span>
                <span className={styles.label}>{option.label}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedQuestionBlock;
