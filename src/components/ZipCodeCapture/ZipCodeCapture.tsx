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

export function ZipCodeCapture({ content, onSubmit }: ZipCodeCaptureProps) {
  const [zipCode, setZipCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.trim()) {
      onSubmit(zipCode.trim().toUpperCase());
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
            onChange={(e) => setZipCode(e.target.value)}
            placeholder={content.placeholderText}
            className={styles.input}
            maxLength={10}
            autoFocus
          />
          <button
            type="submit"
            className={styles.button}
            disabled={!zipCode.trim()}
          >
            {content.buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ZipCodeCapture;
