/**
 * ============================================
 * MOVIE CARD SCRAPER & EXTRACTOR
 * ============================================
 * 
 * Extracts movie card data from scraped HTML pages.
 * Maps scraped data to application's movie card structure.
 * 
 * @author Antigravity AI
 * @version 1.0.0
 */

class ScraperCardExtractor {
    constructor(config = {}) {
        this.baseScrapingURL = config.baseScrapingURL || '';
        this.debug = config.debug || false;
    }

    /**
     * Extract all movie cards from HTML
     * @param {string} html - HTML content from scraper website
     * @returns {Array} - Array of movie card objects
     */
    extractMovieCards(html) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Find all movie cards
            const movieCards = doc.querySelectorAll('div.movie-card');

            if (this.debug) {
                console.log(`[ScraperCardExtractor] Found ${movieCards.length} movie cards`);
            }

            const extractedCards = [];
            movieCards.forEach((cardElement, index) => {
                try {
                    const cardData = this.parseMovieCard(cardElement);
                    if (cardData) {
                        // Generate unique ID based on post_url or index
                        cardData.id = this.generateCardId(cardData.post_url, index);
                        extractedCards.push(cardData);
                    }
                } catch (error) {
                    console.error('[ScraperCardExtractor] Error parsing card:', error);
                }
            });

            return extractedCards;
        } catch (error) {
            console.error('[ScraperCardExtractor] Error extracting movie cards:', error);
            return [];
        }
    }

    /**
     * Parse single movie card element
     * @param {Element} cardElement - Movie card DOM element
     * @returns {Object|null} - Parsed movie card data
     */
    parseMovieCard(cardElement) {
        try {
            const cardData = {
                // Required fields
                post_url: '',
                title: '',
                imageUrl: '',

                // Optional fields
                info1_custom: '',
                info2_quality: '',
                language_info: '',
                info4_type: '',
                upload_time: '',
                info6_status: '',
                enablePosterBlur: false,

                // Additional fields for compatibility
                visibility: 'published',
                server: true // Enable scraper integration for modal
            };

            // 1. Extract post_url from image container link
            const imageContainer = cardElement.querySelector('.image-container');
            const imageLink = imageContainer?.querySelector('a');
            if (imageLink) {
                const href = imageLink.getAttribute('href');
                cardData.post_url = this.resolveURL(href);
            }

            // 2. Extract image data
            const img = cardElement.querySelector('img');
            if (img) {
                // Get data-src or src
                cardData.imageUrl = img.getAttribute('data-src') || img.getAttribute('src') || '';
                cardData.title = img.getAttribute('alt') || img.getAttribute('title') || 'Untitled';
            }

            // 3. Extract badge group data (views/rating badge)
            const badgeGroup = cardElement.querySelector('.badge-group');
            if (badgeGroup) {
                // Check for views badge
                const viewsBadge = badgeGroup.querySelector('.views-badge-top');
                if (viewsBadge) {
                    const badgeText = viewsBadge.textContent.trim();
                    cardData.info1_custom = badgeText;
                }

                // Check for rating badge
                const ratingBadge = badgeGroup.querySelector('.badge.rating-badge');
                if (ratingBadge && !cardData.info1_custom) {
                    const badgeText = ratingBadge.textContent.trim();
                    cardData.info1_custom = badgeText;
                }

                // Check for any other badge
                if (!cardData.info1_custom) {
                    const anyBadge = badgeGroup.querySelector('.badge');
                    if (anyBadge) {
                        cardData.info1_custom = anyBadge.textContent.trim();
                    }
                }
            }

            // 4. Extract quality
            const qualitySpan = cardElement.querySelector('span.quality');
            if (qualitySpan) {
                cardData.info2_quality = qualitySpan.textContent.trim();
            }

            // 5. Extract language
            const languageSpan = cardElement.querySelector('span.language');
            if (languageSpan) {
                cardData.language_info = languageSpan.textContent.trim();
            }

            // 6. Extract type
            const typeSpan = cardElement.querySelector('span[class*="type-"]');
            if (typeSpan) {
                cardData.info4_type = typeSpan.textContent.trim();
            }

            // 7. Extract upload time
            const uploadTimeDiv = cardElement.querySelector('div.upload-time');
            if (uploadTimeDiv) {
                cardData.upload_time = uploadTimeDiv.textContent.trim();
            }

            // 8. Extract episode badge (status)
            const epBadge = cardElement.querySelector('span.badge.ep-badge.added');
            if (epBadge) {
                cardData.info6_status = epBadge.textContent.trim();
            }

            // 9. Extract title from .title class if not found in img
            if (!cardData.title || cardData.title === 'Untitled') {
                const titleElement = cardElement.querySelector('.title');
                if (titleElement) {
                    cardData.title = titleElement.textContent.trim();
                }
            }

            // 10. Check for adult content badge
            const adultBadge = cardElement.querySelector('span.badge.adult18plus-badge');
            if (adultBadge) {
                cardData.enablePosterBlur = true;
            }

            // Validate required fields
            if (!cardData.post_url || !cardData.title) {
                if (this.debug) {
                    console.warn('[ScraperCardExtractor] Skipping card - missing required fields:', cardData);
                }
                return null;
            }

            if (this.debug) {
                console.log('[ScraperCardExtractor] Parsed card:', cardData);
            }

            return cardData;
        } catch (error) {
            console.error('[ScraperCardExtractor] Error parsing movie card:', error);
            return null;
        }
    }

    /**
     * Resolve relative URL to absolute URL
     * @param {string} url - URL to resolve
     * @returns {string} - Absolute URL
     */
    resolveURL(url) {
        if (!url) return '';

        // Already absolute
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // Relative URL - prepend base scraping URL
        const base = this.baseScrapingURL.replace(/\/$/, '');
        const path = url.startsWith('/') ? url : '/' + url;

        return base + path;
    }

    /**
     * Generate unique card ID from post_url
     * @param {string} postUrl - Post URL
     * @param {number} index - Card index as fallback
     * @returns {string} - Unique ID
     */
    generateCardId(postUrl, index) {
        if (!postUrl) return `scraped-card-${index}`;

        // Extract ID from URL path
        // Example: https://example.com/movie/title-123/ -> title-123
        try {
            const url = new URL(postUrl);
            const pathParts = url.pathname.split('/').filter(p => p);
            const lastPart = pathParts[pathParts.length - 1];

            if (lastPart) {
                return lastPart;
            }
        } catch (error) {
            // Fallback to hash of URL
        }

        // Fallback: create hash from URL
        return `scraped-${this.simpleHash(postUrl)}`;
    }

    /**
     * Simple hash function for strings
     * @param {string} str - String to hash
     * @returns {string} - Hash string
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ScraperCardExtractor = ScraperCardExtractor;
}
