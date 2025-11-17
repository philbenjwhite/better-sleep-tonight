'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { Button } from '@/components/Button';
import { trackQuizEvent, trackEmailCapture } from '@/lib/analytics';
import styles from './SleepQuiz.module.css';

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
  }[];
}

export interface SleepQuizProps {
  onComplete?: (results: Record<string, string>) => void;
  className?: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'sleep_quality',
    question: 'How would you rate your current sleep quality?',
    options: [
      { value: 'poor', label: 'Poor - I rarely sleep well' },
      { value: 'fair', label: 'Fair - Some good nights, some bad' },
      { value: 'good', label: 'Good - Usually sleep well' },
      { value: 'excellent', label: 'Excellent - Always sleep great' },
    ],
  },
  {
    id: 'sleep_position',
    question: 'What is your primary sleep position?',
    options: [
      { value: 'back', label: 'Back sleeper' },
      { value: 'side', label: 'Side sleeper' },
      { value: 'stomach', label: 'Stomach sleeper' },
      { value: 'combination', label: 'Combination (I move around)' },
    ],
  },
  {
    id: 'main_issue',
    question: 'What is your main sleep challenge?',
    options: [
      { value: 'falling_asleep', label: 'Difficulty falling asleep' },
      { value: 'staying_asleep', label: 'Waking up during the night' },
      { value: 'waking_early', label: 'Waking up too early' },
      { value: 'pain', label: 'Pain or discomfort' },
      { value: 'temperature', label: 'Temperature (too hot/cold)' },
    ],
  },
  {
    id: 'mattress_age',
    question: 'How old is your current mattress?',
    options: [
      { value: 'new', label: 'Less than 2 years' },
      { value: 'medium', label: '2-5 years' },
      { value: 'old', label: '5-8 years' },
      { value: 'very_old', label: 'Over 8 years' },
    ],
  },
  {
    id: 'firmness_preference',
    question: 'What firmness level do you prefer?',
    options: [
      { value: 'soft', label: 'Soft - I like to sink in' },
      { value: 'medium', label: 'Medium - Balanced support' },
      { value: 'firm', label: 'Firm - I prefer more support' },
      { value: 'unsure', label: 'Not sure / Want recommendation' },
    ],
  },
];

export const SleepQuiz: React.FC<SleepQuizProps> = ({ onComplete, className }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quizQuestions[currentStep];
  const progress = ((currentStep + 1) / quizQuestions.length) * 100;

  const handleStart = () => {
    trackQuizEvent('quiz_start');
    setCurrentStep(0);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    trackQuizEvent('quiz_step', currentStep + 1, {
      question_id: questionId,
      answer: answer,
    });

    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (email) {
      trackEmailCapture('sleep_quiz');
      trackQuizEvent('quiz_complete', quizQuestions.length, {
        email_captured: true,
        answers: answers,
      });

      if (onComplete) {
        onComplete({ ...answers, email });
      }

      // Here you would typically send the data to your backend
      console.log('Quiz completed:', { email, answers });
    }
  };

  const getSleepScore = (): number => {
    // Simple scoring logic - customize based on your needs
    let score = 70;

    if (answers.sleep_quality === 'excellent') score += 15;
    else if (answers.sleep_quality === 'good') score += 10;
    else if (answers.sleep_quality === 'fair') score += 5;
    else score -= 10;

    if (answers.mattress_age === 'very_old') score -= 15;
    else if (answers.mattress_age === 'old') score -= 10;

    return Math.max(0, Math.min(100, score));
  };

  const getRecommendation = (): string => {
    const score = getSleepScore();

    if (score >= 85) {
      return "You're doing great! Small optimizations could make your sleep even better.";
    } else if (score >= 70) {
      return "Good foundation, but there's room for improvement. Let's optimize your sleep setup.";
    } else if (score >= 50) {
      return "Significant improvements are possible. The right sleep solutions can transform your rest.";
    } else {
      return "Let's get you sleeping better! Our solutions are designed to address your specific challenges.";
    }
  };

  if (!currentQuestion && !showResults) {
    // Start screen
    return (
      <div className={classNames(styles.container, className)}>
        <div className={styles.startScreen}>
          <h2 className={styles.title}>Discover Your Perfect Sleep Solution</h2>
          <p className={styles.subtitle}>
            Take our 60-second quiz to get personalized recommendations based on your sleep needs.
          </p>
          <ul className={styles.benefits}>
            <li>Personalized sleep score</li>
            <li>Custom product recommendations</li>
            <li>Expert sleep tips for your situation</li>
            <li>Exclusive first-time customer offer</li>
          </ul>
          <Button variant="primary" size="large" onClick={handleStart}>
            Start Your Sleep Assessment
          </Button>
          <p className={styles.privacy}>
            Your information is private and secure. We never share your data.
          </p>
        </div>
      </div>
    );
  }

  if (showResults) {
    const sleepScore = getSleepScore();
    const recommendation = getRecommendation();

    return (
      <div className={classNames(styles.container, className)}>
        <div className={styles.results}>
          <div className={styles.scoreContainer}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNumber}>{sleepScore}</span>
              <span className={styles.scoreLabel}>Sleep Score</span>
            </div>
          </div>

          <h2 className={styles.resultsTitle}>Your Sleep Assessment Results</h2>
          <p className={styles.resultsText}>{recommendation}</p>

          <form onSubmit={handleEmailSubmit} className={styles.emailForm}>
            <h3 className={styles.emailTitle}>Get Your Personalized Sleep Plan</h3>
            <p className={styles.emailSubtitle}>
              Enter your email to receive your detailed sleep recommendations and exclusive 15% off offer.
            </p>
            <div className={styles.emailInput}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={styles.input}
              />
              <Button type="submit" variant="primary" size="large">
                Get My Sleep Plan
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Question screen
  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.quiz}>
        {/* Progress bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressText}>
            Question {currentStep + 1} of {quizQuestions.length}
          </span>
        </div>

        {/* Question */}
        <h2 className={styles.question}>{currentQuestion.question}</h2>

        {/* Options */}
        <div className={styles.options}>
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              className={classNames(styles.option, {
                [styles.optionSelected]: answers[currentQuestion.id] === option.value,
              })}
              onClick={() => handleAnswer(currentQuestion.id, option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        {currentStep > 0 && (
          <button
            className={styles.backButton}
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
};
