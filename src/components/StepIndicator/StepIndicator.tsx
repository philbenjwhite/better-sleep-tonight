import classNames from 'classnames';
import styles from './StepIndicator.module.css';

export type StepStatus = 'inactive' | 'active' | 'completed';

export interface StepIndicatorStep {
  label: string;
  status: StepStatus;
}

export interface StepIndicatorProps {
  steps: StepIndicatorStep[];
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, className }) => {
  return (
    <ol className={classNames(styles.container, className)} aria-label="Progress">
      {steps.map((step, index) => (
        <li key={step.label} className={styles.stepItem}>
          {/* Connector line before this step (not before the first) */}
          {index > 0 && (
            <div
              className={classNames(styles.connector, {
                [styles.connectorCompleted]: step.status === 'completed' || step.status === 'active',
              })}
              aria-hidden="true"
            />
          )}

          {/* Step group: circle + label */}
          <div
            className={classNames(styles.stepGroup, {
              [styles.stepGroupActive]: step.status === 'active',
              [styles.stepGroupCompleted]: step.status === 'completed',
            })}
            role="group"
            aria-current={step.status === 'active' ? 'step' : undefined}
            aria-label={`${step.label}, ${step.status}`}
          >
            <div
              className={classNames(styles.circle, {
                [styles.circleActive]: step.status === 'active',
                [styles.circleCompleted]: step.status === 'completed',
              })}
            >
              {step.status === 'completed' && (
                <svg
                  className={styles.checkmark}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M10 3L4.5 8.5L2 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {step.status === 'active' && (
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
              )}
            </div>
            <span
              className={classNames(styles.label, {
                [styles.labelActive]: step.status === 'active',
                [styles.labelCompleted]: step.status === 'completed',
              })}
            >
              {step.label}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
};
