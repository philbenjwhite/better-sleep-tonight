import classNames from 'classnames';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  disabled = false,
  ...props
}) => {
  return (
    <button
      className={classNames(
        styles.button,
        styles[variant],
        styles[size],
        {
          [styles.disabled]: disabled,
        }
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
