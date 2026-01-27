'use client';

import styles from './FakeGoogleResults.module.css';

export interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  description: string;
  isHighlighted?: boolean;
}

export interface FakeGoogleResultsProps {
  searchQuery?: string;
  results?: SearchResult[];
}

const defaultResults: SearchResult[] = [
  {
    title: 'Better Sleep Tonight - Find Your Perfect Mattress',
    url: '/',
    displayUrl: 'bettersleeptonight.com',
    description: 'Get personalized mattress recommendations based on your sleep style, body type, and preferences. Find Ashley stores near you and book a rest test today.',
    isHighlighted: true,
  },
  {
    title: 'Best Mattresses 2025: Top Picks for Every Sleep Style',
    url: 'https://sleepfoundation.org/best-mattress',
    displayUrl: 'sleepfoundation.org › best-mattress',
    description: 'Our team tested 200+ mattresses to find the best options for all sleep positions and body types. Updated January 2025.',
  },
  {
    title: 'How to Choose a Mattress - Consumer Reports',
    url: 'https://consumerreports.org/mattresses',
    displayUrl: 'consumerreports.org › mattresses',
    description: 'Expert advice on finding the right mattress firmness, materials, and features for your needs. Compare top-rated brands.',
  },
  {
    title: 'Mattress Buying Guide: What to Look For - Sleep Advisor',
    url: 'https://sleepadvisor.org/mattress-guide',
    displayUrl: 'sleepadvisor.org › mattress-guide',
    description: 'Everything you need to know before buying a new mattress. Tips on sizing, materials, and getting the best deal.',
  },
];

export function FakeGoogleResults({
  searchQuery = 'best mattress for back pain',
  results = defaultResults,
}: FakeGoogleResultsProps) {
  return (
    <div className={styles.container}>
      {/* Google Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <svg className={styles.logo} viewBox="0 0 272 92" width="92" height="30">
            <path fill="#4285F4" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
            <path fill="#EA4335" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
            <path fill="#FBBC05" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
            <path fill="#4285F4" d="M225 3v65h-9.5V3h9.5z"/>
            <path fill="#34A853" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
            <path fill="#EA4335" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
          </svg>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" width="20" height="20">
              <path fill="#9aa0a6" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              defaultValue={searchQuery}
              readOnly
            />
            <svg className={styles.micIcon} viewBox="0 0 24 24" width="24" height="24">
              <path fill="#4285f4" d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/>
              <path fill="#34a853" d="M11 18.92h2V22h-2z"/>
              <path fill="#fbbc05" d="M7 12H5c0 2.76 2.24 5 5 5v-2c-1.66 0-3-1.34-3-3z"/>
              <path fill="#ea4335" d="M12 17c2.76 0 5-2.24 5-5h-2c0 1.66-1.34 3-3 3v2z"/>
            </svg>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.appsButton}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#9aa0a6" d="M6 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM6 14c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM6 20c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
              </svg>
            </button>
            <div className={styles.avatar}>M</div>
          </div>
        </div>
        <nav className={styles.nav}>
          <button className={`${styles.navItem} ${styles.active}`}>All</button>
          <button className={styles.navItem}>Images</button>
          <button className={styles.navItem}>Videos</button>
          <button className={styles.navItem}>Shopping</button>
          <button className={styles.navItem}>News</button>
          <button className={styles.navItem}>More</button>
        </nav>
      </header>

      {/* Results */}
      <main className={styles.results}>
        <p className={styles.resultCount}>About 142,000,000 results (0.52 seconds)</p>

        {results.map((result, index) => (
          <article
            key={index}
            className={`${styles.result} ${result.isHighlighted ? styles.highlighted : ''}`}
          >
            <div className={styles.resultUrl}>
              <span className={styles.favicon}>
                {result.isHighlighted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="8" fill="#f68b29"/>
                    <text x="8" y="11" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">B</text>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="8" fill="#303134"/>
                  </svg>
                )}
              </span>
              <div className={styles.urlText}>
                <span className={styles.siteName}>{result.displayUrl}</span>
              </div>
            </div>
            <h3 className={styles.resultTitle}>
              <a href={result.url} onClick={result.isHighlighted ? undefined : (e) => e.preventDefault()}>
                {result.title}
              </a>
            </h3>
            <p className={styles.resultDescription}>{result.description}</p>
          </article>
        ))}
      </main>
    </div>
  );
}

export default FakeGoogleResults;
