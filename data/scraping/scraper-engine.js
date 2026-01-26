/**
 * ============================================
 * ADVANCED CLIENT-SIDE WEB SCRAPING ENGINE
 * ============================================
 * 
 * This engine handles all scraping logic for the movie website.
 * It operates entirely client-side with user-triggered actions only.
 * 
 * Features:
 * - URL generation with proper encoding
 * - HTML parsing and data extraction
 * - Strict validation across multiple pages
 * - Download flow management
 * - CORS proxy support
 * 
 * @author Antigravity AI
 * @version 1.0.0
 */

class ScraperEngine {
    constructor(config = {}) {
        this.baseScrapingURL = config.baseScrapingURL || '';
        this.useCORSProxy = config.useCORSProxy || false;
        this.corsProxyURL = config.corsProxyURL || 'https://api.allorigins.win/raw?url=';
        this.debug = config.debug || false;

        // Cache for fetched HTML to avoid redundant requests
        this.htmlCache = new Map();

        // Validation state
        this.currentValidation = null;
    }

    /**
     * ============================================
     * 1. URL GENERATION SYSTEM
     * ============================================
     */

    /**
     * Generate search URL from movie title
     * @param {string} title - Movie title
     * @returns {string} - Encoded search URL
     */
    generateSearchURL(title) {
        if (!title) {
            throw new Error('Title is required for URL generation');
        }

        // Encode title: Space → +, Special symbols → URL encoded
        const encodedTitle = encodeURIComponent(title.trim())
            .replace(/%20/g, '+');

        const searchURL = `${this.baseScrapingURL}/search?q=${encodedTitle}`;

        if (this.debug) {
            console.log('[ScraperEngine] Generated Search URL:', searchURL);
        }

        return searchURL;
    }

    /**
     * Resolve relative URL to absolute URL
     * @param {string} relativeURL - Relative URL (e.g., /getLink/123)
     * @param {string} baseURL - Base URL (optional, uses baseScrapingURL if not provided)
     * @returns {string} - Absolute URL
     */
    resolveRelativeURL(relativeURL, baseURL = null) {
        if (!relativeURL) return '';

        // Already absolute URL
        if (relativeURL.startsWith('http://') || relativeURL.startsWith('https://')) {
            return relativeURL;
        }

        const base = baseURL || this.baseScrapingURL;

        // Remove trailing slash from base
        const cleanBase = base.replace(/\/$/, '');

        // Ensure relative URL starts with /
        const cleanRelative = relativeURL.startsWith('/') ? relativeURL : '/' + relativeURL;

        return cleanBase + cleanRelative;
    }

    /**
     * ============================================
     * 2. HTML FETCHING & PARSING
     * ============================================
     */

    /**
     * Fetch HTML from URL with CORS proxy support
     * @param {string} url - URL to fetch
     * @param {boolean} useCache - Use cached HTML if available
     * @returns {Promise<string>} - HTML content
     */
    async fetchHTML(url, useCache = true) {
        if (!url) {
            throw new Error('URL is required for fetching HTML');
        }

        // Check cache first
        if (useCache && this.htmlCache.has(url)) {
            if (this.debug) {
                console.log('[ScraperEngine] Using cached HTML for:', url);
            }
            return this.htmlCache.get(url);
        }

        try {
            const fetchURL = this.useCORSProxy ? this.corsProxyURL + encodeURIComponent(url) : url;

            if (this.debug) {
                console.log('[ScraperEngine] Fetching HTML from:', fetchURL);
            }

            const response = await fetch(fetchURL, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                mode: this.useCORSProxy ? 'cors' : 'no-cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();

            // Cache the HTML
            this.htmlCache.set(url, html);

            return html;

        } catch (error) {
            console.error('[ScraperEngine] Error fetching HTML:', error);
            throw new Error(`Failed to fetch HTML from ${url}: ${error.message}`);
        }
    }

    /**
     * Parse HTML string to DOM Document
     * @param {string} html - HTML string
     * @returns {Document} - Parsed DOM document
     */
    parseHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Check for parser errors
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Failed to parse HTML: ' + parserError.textContent);
        }

