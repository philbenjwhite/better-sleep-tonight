import { ProductRecommendationsContent } from "@/components/ProductRecommendations";

// Video steps that pause at end and show a manual CTA button instead of auto-advancing
export const MANUAL_CTA_LABELS: Record<string, string> = {
  "intro-video": "Let\u2019s Go",
  "video-step-1": "See My Options",
};

// Step templates that belong to the "Results" phase
export const RESULTS_TEMPLATES = new Set([
  "emailCaptureStep",
  "seeOptionsStep",
  "productRecommendationsStep",
  "zipcodeCaptureStep",
  "storeLocationsStep",
  "bookingCtaStep",
]);

// Default product recommendations content (fallback when CMS content not provided)
export const DEFAULT_PRODUCT_RECOMMENDATIONS: ProductRecommendationsContent = {
  headline: "Your Perfect Mattress Matches",
  introParagraph:
    "Based on your sleep profile, I've found three mattresses that will help you wake up without back pain.",
  mattressOptions: [
    {
      id: "tempur-sense",
      productName: "TEMPUR SENSE\u00ae",
      productDescription:
        "Adaptive support, pressure relief, and motion absorption\u2014powered by TEMPUR\u00ae Material and finished with a premium cover.",
      basePrice: 1299,
      productImage: "/images/mattresses/tempur-sense.avif",
      badge: "Best Value",
      profile: '10-11"',
      coolingLevel: 2,
      pressureReliefLevel: 4,
      features: [
        "3 layer foam construction",
        "Fast-adapting foam for pressure relief",
        "Premium fabric cover",
      ],
      buyUrl:
        "https://ashleyhomestore.ca/products/tempur-pedic-sense-medium-10-inch-mattress?variant=43041759428697&queryID=5799338564ac18ac17aab900ad7f7f8c&objectID=43041759428697",
    },
    {
      id: "tempur-prosense",
      productName: "TEMPUR [PRO]SENSE\u00ae",
      productDescription:
        "Up to 28% cooler comfort and 20% more pressure relief with TEMPUR APR+\u2122 Material\u2014plus adaptive support and motion isolation.",
      basePrice: 1699,
      productImage: "/images/mattresses/tempur-prosense.avif",
      badge: "Most Popular",
      profile: '12"',
      coolingLevel: 3,
      pressureReliefLevel: 5,
      features: [
        "4 layer foam construction",
        "TEMPUR-APR+\u2122 for advanced pressure relief",
        "Cool-to-touch removable cover",
      ],
      buyUrl:
        "https://ashleyhomestore.ca/products/tempur-pedic-prosense-soft-12-inch-mattress?variant=43041759101017&queryID=f19b1fddd1ac8d8a7791ab9947eae568&objectID=43041759101017",
    },
    {
      id: "tempur-luxealign",
      productName: "TEMPUR [LUXE]ALIGN\u00ae",
      productDescription:
        "Delivers up to 28% cooler comfort and 20% more pressure relief with TEMPUR APR+\u2122 elevated by an ergonomic layer that adapts to every curve for personalized spinal alignment.",
      basePrice: 2199,
      productImage: "/images/mattresses/tempur-luxealign.avif",
      badge: "Most Advanced",
      profile: '13"',
      coolingLevel: 4,
      pressureReliefLevel: 5,
      features: [
        "5 layer construction",
        "Zoned ergonomic layer adapts to your body to help support your spine",
        "TEMPUR-APR+\u2122 for maximum pressure relief",
        "Cool-to-touch removable cover",
      ],
      buyUrl:
        "https://ashleyhomestore.ca/products/tempur-pedic-luxealign-soft-13-inch-mattress?variant=43041759297625&queryID=6201e3d8e86372538312d8791946cf87&objectID=43041759297625",
    },
  ],
  sizes: [
    { value: "twin", label: "Twin", priceModifier: -300 },
    { value: "twin-xl", label: "Twin XL", priceModifier: -200 },
    { value: "full", label: "Full", priceModifier: -100 },
    { value: "queen", label: "Queen", priceModifier: 0 },
    { value: "king", label: "King", priceModifier: 200 },
  ],
  feels: [
    { value: "soft", label: "Soft" },
    { value: "medium", label: "Medium" },
    { value: "firm", label: "Firm" },
  ],
  avatarResponse:
    "Great choice! This mattress is perfect for your sleep needs.",
};
