"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import classNames from "classnames";
import styles from "./MattressRecommendation.module.css";

export type MattressSize = "twin" | "twin-xl" | "full" | "queen" | "king";
export type MattressFeel = "soft" | "medium" | "firm";

export interface MattressRecommendationContent {
  productName: string;
  productDescription: string;
  basePrice: number;
  productImage: string;
  sizes: Array<{
    value: MattressSize;
    label: string;
    priceModifier?: number;
  }>;
  feels: Array<{
    value: MattressFeel;
    label: string;
  }>;
  avatarResponse?: string;
  avatarEmotion?: string;
}

export interface MattressRecommendationProps {
  content: MattressRecommendationContent;
  onSelectionComplete?: (selection: {
    size: MattressSize;
    feel: MattressFeel;
    finalPrice: number;
  }) => void;
  selectedSize?: MattressSize;
  selectedFeel?: MattressFeel;
}

export function MattressRecommendation({
  content,
  onSelectionComplete,
  selectedSize: controlledSize,
  selectedFeel: controlledFeel,
}: MattressRecommendationProps) {
  const [internalSize, setInternalSize] = useState<MattressSize | null>(null);
  const [internalFeel, setInternalFeel] = useState<MattressFeel | null>(null);

  const selectedSize = controlledSize ?? internalSize;
  const selectedFeel = controlledFeel ?? internalFeel;

  const calculatePrice = useCallback(
    (size: MattressSize | null) => {
      if (!size) return content.basePrice;
      const sizeOption = content.sizes.find((s) => s.value === size);
      return content.basePrice + (sizeOption?.priceModifier ?? 0);
    },
    [content.basePrice, content.sizes]
  );

  const handleSizeSelect = useCallback(
    (size: MattressSize) => {
      setInternalSize(size);
      if (selectedFeel) {
        onSelectionComplete?.({
          size,
          feel: selectedFeel,
          finalPrice: calculatePrice(size),
        });
      }
    },
    [selectedFeel, onSelectionComplete, calculatePrice]
  );

  const handleFeelSelect = useCallback(
    (feel: MattressFeel) => {
      setInternalFeel(feel);
      if (selectedSize) {
        onSelectionComplete?.({
          size: selectedSize,
          feel,
          finalPrice: calculatePrice(selectedSize),
        });
      }
    },
    [selectedSize, onSelectionComplete, calculatePrice]
  );

  const displayPrice = calculatePrice(selectedSize);

  return (
    <div className={styles.container}>
      {/* Left: Product Image */}
      <div className={styles.imageSection}>
        <Image
          src={content.productImage}
          alt={content.productName}
          width={400}
          height={400}
          className={styles.mattressImage}
          priority
        />
      </div>

      {/* Right: Product Info and Selection */}
      <div className={styles.infoSection}>
        {/* Product Details */}
        <div className={styles.productInfo}>
          <h2 className={styles.productName}>{content.productName}</h2>
          <p className={styles.productDescription}>
            {content.productDescription}
          </p>
          <p className={styles.productPrice}>
            {displayPrice.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Size Selection */}
        <div className={styles.selectionGroup}>
          <p className={styles.selectionLabel}>Select your preferred size:</p>
          <div className={styles.optionsRow}>
            {content.sizes.map((sizeOption) => (
              <button
                key={sizeOption.value}
                type="button"
                className={classNames(styles.optionButton, {
                  [styles.selected]: selectedSize === sizeOption.value,
                })}
                onClick={() => handleSizeSelect(sizeOption.value)}
              >
                <span className={styles.optionText}>{sizeOption.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feel Selection */}
        <div className={styles.selectionGroup}>
          <p className={styles.selectionLabel}>Select your preferred feel:</p>
          <div className={styles.optionsRow}>
            {content.feels.map((feelOption) => (
              <button
                key={feelOption.value}
                type="button"
                className={classNames(styles.optionButton, {
                  [styles.selected]: selectedFeel === feelOption.value,
                })}
                onClick={() => handleFeelSelect(feelOption.value)}
              >
                <span className={styles.optionText}>{feelOption.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
