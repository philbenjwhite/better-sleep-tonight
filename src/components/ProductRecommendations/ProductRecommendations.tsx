"use client";

import Image from "next/image";
import { Tag } from "@phosphor-icons/react";
import { Button } from "@/components/Button";
import styles from "./ProductRecommendations.module.css";

/**
 * Cards show "Starting at $X" so shoppers can gauge the range before booking.
 * Flip to `false` to hide pricing on every card.
 */
const SHOW_CARD_PRICE = true;

/** Offer flash shown above the CTA on every card. */
const OFFER_FLASH_TEXT = "Get $300 off in store";

export type MattressSize = "twin" | "twin-xl" | "full" | "queen" | "king";
export type MattressFeel = "soft" | "medium" | "firm" | "hybrid";

export interface MattressOption {
  id: string;
  productName: string;
  productDescription: string;
  basePrice: number;
  productImage: string;
  badge?: string;
  profile?: string;
  coolingLevel?: number;
  pressureReliefLevel?: number;
  features?: string[];
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
}

export interface ProductRecommendationsProps {
  content: ProductRecommendationsContent;
  /** Maximum number of mattress cards to display */
  maxItems?: number;
  onSelectionComplete?: (selection: {
    mattressId: string;
    mattressName: string;
    size: MattressSize;
    feel: MattressFeel;
    finalPrice: number;
  }) => void;
  onContinue?: (selection: {
    mattressId: string;
    mattressName: string;
    size: MattressSize;
    feel: MattressFeel;
    finalPrice: number;
  }) => void;
  onBookRestTest?: () => void;
}

// Individual Mattress Card Component
interface MattressCardProps {
  mattress: MattressOption;
  onBookRestTest?: () => void;
}

function MattressCard({ mattress, onBookRestTest }: MattressCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardMain}>
        {/* Product Image with Badge */}
        <div className={styles.cardImage}>
          {mattress.badge && (
            <div className={styles.badge}>
              <span className={styles.badgeFull}>{mattress.badge}</span>
              <span className={styles.badgeShort}>
                {mattress.badge === "Most Popular" ? "Popular" :
                 mattress.badge === "Premium Choice" ? "Premium" :
                 mattress.badge}
              </span>
            </div>
          )}
          <Image
            src={mattress.productImage}
            alt={mattress.productName}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
            className={styles.mattressImage}
          />
        </div>

        {/* Product Info */}
        <div className={styles.cardInfo}>
          <div className={styles.cardInfoPrimary}>
            <div className={styles.productHeader}>
              <p className={styles.productName}>
                {mattress.productName.includes("[") ? (
                  mattress.productName.split(/(\[.*?\])/).map((part, i) =>
                    part.startsWith("[") && part.endsWith("]") ? (
                      <span key={i} className={styles.productNameLight}>
                        {part.slice(1, -1)}
                      </span>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )
                ) : (
                  mattress.productName
                )}
              </p>
              {mattress.profile && (
                <span className={styles.profile}>{mattress.profile} Profile</span>
              )}
            </div>
            <p className={styles.productDescription}>{mattress.productDescription}</p>
          </div>

          <div className={styles.cardInfoSecondary}>
            {/* Attribute Bars */}
            {(mattress.coolingLevel || mattress.pressureReliefLevel) && (
              <div className={styles.attributeBars}>
                {mattress.coolingLevel && (
                  <div className={styles.attributeRow}>
                    <span className={styles.attributeLabel}>Cooling</span>
                    <div className={styles.attributeBar}>
                      <div
                        className={styles.attributeFill}
                        style={{ width: `${(mattress.coolingLevel / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {mattress.pressureReliefLevel && (
                  <div className={styles.attributeRow}>
                    <span className={styles.attributeLabel}>Pressure Relief</span>
                    <div className={styles.attributeBar}>
                      <div
                        className={styles.attributeFill}
                        style={{ width: `${(mattress.pressureReliefLevel / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Features */}
            {mattress.features && mattress.features.length > 0 && (
              <ul className={styles.featuresList}>
                {mattress.features.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="#D4830A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Offer flash & Book A Rest Test button */}
        <div className={styles.cardAction}>
          {SHOW_CARD_PRICE && mattress.basePrice > 0 && (
            <p className={styles.productPrice}>
              Starting at ${mattress.basePrice.toLocaleString()}
            </p>
          )}
          <div className={styles.promoBadge}>
            <Tag size={16} weight="fill" className={styles.promoBadgeIcon} />
            <p className={styles.promoBadgeText}>{OFFER_FLASH_TEXT}</p>
          </div>
          <Button
            variant="primary"
            size="medium"
            className={styles.buyButton}
            onClick={onBookRestTest}
          >
            Book A Rest Test
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductRecommendations({
  content,
  maxItems,
  onBookRestTest,
}: ProductRecommendationsProps) {
  // Show only mattresses with badges (the top recommendations)
  const badgedMattresses = content.mattressOptions.filter((m) => m.badge);
  const displayedMattresses = maxItems ? badgedMattresses.slice(0, maxItems) : badgedMattresses;

  const isTwoUp = displayedMattresses.length === 2;

  return (
    <div className={`${styles.container} ${isTwoUp ? styles.containerTwoUp : ""}`}>
      {content.headline && (
        <h2 className={styles.headline}>{content.headline}</h2>
      )}
      <div className={styles.listWrapper}>
        <div className={`${styles.list} ${isTwoUp ? styles.listTwoUp : ""}`}>
          {displayedMattresses.map((mattress) => (
            <MattressCard
              key={mattress.id}
              mattress={mattress}
              onBookRestTest={onBookRestTest}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