        return doc;
    }

    /**
     * ============================================
     * 3. SEARCH PAGE DATA MATCHING
     * ============================================
     */

    /**
     * Match search results with movie data
     * @param {string} searchHTML - Search page HTML
     * @param {Object} movieData - Movie data from JSON (title, imageUrl)
     * @returns {Promise<string|null>} - Detail page URL or null if no match
     */
    async matchSearchResults(searchHTML, movieData) {
        try {
            const doc = this.parseHTML(searchHTML);
            const movieCards = doc.querySelectorAll('div.movie-card');

            if (this.debug) {
                console.log('[ScraperEngine] Found movie cards:', movieCards.length);
            }

            for (const card of movieCards) {
                const dataSrc = card.getAttribute('data-src');
                const titleElement = card.querySelector('.title');

                if (!titleElement) continue;

                const cardTitle = titleElement.textContent.trim();
                const cardImageUrl = dataSrc;

                // Strict matching: both title and imageUrl must match
                const titleMatch = cardTitle === movieData.title;
                const imageMatch = cardImageUrl === movieData.imageUrl;

                if (this.debug) {
                    console.log('[ScraperEngine] Checking card:', {
                        cardTitle,
                        cardImageUrl,
                        titleMatch,
                        imageMatch
                    });
                }

                if (titleMatch && imageMatch) {
                    // Found a match! Get the detail page URL
                    const detailPageURL = titleElement.getAttribute('href') ||
                        titleElement.closest('a')?.getAttribute('href');

                    if (detailPageURL) {
                        const absoluteURL = this.resolveRelativeURL(detailPageURL);

                        if (this.debug) {
                            console.log('[ScraperEngine] Match found! Detail URL:', absoluteURL);
                        }

                        return absoluteURL;
                    }
                }
            }

            // No match found
            if (this.debug) {
                console.log('[ScraperEngine] No matching movie card found');
            }

            return null;

        } catch (error) {
            console.error('[ScraperEngine] Error matching search results:', error);
            throw error;
        }
    }

    /**
     * ============================================
     * 4. DETAIL PAGE STRICT VALIDATION
     * ============================================
     */

    /**
     * Validate detail page against movie data (ALL fields must match)
     * @param {string} detailHTML - Detail page HTML
     * @param {Object} movieData - Complete movie data from JSON
     * @returns {Promise<Object>} - Validation result { valid: boolean, errors: Array }
     */
    async validateDetailPage(detailHTML, movieData) {
        try {
            const doc = this.parseHTML(detailHTML);
            const errors = [];

            // 1. Validate imageUrl
            const imageElement = doc.querySelector('.image-container-view img');
            const scrapedImageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src');

            if (scrapedImageUrl !== movieData.imageUrl) {
                errors.push(`Image URL mismatch: Expected "${movieData.imageUrl}", got "${scrapedImageUrl}"`);
            }

            // 2. Validate screenshotLinks
            const screenshotElements = doc.querySelectorAll('.screenshot-wrapper [data-src]');
            const scrapedScreenshots = Array.from(screenshotElements).map(el => el.getAttribute('data-src'));

            if (!this.arraysEqual(scrapedScreenshots, movieData.screenshotLinks)) {
                errors.push(`Screenshot links mismatch`);
            }

            // 3. Validate storyline
            const storylineElement = doc.querySelector('.storyline-box.mt-2 .story-text');
            const scrapedStoryline = storylineElement?.textContent.trim();

            if (scrapedStoryline !== movieData.storyline) {
                errors.push(`Storyline mismatch`);
            }

            // 4. Extract and validate info-line data using regex
            const infoLineData = this.extractInfoLineData(doc);

            if (infoLineData.type !== movieData.type) {
                errors.push(`Type mismatch: Expected "${movieData.type}", got "${infoLineData.type}"`);
            }

            if (infoLineData.genre !== movieData.genre) {
                errors.push(`Genre mismatch: Expected "${movieData.genre}", got "${infoLineData.genre}"`);
            }

            if (infoLineData.resolution !== movieData.resolution) {
                errors.push(`Resolution mismatch: Expected "${movieData.resolution}", got "${infoLineData.resolution}"`);
            }

            if (infoLineData.released !== movieData.released) {
                errors.push(`Released mismatch: Expected "${movieData.released}", got "${infoLineData.released}"`);
            }

            if (infoLineData.cast !== movieData.cast) {
                errors.push(`Cast mismatch: Expected "${movieData.cast}", got "${infoLineData.cast}"`);
            }

            // Validation result
            const valid = errors.length === 0;

            if (this.debug) {
                console.log('[ScraperEngine] Validation result:', { valid, errors });
            }

            this.currentValidation = { valid, errors, doc };

            return { valid, errors, doc };

        } catch (error) {
            console.error('[ScraperEngine] Error validating detail page:', error);
            return { valid: false, errors: [error.message], doc: null };
        }
    }

    /**
     * Extract info-line data using regex patterns
     * @param {Document} doc - Parsed HTML document
     * @returns {Object} - Extracted data { type, genre, resolution, released, cast }
     */
    extractInfoLineData(doc) {
        const infoLines = doc.querySelectorAll('.info-line');
        const data = {
            type: '',
            genre: '',
            resolution: '',
            released: '',
            cast: ''
        };

        infoLines.forEach(line => {
            const text = line.textContent;

            // Extract Type
            const typeMatch = text.match(/Type:\s*(.+?)(?:\||$)/i);
            if (typeMatch) data.type = typeMatch[1].trim();

            // Extract Genre
            const genreMatch = text.match(/Genre:\s*(.+?)(?:\||$)/i);
            if (genreMatch) data.genre = genreMatch[1].trim();

            // Extract Resolution
            const resolutionMatch = text.match(/Resolution:\s*(.+?)(?:\||$)/i);
            if (resolutionMatch) data.resolution = resolutionMatch[1].trim();

            // Extract Released
            const releasedMatch = text.match(/Released:\s*(.+?)(?:\||$)/i);
            if (releasedMatch) data.released = releasedMatch[1].trim();

            // Extract Cast
            const castMatch = text.match(/Cast:\s*(.+?)(?:\||$)/i);
            if (castMatch) data.cast = castMatch[1].trim();
        });

        return data;
    }

    /**
     * Compare two arrays for equality
     * @param {Array} arr1 - First array
     * @param {Array} arr2 - Second array
     * @returns {boolean} - True if arrays are equal
     */
    arraysEqual(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
        if (arr1.length !== arr2.length) return false;

        return arr1.every((val, index) => val === arr2[index]);
    }

    /**
     * ============================================
     * 5. INSTRUCTION / NOTICE SECTION SCRAPER
     * ============================================
     */

    /**
     * Scrape instruction/notice section from detail page
     * @param {Document} doc - Parsed HTML document
     * @returns {Object} - Scraped instruction data
     */
    scrapeInstructionSection(doc) {
        const instructionData = {
            header: null,
            notices: [],
            unzipGuide: null
        };

        try {
            // Find the main instruction container
            const container = doc.querySelector('div.text-md.border-bottom-dark.mb-2.text-center.align-items-center.text-warning.fw-bold');

            if (!container) {
                if (this.debug) {
                    console.log('[ScraperEngine] No instruction section found');
                }
                return instructionData;
            }

            // Extract header elements (same row)
            const headerH3 = container.querySelector('h3.text-success.font-weight-bold');
            const headerH5 = container.querySelector('h5.text-warning');
            const attentionSpan = container.querySelector('span.mlbd-note-attn');
            const redDiv = container.querySelector('div[style*="color:#ff5b6b"]') ||
                container.querySelector('div[style*="color: #ff5b6b"]');

            if (headerH3 || headerH5 || attentionSpan || redDiv) {
                instructionData.header = {
                    h3: headerH3?.textContent.trim() || '',
                    h5: headerH5?.textContent.trim() || '',
                    attention: attentionSpan?.textContent.trim() || '',
                    redNotice: redDiv?.textContent.trim() || ''
                };
            }

            // Extract next line notice (yellow color)
            const yellowDiv = container.querySelector('div[style*="color:#ffc107"]') ||
                container.querySelector('div[style*="color: #ffc107"]');

            if (yellowDiv) {
                instructionData.notices.push({
                    type: 'warning',
                    text: yellowDiv.textContent.trim()
                });
            }

            // Extract unzip guide
            const unzipSection = doc.querySelector('div.text-center.fw-bold.text-info.mb-3');
            if (unzipSection) {
                const unzipText = unzipSection.textContent.trim();
                const unzipLink = '/unzip.mp4'; // Fixed href as per requirements

                instructionData.unzipGuide = {
                    text: unzipText,
                    href: this.resolveRelativeURL(unzipLink)
                };
            }

            if (this.debug) {
                console.log('[ScraperEngine] Scraped instruction section:', instructionData);
            }

        } catch (error) {
            console.error('[ScraperEngine] Error scraping instruction section:', error);
        }

        return instructionData;
    }

    /**
     * ============================================
     * 6. INFO / GUIDE TEXT SECTION SCRAPER
     * ============================================
     */

    /**
     * Scrape info/guide text section from detail page
     * @param {Document} doc - Parsed HTML document
     * @returns {Object} - Scraped guide data
     */
    scrapeGuideSection(doc) {
        const guideData = {
            headers: [],
            guides: [],
            vlcLink: null
        };

        try {
            // Extract h3 headers (text-success)
            const h3Elements = doc.querySelectorAll('h3.text-md.text-success');
            h3Elements.forEach(h3 => {
                guideData.headers.push({
                    level: 3,
                    text: h3.textContent.trim()
                });
            });

            // Extract h4 headers (text-warning)
            const h4Elements = doc.querySelectorAll('h4.text-sm.text-warning');
            h4Elements.forEach(h4 => {
                guideData.headers.push({
                    level: 4,
                    text: h4.textContent.trim()
                });
            });

            // Extract guide text blocks
            const guideBlocks = doc.querySelectorAll('div.mb-3');
            guideBlocks.forEach(block => {
                const warningSpan = block.querySelector('span.text-warning.fw-bold');
                const infoSpan = block.querySelector('span.text-info.fw-semibold');

                if (warningSpan || infoSpan) {
                    guideData.guides.push({
                        warning: warningSpan?.textContent.trim() || '',
                        info: infoSpan?.textContent.trim() || ''
                    });
                }
            });

            // Extract VLC player link
            const vlcSection = doc.querySelector('div.text-center.mt-3');
            if (vlcSection) {
                const vlcLink = vlcSection.querySelector('a[href*="play.google.com"]');
                if (vlcLink) {
                    guideData.vlcLink = {
                        text: vlcLink.textContent.trim(),
                        href: 'https://play.google.com/store/apps/details?id=org.videolan.vlc'
                    };
                }
            }

            if (this.debug) {
                console.log('[ScraperEngine] Scraped guide section:', guideData);
            }

        } catch (error) {
            console.error('[ScraperEngine] Error scraping guide section:', error);
        }

        return guideData;
    }

    /**
     * ============================================
     * 7. DOWNLOAD CARD SCRAPING LOGIC
     * ============================================
     */

    /**
     * Scrape download cards from detail page
     * @param {Document} doc - Parsed HTML document
     * @returns {Array} - Array of download options
     */
    scrapeDownloadCards(doc) {
        const downloadOptions = [];

        try {
            const cards = doc.querySelectorAll('div.card.h-100.border-left-success.shadow-sm.position-relative');

            if (this.debug) {
                console.log('[ScraperEngine] Found download cards:', cards.length);
            }

            cards.forEach((card, cardIndex) => {
                const cardData = {
                    header: '',
                    downloads: [],
                    icon: null,
                    extraText: ''
                };

                // Extract header
                const header = card.querySelector('h5.mb-3');
                if (header) {
                    cardData.header = header.textContent.trim();
                }

                // Extract download links
                const downloadLinks = card.querySelectorAll('a[href^="/getLink/"]');

                downloadLinks.forEach(link => {
                    const anchorText = link.textContent.trim();

                    // Parse format: "Download [720p • 443 MB]"
                    const match = anchorText.match(/Download\s*\[(.+?)\s*•\s*(.+?)\]/i);

                    if (match) {
                        const quality = match[1].trim(); // "720p"
                        const size = match[2].trim();    // "443 MB"
                        const href = this.resolveRelativeURL(link.getAttribute('href'));

                        cardData.downloads.push({
                            quality,
                            size,
                            href,
                            fullText: anchorText
                        });
                    }
                });

                // Extract icon if present
                const icon = card.querySelector('i.fas.fa-cloud-download-alt');
                if (icon) {
                    cardData.icon = {
                        class: icon.className,
                        exists: true
                    };
                }

                // Extract extra text
                const extraTextElements = card.querySelectorAll('.mb-3');
                extraTextElements.forEach(el => {
                    if (el !== header && !el.querySelector('a')) {
                        cardData.extraText += el.textContent.trim() + ' ';
                    }
                });

                // Only add card if it has downloads
                if (cardData.downloads.length > 0) {
                    downloadOptions.push(cardData);
                }
            });

            if (this.debug) {
                console.log('[ScraperEngine] Scraped download options:', downloadOptions);
            }

        } catch (error) {
            console.error('[ScraperEngine] Error scraping download cards:', error);
        }

        return downloadOptions;
    }

    /**
     * ============================================
     * 8. ONE-CLICK DOWNLOAD FLOW HANDLER
     * ============================================
     */

    /**
     * Handle one-click download flow (multi-step)
     * @param {string} downloadURL - Initial download link
     * @returns {Promise<Object>} - Final download button data
     */
    async handleOneClickDownload(downloadURL) {
        try {
            if (this.debug) {
                console.log('[ScraperEngine] Starting one-click download flow:', downloadURL);
            }

            // Step 1: Fetch the initial download page
            const page1HTML = await this.fetchHTML(downloadURL, false);
            const page1Doc = this.parseHTML(page1HTML);

            // Step 2: Find "ONE CLICK DOWNLOAD" button
            const oneClickBtn = this.findElementByText(page1Doc, 'a', 'ONE CLICK DOWNLOAD');

            if (!oneClickBtn) {
                throw new Error('ONE CLICK DOWNLOAD button not found');
            }

            const oneClickURL = this.resolveRelativeURL(oneClickBtn.getAttribute('href'));

            if (this.debug) {
                console.log('[ScraperEngine] Found ONE CLICK DOWNLOAD URL:', oneClickURL);
            }

            // Step 3: Fetch the second page
            const page2HTML = await this.fetchHTML(oneClickURL, false);
            const page2Doc = this.parseHTML(page2HTML);

            // Step 4: Find #download or "Open Direct Download Link"
            let finalLinkElement = page2Doc.querySelector('#download');

            if (!finalLinkElement) {
                finalLinkElement = this.findElementByText(page2Doc, 'a', 'Open Direct Download Link');
            }

            if (!finalLinkElement) {
                throw new Error('Direct download link not found');
            }

            // Step 5: Find the actual download button
            const downloadBtn = page2Doc.querySelector('.big-cta.d-grid.gap-3.mb-5.uppercase');

            if (!downloadBtn) {
                throw new Error('Download button not found');
            }

            // Extract button data
            const icon = downloadBtn.querySelector('.fas.fa-cloud-download-alt');
            const buttonText = downloadBtn.textContent.trim();
            const buttonHref = this.resolveRelativeURL(downloadBtn.getAttribute('href'));

            const result = {
                success: true,
                buttonText,
                buttonHref,
                hasIcon: !!icon
            };

            if (this.debug) {
                console.log('[ScraperEngine] One-click download flow complete:', result);
            }

            return result;

        } catch (error) {
            console.error('[ScraperEngine] Error in one-click download flow:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Find element by text content
     * @param {Document} doc - Parsed HTML document
     * @param {string} selector - CSS selector
     * @param {string} text - Text to search for
     * @returns {Element|null} - Found element or null
     */
    findElementByText(doc, selector, text) {
        const elements = doc.querySelectorAll(selector);

        for (const element of elements) {
            if (element.textContent.includes(text)) {
                return element;
            }
        }

        return null;
    }

    /**
     * ============================================
     * 9. COMPLETE SCRAPING WORKFLOW
     * ============================================
     */

    /**
     * Execute complete scraping workflow for a movie
     * @param {string} movieTitle - Movie title to scrape
     * @param {Object} movieData - Complete movie data from JSON
     * @returns {Promise<Object>} - Scraped data or error
     */
    async scrapeMovie(movieTitle, movieData) {
        try {
            if (this.debug) {
                console.log('[ScraperEngine] Starting scraping workflow for:', movieTitle);
            }

            // Step 1: Generate search URL
            const searchURL = this.generateSearchURL(movieTitle);

            // Step 2: Fetch search page
            const searchHTML = await this.fetchHTML(searchURL);

            // Step 3: Match search results
            const detailPageURL = await this.matchSearchResults(searchHTML, movieData);

            if (!detailPageURL) {
                return {
                    success: false,
                    error: 'No matching movie found in search results'
                };
            }

            // Step 4: Fetch detail page
            const detailHTML = await this.fetchHTML(detailPageURL);

            // Step 5: Validate detail page (STRICT)
            const validation = await this.validateDetailPage(detailHTML, movieData);

            if (!validation.valid) {
                return {
                    success: false,
                    error: 'Validation failed',
                    validationErrors: validation.errors
                };
            }

            // Step 6: Scrape all sections (only if validation passed)
            const instructionData = this.scrapeInstructionSection(validation.doc);
            const guideData = this.scrapeGuideSection(validation.doc);
            const downloadOptions = this.scrapeDownloadCards(validation.doc);

            // Return complete scraped data
            return {
                success: true,
                detailPageURL,
                instructionData,
                guideData,
                downloadOptions
            };

        } catch (error) {
            console.error('[ScraperEngine] Error in scraping workflow:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clear HTML cache
     */
    clearCache() {
        this.htmlCache.clear();
        if (this.debug) {
            console.log('[ScraperEngine] Cache cleared');
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScraperEngine;
}
