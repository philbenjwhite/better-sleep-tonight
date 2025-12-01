import React, { useState, ChangeEvent, KeyboardEvent } from 'react';
import classNames from 'classnames';
import styles from './TextInput.module.css';

export interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email';
  buttonText?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TextInput({
  label,
  value,
  onChange,
  onSubmit,
  placeholder = '',
  type = 'text',
  buttonText = 'Enter',
  helperText,
  error,
  required = false,
  disabled = false,
  className,
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit();
    }
  };

  return (
    <div className={classNames(styles.container, className)}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>

      {helperText && !error && (
        <p className={styles.helperText}>{helperText}</p>
      )}

      {error && (
        <p className={styles.error}>{error}</p>
      )}

      <div className={styles.inputWrapper}>
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={classNames(
            styles.input,
            { [styles.focused]: isFocused },
            { [styles.hasError]: !!error }
          )}
        />

        {onSubmit && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className={classNames(
              styles.button,
              { [styles.buttonDisabled]: disabled || !value.trim() }
            )}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
