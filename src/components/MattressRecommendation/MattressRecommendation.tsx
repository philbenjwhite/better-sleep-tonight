"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import classNames from "classnames";
import styles from "./MattressRecommendation.module.css";

export type MattressSize = "twin" | "twin-xl" | "full" | "queen" | "king";
export type MattressFeel = "soft" | "medium" | "firm" | "hybrid";

export interface MattressProduct {
  id: string;
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
}

// Legacy single-product content type for backward compatibility
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
  // New API: multiple products
  products?: MattressProduct[];
  // Legacy API: single content object
  content?: MattressRecommendationContent;
  // Legacy controlled selection
  selectedSize?: MattressSize;
  selectedFeel?: MattressFeel;
  onSelectionComplete?: (selection: {
    productId?: string;
    productName: string;
    size: MattressSize;
    feel: MattressFeel;
    finalPrice: number;
  }) => void;
}

// Single Mattress Card Component
interface MattressCardProps {
  product: MattressProduct;
  isExpanded: boolean;
  onSelect: () => void;
  selectedSize: MattressSize | null;
  selectedFeel: MattressFeel | null;
  onSizeSelect: (size: MattressSize) => void;
  onFeelSelect: (feel: MattressFeel) => void;
}

function MattressCard({
  product,
  isExpanded,
  onSelect,
  selectedSize,
  selectedFeel,
  onSizeSelect,
  onFeelSelect,
}: MattressCardProps) {
  const calculatePrice = (size: MattressSize | null) => {
    if (!size) return product.basePrice;
    const sizeOption = product.sizes.find((s) => s.value === size);
    return product.basePrice + (sizeOption?.priceModifier ?? 0);
  };

  const displayPrice = calculatePrice(selectedSize);

  return (
    <div className={classNames(styles.card, { [styles.expanded]: isExpanded })}>
      {/* Main product row - clickable to toggle selection */}
      <div className={styles.cardMain} onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}>
        {/* Product Image */}
        <div className={styles.cardImage}>
          <Image
            src={product.productImage}
            alt={product.productName}
            width={83}
            height={110}
            className={styles.mattressImage}
          />
        </div>

        {/* Product Info */}
        <div className={styles.cardInfo}>
          <p className={styles.productName}>{product.productName}</p>
          <p className={styles.productDescription}>{product.productDescription}</p>
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
        <div className={styles.cardOptions}>
          {/* Size Selection */}
          <div className={styles.selectionGroup}>
            <p className={styles.selectionLabel}>Select your preferred size:</p>
            <div className={styles.optionsRow}>
              {product.sizes.map((sizeOption) => (
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
              {product.feels.map((feelOption) => (
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

export function MattressRecommendation({
  products,
  content,
  selectedSize: controlledSize,
  selectedFeel: controlledFeel,
  onSelectionComplete,
}: MattressRecommendationProps) {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [internalSize, setInternalSize] = useState<MattressSize | null>(null);
  const [internalFeel, setInternalFeel] = useState<MattressFeel | null>(null);

  // Convert legacy single content to products array
  const normalizedProducts: MattressProduct[] = useMemo(() =>
    products ?? (content ? [{
      id: "legacy-single",
      productName: content.productName,
      productDescription: content.productDescription,
      basePrice: content.basePrice,
      productImage: content.productImage,
      sizes: content.sizes,
      feels: content.feels,
    }] : []),
    [products, content]
  );

  // For legacy single-product mode, auto-expand the only product
  const effectiveExpandedId = products
    ? expandedProductId
    : (normalizedProducts.length === 1 ? "legacy-single" : expandedProductId);

  // Use controlled or internal state
  const selectedSize = controlledSize ?? internalSize;
  const selectedFeel = controlledFeel ?? internalFeel;

  const handleProductSelect = useCallback((productId: string) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      setInternalSize(null);
      setInternalFeel(null);
    } else {
      setExpandedProductId(productId);
      setInternalSize(null);
      setInternalFeel(null);
    }
  }, [expandedProductId]);

  const handleSizeSelect = useCallback(
    (size: MattressSize) => {
      setInternalSize(size);
      const activeProductId = effectiveExpandedId;
      if (selectedFeel && activeProductId) {
        const product = normalizedProducts.find((p) => p.id === activeProductId);
        if (product) {
          const sizeOption = product.sizes.find((s) => s.value === size);
          const finalPrice = product.basePrice + (sizeOption?.priceModifier ?? 0);
          onSelectionComplete?.({
            productId: activeProductId === "legacy-single" ? undefined : activeProductId,
            productName: product.productName,
            size,
            feel: selectedFeel,
            finalPrice,
          });
        }
      }
    },
    [selectedFeel, effectiveExpandedId, normalizedProducts, onSelectionComplete]
  );

  const handleFeelSelect = useCallback(
    (feel: MattressFeel) => {
      setInternalFeel(feel);
      const activeProductId = effectiveExpandedId;
      if (selectedSize && activeProductId) {
        const product = normalizedProducts.find((p) => p.id === activeProductId);
        if (product) {
          const sizeOption = product.sizes.find((s) => s.value === selectedSize);
          const finalPrice = product.basePrice + (sizeOption?.priceModifier ?? 0);
          onSelectionComplete?.({
            productId: activeProductId === "legacy-single" ? undefined : activeProductId,
            productName: product.productName,
            size: selectedSize,
            feel,
            finalPrice,
          });
        }
      }
    },
    [selectedSize, effectiveExpandedId, normalizedProducts, onSelectionComplete]
  );

  // Legacy mode: single product, always expanded
  if (content && !products) {
    const product = normalizedProducts[0];
    if (!product) return null;

    return (
      <div className={styles.container}>
        <MattressCard
          product={product}
          isExpanded={true}
          onSelect={() => {}}
          selectedSize={selectedSize}
          selectedFeel={selectedFeel}
          onSizeSelect={handleSizeSelect}
          onFeelSelect={handleFeelSelect}
        />
      </div>
    );
  }

  // New mode: multiple products with expand/collapse
  return (
    <div className={styles.container}>
      {normalizedProducts.map((product) => (
        <MattressCard
          key={product.id}
          product={product}
          isExpanded={expandedProductId === product.id}
          onSelect={() => handleProductSelect(product.id)}
          selectedSize={expandedProductId === product.id ? selectedSize : null}
          selectedFeel={expandedProductId === product.id ? selectedFeel : null}
          onSizeSelect={handleSizeSelect}
          onFeelSelect={handleFeelSelect}
        />
      ))}
    </div>
  );
}
