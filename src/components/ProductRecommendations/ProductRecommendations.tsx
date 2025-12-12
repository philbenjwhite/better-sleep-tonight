"use client";

import { useState, useCallback, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import classNames from "classnames";
import gsap from "gsap";
import styles from "./ProductRecommendations.module.css";

export type MattressSize = "twin" | "twin-xl" | "full" | "queen" | "king";
export type MattressFeel = "soft" | "medium" | "firm" | "hybrid";

export interface MattressOption {
  id: string;
  productName: string;
  productDescription: string;
  basePrice: number;
  productImage: string;
}

export interface ProductRecommendationsContent {
  headline?: string;
  introParagraph?: string;
  secondaryText?: string;
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

// Individual Mattress Card Component
interface MattressCardProps {
  mattress: MattressOption;
  isExpanded: boolean;
  onSelect: () => void;
  selectedSize: MattressSize | null;
  selectedFeel: MattressFeel | null;
  onSizeSelect: (size: MattressSize) => void;
  onFeelSelect: (feel: MattressFeel) => void;
  sizes: ProductRecommendationsContent["sizes"];
  feels: ProductRecommendationsContent["feels"];
  calculatePrice: (basePrice: number, size: MattressSize | null) => number;
}

function MattressCard({
  mattress,
  isExpanded,
  onSelect,
  selectedSize,
  selectedFeel,
  onSizeSelect,
  onFeelSelect,
  sizes,
  feels,
  calculatePrice,
}: MattressCardProps) {
  const displayPrice = calculatePrice(mattress.basePrice, selectedSize);
  const optionsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef<string | null>(null);

  // Animate options when card expands
  useLayoutEffect(() => {
    if (isExpanded && optionsRef.current && hasAnimated.current !== mattress.id) {
      hasAnimated.current = mattress.id;

      const sizeLabel = optionsRef.current.querySelector(`.${styles.selectionGroup}:first-child .${styles.selectionLabel}`);
      const sizeButtons = optionsRef.current.querySelectorAll(`.${styles.selectionGroup}:first-child .${styles.optionButton}`);
      const feelLabel = optionsRef.current.querySelector(`.${styles.selectionGroup}:last-child .${styles.selectionLabel}`);
      const feelButtons = optionsRef.current.querySelectorAll(`.${styles.selectionGroup}:last-child .${styles.optionButton}`);

      // Set initial states
      gsap.set([sizeLabel, feelLabel], { opacity: 0, y: -8 });
      gsap.set([...sizeButtons, ...feelButtons], { opacity: 0, y: 10 });

      // Create timeline for sequential animation
      const tl = gsap.timeline();

      // Fade in size label
      tl.to(sizeLabel, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: "power2.out",
      });

      // Fade in size buttons sequentially
      tl.to(sizeButtons, {
        opacity: 1,
        y: 0,
        duration: 0.2,
        stagger: 0.06,
        ease: "power2.out",
      }, "-=0.1");

      // Fade in feel label
      tl.to(feelLabel, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: "power2.out",
      }, "-=0.1");

      // Fade in feel buttons sequentially
      tl.to(feelButtons, {
        opacity: 1,
        y: 0,
        duration: 0.2,
        stagger: 0.06,
        ease: "power2.out",
      }, "-=0.1");
    } else if (!isExpanded) {
      // Reset animation tracker when collapsed
      hasAnimated.current = null;
    }
  }, [isExpanded, mattress.id]);

  return (
    <div className={classNames(styles.card, { [styles.expanded]: isExpanded })}>
      {/* Main product row - clickable to toggle selection */}
      <div className={styles.cardMain} onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}>
        {/* Product Image */}
        <div className={styles.cardImage}>
          <Image
            src={mattress.productImage}
            alt={mattress.productName}
            width={83}
            height={110}
            className={styles.mattressImage}
          />
        </div>

        {/* Product Info */}
        <div className={styles.cardInfo}>
          <p className={styles.productName}>{mattress.productName}</p>
          <p className={styles.productDescription}>{mattress.productDescription}</p>
          <p className={styles.productPrice}>
            {displayPrice.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
            }).replace("$", "")}
          </p>
        </div>

        {/* Select Button */}
        <div className={styles.cardAction}>
          <button
            type="button"
            className={classNames(styles.selectButton, {
              [styles.selected]: isExpanded,
            })}
            onClick={onSelect}
          >
            Select
          </button>
        </div>
      </div>

      {/* Expanded options (size and feel) */}
      {isExpanded && (
        <div className={styles.cardOptions} ref={optionsRef}>
          {/* Size Selection */}
          <div className={styles.selectionGroup}>
            <p className={styles.selectionLabel}>Select your preferred size:</p>
            <div className={styles.optionsRow}>
              {sizes.map((sizeOption) => (
                <button
                  key={sizeOption.value}
                  type="button"
                  className={classNames(styles.optionButton, {
                    [styles.selected]: selectedSize === sizeOption.value,
                  })}
                  onClick={() => onSizeSelect(sizeOption.value)}
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
              {feels.map((feelOption) => (
                <button
                  key={feelOption.value}
                  type="button"
                  className={classNames(styles.optionButton, {
                    [styles.selected]: selectedFeel === feelOption.value,
                  })}
                  onClick={() => onFeelSelect(feelOption.value)}
                >
                  <span className={styles.optionText}>{feelOption.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductRecommendations({
  content,
  onSelectionComplete,
}: ProductRecommendationsProps) {
  const [expandedMattressId, setExpandedMattressId] = useState<string | null>(null);
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
    if (expandedMattressId === mattressId) {
      // Already expanded, collapse it
      setExpandedMattressId(null);
      setSelectedSize(null);
      setSelectedFeel(null);
    } else {
      // Expand this mattress, reset selections
      setExpandedMattressId(mattressId);
      setSelectedSize(null);
      setSelectedFeel(null);
    }
  }, [expandedMattressId]);

  const handleSizeSelect = useCallback(
    (size: MattressSize) => {
      setSelectedSize(size);
      // Check if we can complete the selection
      if (selectedFeel && expandedMattressId) {
        const mattress = content.mattressOptions.find(
          (m) => m.id === expandedMattressId
        );
        if (mattress) {
          onSelectionComplete?.({
            mattressId: expandedMattressId,
            mattressName: mattress.productName,
            size,
            feel: selectedFeel,
            finalPrice: calculatePrice(mattress.basePrice, size),
          });
        }
      }
    },
    [selectedFeel, expandedMattressId, content.mattressOptions, onSelectionComplete, calculatePrice]
  );

  const handleFeelSelect = useCallback(
    (feel: MattressFeel) => {
      setSelectedFeel(feel);
      // Check if we can complete the selection
      if (selectedSize && expandedMattressId) {
        const mattress = content.mattressOptions.find(
          (m) => m.id === expandedMattressId
        );
        if (mattress) {
          onSelectionComplete?.({
            mattressId: expandedMattressId,
            mattressName: mattress.productName,
            size: selectedSize,
            feel,
            finalPrice: calculatePrice(mattress.basePrice, selectedSize),
          });
        }
      }
    },
    [selectedSize, expandedMattressId, content.mattressOptions, onSelectionComplete, calculatePrice]
  );

  return (
    <div className={styles.container}>
      {content.mattressOptions.map((mattress) => (
        <MattressCard
          key={mattress.id}
          mattress={mattress}
          isExpanded={expandedMattressId === mattress.id}
          onSelect={() => handleMattressSelect(mattress.id)}
          selectedSize={expandedMattressId === mattress.id ? selectedSize : null}
          selectedFeel={expandedMattressId === mattress.id ? selectedFeel : null}
          onSizeSelect={handleSizeSelect}
          onFeelSelect={handleFeelSelect}
          sizes={content.sizes}
          feels={content.feels}
          calculatePrice={calculatePrice}
        />
      ))}
    </div>
  );
}
