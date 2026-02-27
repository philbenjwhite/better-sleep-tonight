"use client";

import Image from "next/image";
import { Button } from "@/components/Button";
import styles from "./ProductRecommendations.module.css";

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
  buyUrl?: string;
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

export type PurchaseIntent = "ready-to-buy" | "not-ready-to-buy";

export interface ProductRecommendationsProps {
  content: ProductRecommendationsContent;
  /** Maximum number of mattress cards to display */
  maxItems?: number;
  /** Purchase intent from the preceding question step */
  purchaseIntent?: PurchaseIntent;
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
  purchaseIntent?: PurchaseIntent;
}

function MattressCard({ mattress, purchaseIntent }: MattressCardProps) {
  const isReadyToBuy = purchaseIntent === "ready-to-buy";
  const isNotReadyToBuy = purchaseIntent === "not-ready-to-buy";
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

        {/* Price & Buy Now Button */}
        <div className={styles.cardAction}>
          {mattress.basePrice > 0 && (
            <p className={styles.productPrice}>
              Starting at ${mattress.basePrice.toLocaleString()}
            </p>
          )}
          {isReadyToBuy && (
            <p className={styles.promoText}>
              You are eligible for a $300 discount! Code automatically applied at checkout.
            </p>
          )}
          <Button
            variant={isNotReadyToBuy ? "secondary" : "primary"}
            size="medium"
            className={styles.buyButton}
            onClick={
              mattress.buyUrl
                ? () => window.open(mattress.buyUrl, "_blank", "noopener,noreferrer")
                : undefined
            }
          >
            {isNotReadyToBuy ? "Learn More" : "Buy Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductRecommendations({
  content,
  maxItems,
  purchaseIntent,
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
              purchaseIntent={purchaseIntent}
            />
          ))}
        </div>
      </div>

      {/* Book a Rest Test CTA */}
      {onBookRestTest && (
        <div className={styles.restTestCta}>
          <div className={styles.restTestCtaContent}>
            <p className={styles.restTestCtaTitle}>Not sure which one to choose?</p>
            <p className={styles.restTestCtaSubtitle}>Try before you buy</p>
          </div>
          <Button
            variant={purchaseIntent === "not-ready-to-buy" ? "primary" : "secondary"}
            size="medium"
            onClick={onBookRestTest}
          >
            Book A Rest Test
          </Button>
        </div>
      )}
    </div>
  );
}
