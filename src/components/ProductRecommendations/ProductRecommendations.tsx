"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import classNames from "classnames";
import styles from "./ProductRecommendations.module.css";

export type MattressSize = "twin" | "twin-xl" | "full" | "queen" | "king";
export type MattressFeel = "soft" | "medium" | "firm";

export interface MattressOption {
  id: string;
  productName: string;
  productDescription: string;
  basePrice: number;
  productImage: string;
}

export interface ProductRecommendationsContent {
  headline: string;
  introParagraph: string;
  secondaryText: string;
  mattressOptions: MattressOption[];
  sizes: Array<{
    value: MattressSize;
    label: string;
    priceModifier?: number;
  }>;
  feels: Array<{
    value: MattressFeel;
    label: string;
  }>;
  closeOutHeadline?: string;
  closeOutIntroParagraph?: string;
  priceCheckerCopy?: string;
  emailCaptureCopy?: string;
  dataCaptureCopy?: string;
  contactUsCopy?: string;
  avatarResponse?: string;
  avatarEmotion?: string;
}

export interface ProductRecommendationsProps {
  content: ProductRecommendationsContent;
  onSelectionComplete?: (selection: {
    mattressId: string;
    mattressName: string;
    size: MattressSize;
    feel: MattressFeel;
    finalPrice: number;
  }) => void;
}

export function ProductRecommendations({
  content,
  onSelectionComplete,
}: ProductRecommendationsProps) {
  const [selectedMattress, setSelectedMattress] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<MattressSize | null>(null);
  const [selectedFeel, setSelectedFeel] = useState<MattressFeel | null>(null);

  const calculatePrice = useCallback(
    (basePrice: number, size: MattressSize | null) => {
      if (!size) return basePrice;
      const sizeOption = content.sizes.find((s) => s.value === size);
      return basePrice + (sizeOption?.priceModifier ?? 0);
    },
    [content.sizes]
  );

  const handleMattressSelect = useCallback((mattressId: string) => {
    setSelectedMattress(mattressId);
  }, []);

  const handleSizeSelect = useCallback(
    (size: MattressSize) => {
      setSelectedSize(size);
      // Check if we can complete the selection
      if (selectedMattress && selectedFeel) {
        const mattress = content.mattressOptions.find(
          (m) => m.id === selectedMattress
        );
        if (mattress) {
          onSelectionComplete?.({
            mattressId: selectedMattress,
            mattressName: mattress.productName,
            size,
            feel: selectedFeel,
            finalPrice: calculatePrice(mattress.basePrice, size),
          });
        }
      }
    },
    [
      selectedMattress,
      selectedFeel,
      content.mattressOptions,
      onSelectionComplete,
      calculatePrice,
    ]
  );

  const handleFeelSelect = useCallback(
    (feel: MattressFeel) => {
      setSelectedFeel(feel);
      // Check if we can complete the selection
      if (selectedMattress && selectedSize) {
        const mattress = content.mattressOptions.find(
          (m) => m.id === selectedMattress
        );
        if (mattress) {
          onSelectionComplete?.({
            mattressId: selectedMattress,
            mattressName: mattress.productName,
            size: selectedSize,
            feel,
            finalPrice: calculatePrice(mattress.basePrice, selectedSize),
          });
        }
      }
    },
    [
      selectedMattress,
      selectedSize,
      content.mattressOptions,
      onSelectionComplete,
      calculatePrice,
    ]
  );

  const getSelectedMattress = () => {
    return content.mattressOptions.find((m) => m.id === selectedMattress);
  };

  const selectedMattressData = getSelectedMattress();
  const displayPrice = selectedMattressData
    ? calculatePrice(selectedMattressData.basePrice, selectedSize)
    : null;

  return (
    <div className={styles.wrapper}>
      {/* Header Section */}
      <div className={styles.header}>
        <h2 className={styles.headline}>{content.headline}</h2>
        <p className={styles.introParagraph}>{content.introParagraph}</p>
        <p className={styles.secondaryText}>{content.secondaryText}</p>
      </div>

      {/* Scrollable Mattress Options */}
      <div className={styles.scrollContainer}>
        <div className={styles.mattressGrid}>
          {content.mattressOptions.map((mattress) => (
            <button
              key={mattress.id}
              type="button"
              className={classNames(styles.mattressCard, {
                [styles.selected]: selectedMattress === mattress.id,
              })}
              onClick={() => handleMattressSelect(mattress.id)}
            >
              {/* Left: Product Image */}
              <div className={styles.imageSection}>
                <Image
                  src={mattress.productImage}
                  alt={mattress.productName}
                  width={200}
                  height={200}
                  className={styles.mattressImage}
                />
              </div>

              {/* Right: Product Info */}
              <div className={styles.infoSection}>
                <h3 className={styles.productName}>{mattress.productName}</h3>
                <p className={styles.productDescription}>
                  {mattress.productDescription}
                </p>
                <p className={styles.productPrice}>
                  {(selectedMattress === mattress.id && selectedSize
                    ? calculatePrice(mattress.basePrice, selectedSize)
                    : mattress.basePrice
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* Selection Indicator */}
              <div className={styles.selectionIndicator}>
                {selectedMattress === mattress.id && (
                  <span className={styles.checkmark}>&#10003;</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Size and Feel Selection - Only show after mattress is selected */}
      {selectedMattress && (
        <div className={styles.selectionSection}>
          {/* Size Selection */}
          <div className={styles.selectionGroup}>
            <p className={styles.selectionLabel}>Select your preferred size:</p>
            <div className={styles.optionsRow}>
              {content.sizes.map((sizeOption) => (
                <button
                  key={sizeOption.value}
                  type="button"
                  className={classNames(styles.optionButton, {
                    [styles.optionSelected]: selectedSize === sizeOption.value,
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
                    [styles.optionSelected]: selectedFeel === feelOption.value,
                  })}
                  onClick={() => handleFeelSelect(feelOption.value)}
                >
                  <span className={styles.optionText}>{feelOption.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display selected price */}
          {displayPrice && (
            <div className={styles.selectedPriceDisplay}>
              <p className={styles.selectedPriceLabel}>Your selection:</p>
              <p className={styles.selectedPrice}>
                {displayPrice.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
