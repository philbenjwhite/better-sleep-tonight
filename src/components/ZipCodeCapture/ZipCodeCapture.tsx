'use client';

import React, { useState } from 'react';
import styles from './ZipCodeCapture.module.css';

export interface ZipCodeCaptureContent {
  headline: string;
  placeholderText: string;
  buttonText: string;
}

export interface ZipCodeCaptureProps {
  content: ZipCodeCaptureContent;
  onSubmit: (zipCode: string) => void;
}

// Format input as Canadian postal code: A1A 1A1
function formatPostalCode(value: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Canadian postal code pattern: letter-digit-letter digit-letter-digit
  // Position 0, 2, 4 = letters; Position 1, 3, 5 = digits
  let formatted = '';
  let inputIndex = 0;

  while (formatted.replace(' ', '').length < 6 && inputIndex < cleaned.length) {
    const char = cleaned[inputIndex];
    const outputPos = formatted.replace(' ', '').length;
    const isLetterPosition = outputPos === 0 || outputPos === 2 || outputPos === 4;
    const isDigitPosition = outputPos === 1 || outputPos === 3 || outputPos === 5;

    if (isLetterPosition && /[A-Z]/.test(char)) {
      formatted += char;
    } else if (isDigitPosition && /[0-9]/.test(char)) {
      formatted += char;
    }
    // Skip invalid characters silently

    inputIndex++;

    // Add space after first 3 characters
    if (formatted.length === 3) {
      formatted += ' ';
    }
  }

  return formatted;
}

// Validate Canadian postal code format
function isValidPostalCode(value: string): boolean {
  const pattern = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;
  return pattern.test(value);
}

export function ZipCodeCapture({ content, onSubmit }: ZipCodeCaptureProps) {
  const [zipCode, setZipCode] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value);
    setZipCode(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidPostalCode(zipCode)) {
      onSubmit(zipCode);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.headline}>{content.headline}</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={zipCode}
            onChange={handleChange}
            placeholder="A1A 1A1"
            className={styles.input}
            maxLength={7}
            autoFocus
          />
          <button
            type="submit"
            className={styles.button}
            disabled={!isValidPostalCode(zipCode)}
          >
            {content.buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ZipCodeCapture;
