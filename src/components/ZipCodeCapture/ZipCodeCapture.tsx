'use client';

import React, { useState, useEffect } from 'react';
import styles from './ZipCodeCapture.module.css';
import { geocodePostalCode } from '@/lib/geocoding';

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
// Accepts flexible input: a1a1a1, A1A-1A1, A1A 1A1, etc.
function formatPostalCode(value: string): string {
  // Remove all non-alphanumeric characters (including hyphens and spaces) and convert to uppercase
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

    // Add space after first 3 characters (standard format uses space, not hyphen)
    if (formatted.length === 3) {
      formatted += ' ';
    }
  }

  return formatted;
}

// Validate Canadian postal code format (exactly 6 characters plus space)
function isValidPostalCode(value: string): boolean {
  const pattern = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;
  return pattern.test(value);
}

export function ZipCodeCapture({ content, onSubmit }: ZipCodeCaptureProps) {
  const [zipCode, setZipCode] = useState('');
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value);
    setZipCode(formatted);
    // Clear location info when input changes
    if (formatted.length < 7) {
      setLocationInfo(null);
    }
  };

  // Auto-lookup city/province when postal code is complete
  useEffect(() => {
    if (!isValidPostalCode(zipCode)) {
      setLocationInfo(null);
      return;
    }

    const lookupLocation = async () => {
      setIsLookingUp(true);
      try {
        const result = await geocodePostalCode(zipCode);
        if (result.formattedAddress) {
          // Extract city and province from the formatted address
          // Mapbox returns: "L7M 1A1, Burlington, Ontario L7M, Canada"
          const parts = result.formattedAddress.split(', ');
          if (parts.length >= 3) {
            // Get city (second part) and province (third part, remove postal code suffix)
            const city = parts[1];
            const province = parts[2].replace(/\s+[A-Z]\d[A-Z]$/, ''); // Remove trailing postal FSA
            setLocationInfo(`${city}, ${province}`);
          } else {
            setLocationInfo(result.formattedAddress);
          }
        } else {
          setLocationInfo(null);
        }
      } catch {
        setLocationInfo(null);
      } finally {
        setIsLookingUp(false);
      }
    };

    // Debounce the lookup
    const timeoutId = setTimeout(lookupLocation, 300);
    return () => clearTimeout(timeoutId);
  }, [zipCode]);

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
          <div className={styles.inputContainer}>
            <label htmlFor="postal-code" className={styles.label}>
              Postal Code
            </label>
            <input
              id="postal-code"
              type="text"
              value={zipCode}
              onChange={handleChange}
              placeholder="A1A 1A1"
              className={styles.input}
              maxLength={7}
              autoComplete="postal-code"
              autoFocus
            />
            {/* Always render to reserve space and prevent layout shift */}
            <div className={styles.locationInfo}>
              {isLookingUp ? (
                <span className={styles.lookingUp}>Looking up...</span>
              ) : locationInfo ? (
                <span className={styles.locationText}>{locationInfo}</span>
              ) : null}
            </div>
          </div>
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
