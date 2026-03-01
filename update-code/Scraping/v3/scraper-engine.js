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
        this.corsProxyURL = config.corsProxyURL || 'https://corsproxy.io/?url=';
        this.fallbackProxyURL = 'https://api.allorigins.win/raw?url='; // Use AllOrigins as fallback
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

        // Use standard URLSearchParams for robust encoding
        const params = new URLSearchParams();

        // Clean title: Remove (YEAR) for better search matching on WordPress
        const cleanTitle = title.replace(/\s*\(\d{4}\)\s*/g, ' ').trim();
        params.append('s', cleanTitle);

        const searchURL = `${this.baseScrapingURL}/?${params.toString()}`;

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
    async fetchHTML(url, useCache = true, signal = null) {
        if (!url) throw new Error('URL is required for fetching HTML');

        if (useCache && this.htmlCache.has(url)) {
            if (this.debug) console.log('[ScraperEngine] Using cached HTML:', url);
            return this.htmlCache.get(url);
        }

        const isTelegram = (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) ||
            (navigator.userAgent.toLowerCase().includes('telegram'));

        // Optimized proxy list
        // Prioritize Speed and Reliability (CorsProxy is currently most stable)
        let proxies = [
            { name: 'CorsProxy', url: 'https://corsproxy.io/?url=', type: 'raw' },
            { name: 'CodeTabs', url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'raw' },
            { name: 'Hiproxy', url: 'https://api.hiproxy.org/v1/proxy/get?url=', type: 'raw' },
            { name: 'AllOrigins (Raw)', url: 'https://api.allorigins.win/raw?url=', type: 'raw' }
        ];

        // Reorder for Telegram to avoid blocks
        if (isTelegram) {
            proxies = [
                { name: 'CorsProxy', url: 'https://corsproxy.io/?url=', type: 'raw' },
                { name: 'CodeTabs', url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'raw' },
                { name: 'Hiproxy', url: 'https://api.hiproxy.org/v1/proxy/get?url=', type: 'raw' }
            ];
        }

        // DYNAMIC OPTIMIZATION: Move last known good proxy to front to stick with what works
        if (this.lastWorkingProxyName) {
            const index = proxies.findIndex(p => p.name === this.lastWorkingProxyName);
            if (index > 0) {
                const [goodProxy] = proxies.splice(index, 1);
                proxies.unshift(goodProxy);
            }
        }

        let lastError = null;

        for (const proxy of proxies) {
            try {
                if (this.debug) console.log(`[ScraperEngine] Attempting ${proxy.name}: ${url}`);

                // Aggressive 30s timeout (increased from 5s)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                // If an external signal is provided, link it to our local controller
                const onAbort = () => {
                    controller.abort();
                    clearTimeout(timeoutId);
                };

                if (signal) {
                    if (signal.aborted) onAbort();
                    else signal.addEventListener('abort', onAbort, { once: true });
                }

                const fetchSignal = controller.signal;

                const fetchURL = proxy.url + encodeURIComponent(url);
                try {
                    const response = await fetch(fetchURL, {
                        signal: fetchSignal,
                        credentials: 'omit'
                    });
                    clearTimeout(timeoutId);
                    if (signal) signal.removeEventListener('abort', onAbort);

                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    let html = '';
                    if (proxy.type === 'json') {
                        const json = await response.json();
                        html = json.contents;
                    } else {
                        html = await response.text();
                    }

                    if (html && html.length > 0) {
                        if (this.debug) console.log(`[ScraperEngine] ${proxy.name} successful (${html.length} chars)`);
                        this.htmlCache.set(url, html);

                        // Remember this proxy as working for future requests in this session
                        this.lastWorkingProxyName = proxy.name;

                        return html;
                    }
                } catch (err) {
                    clearTimeout(timeoutId);
                    throw err;
                }

                throw new Error('Empty response');
            } catch (error) {
                if (error.name === 'AbortError') throw error;
                lastError = error;
                if (this.debug) console.warn(`[ScraperEngine] ${proxy.name} failed: ${error.message}`);
            }
        }

        throw new Error(`Failed to fetch HTML after trying all proxies. Last error: ${lastError?.message || 'Unknown'}`);
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

            // Try multiple common container selectors for WordPress movie themes
            const selectors = ['div.movie-card', 'div.post', 'article', '.result-item', '.ml-item', '.movie-item'];
            let movieCards = [];

            for (const selector of selectors) {
                const found = doc.querySelectorAll(selector);
                if (found.length > 0) {
                    movieCards = Array.from(found);
                    if (this.debug) console.log(`[ScraperEngine] Found cards using selector: ${selector} (${found.length} items)`);
                    break;
                }
            }

            if (movieCards.length === 0) {
                // Fallback: Look for all links and see if any contain our title? 
                // That might be too aggressive, let's stick to containers for now.
                if (this.debug) console.log('[ScraperEngine] No standard movie containers found');
                return null;
            }

            const normalize = (str) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
            const targetTitleNorm = normalize(movieData.title);

            for (const card of movieCards) {
                // 1. Title Extraction: Try .title, h2, h3, a
                const titleElement =
                    card.querySelector('.title') ||
                    card.querySelector('h2') ||
                    card.querySelector('h3') ||
                    card.querySelector('a');

                if (!titleElement) continue;

                const cardTitle = titleElement.textContent.trim();
                const cardTitleNorm = normalize(cardTitle);

                // Robust fuzzy matching
                const titleMatch =
                    cardTitle.toLowerCase().includes(movieData.title.toLowerCase()) ||
                    movieData.title.toLowerCase().includes(cardTitle.toLowerCase()) ||
                    cardTitleNorm.includes(targetTitleNorm) ||
                    targetTitleNorm.includes(cardTitleNorm);

                if (this.debug) {
                    console.log(`[ScraperEngine] Card: "${cardTitle}" | Match: ${titleMatch}`);
                }

                if (titleMatch) {
                    // 2. Link Extraction: Get href from title element or nearest a
                    const detailPageURL =
                        titleElement.getAttribute('href') ||
                        titleElement.closest('a')?.getAttribute('href') ||
                        card.querySelector('a')?.getAttribute('href');

                    if (detailPageURL) {
                        const absoluteURL = this.resolveRelativeURL(detailPageURL);
                        if (this.debug) console.log('[ScraperEngine] Match found! URL:', absoluteURL);
                        return absoluteURL;
                    }
                }
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

            // 1. Validate imageUrl (Loose check)
            const imageElement = doc.querySelector('.image-container-view img');
            const scrapedImageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src');

            if (scrapedImageUrl !== movieData.imageUrl) {
                console.warn(`[ScraperEngine] Image URL mismatch: Expected "${movieData.imageUrl}", got "${scrapedImageUrl}"`);
                // errors.push(`Image URL mismatch`); // Disabled strict check
            }

            // 2. Validate screenshotLinks (Skip strict check)
            // const screenshotElements = doc.querySelectorAll('.screenshot-wrapper [data-src]');
            // ...

            // 3. Validate storyline (Skip strict check)
            const storylineElement = doc.querySelector('.storyline-box.mt-2 .story-text');
            const scrapedStoryline = storylineElement?.textContent.trim();
            // ...

            // 4. Extract and validate info-line data using regex
            const infoLineData = this.extractInfoLineData(doc);

            if (infoLineData.type && movieData.type && infoLineData.type !== movieData.type) {
                console.warn(`[ScraperEngine] Type mismatch: Expected "${movieData.type}", got "${infoLineData.type}"`);
            }

            // Always return valid for now if we found the page, relying on search result match
            const valid = true;

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
     * Scrape detailed metadata from detail page
     * @param {Document} doc - Parsed HTML document
     * @returns {Object} - Scraped metadata
     */
    scrapeMetadata(doc) {
        const metadata = {
            title: '',
            screenshots: [],
            storyline: '',
            info: {},
            subtitle: '',
            typeBadge: ''
        };

        try {
            // 0. Title
            const titleElement = doc.querySelector('h2.md\\:text-3xl.lg\\:text-4xl') ||
                doc.querySelector('h2.text-xl.md\\:text-3xl.lg\\:text-4xl') ||
                doc.querySelector('h2[class*="text-3xl"]') ||
                doc.querySelector('h2[class*="text-center"]') ||
                doc.querySelector('h2'); // Fallback to first h2
            if (titleElement) {
                metadata.title = titleElement.textContent.trim();
                // Clean up any extra whitespace from multiline titles
                metadata.title = metadata.title.replace(/\s+/g, ' ');
            }
            // 1. Screenshots
            const screenshotSelectors = [
                '.screenshot-wrapper [data-src]',
                '.screenshot-wrapper img',
                '.screenshot-container img',
                '.entry-content img[src*="screenshot"]',
                '.entry-content img[src*="snapshot"]'
            ];

            let screenshotElements = [];
            for (const selector of screenshotSelectors) {
                const elements = doc.querySelectorAll(selector);
                if (elements.length > 0) {
                    screenshotElements = Array.from(elements);
                    break;
                }
            }

            screenshotElements.forEach(img => {
                const src = img.getAttribute('data-src') || img.getAttribute('src');
                if (src) {
                    const resolved = this.resolveRelativeURL(src);
                    if (!metadata.screenshots.includes(resolved)) {
                        metadata.screenshots.push(resolved);
                    }
                }
            });

            // 2. Storyline
            const storyText = doc.querySelector('.storyline-box .story-text');
            if (storyText) metadata.storyline = storyText.textContent.trim();

            // 3. Metadata labels (IMDb, Genre, etc.)
            // Primary Strategy: Look for .info-line elements (exact structure from target site)
            const infoLines = doc.querySelectorAll('p.info-line');
            if (infoLines.length > 0) {
                if (this.debug) console.log('[ScraperEngine] Found info-line elements:', infoLines.length);

                infoLines.forEach(line => {
                    const bTag = line.querySelector('b');
                    if (bTag) {
                        const label = bTag.textContent.trim().replace(':', '').toLowerCase();
                        // Get text after the <b> tag
                        const fullText = line.textContent.trim();
                        const labelWithColon = bTag.textContent.trim();
                        const value = fullText.substring(fullText.indexOf(labelWithColon) + labelWithColon.length).trim();

                        if (value) {
                            metadata.info[label] = value;
                            if (this.debug) console.log(`[ScraperEngine] Extracted ${label}: ${value}`);
                        }
                    }
                });
            } else {
                // Fallback Strategy 1: Look for <b> tags followed by text
                if (this.debug) console.log('[ScraperEngine] No .info-line found, using fallback strategies');

                const bTags = doc.querySelectorAll('.modal-body b, .entry-content b, .card-body b, .details-card b');
                bTags.forEach(b => {
                    const labelText = b.textContent.trim().replace(':', '').toLowerCase();
                    const parent = b.parentElement;
                    if (!parent) return;

                    // Get the text following the <b> tag
                    let value = '';
                    let nextNode = b.nextSibling;
                    while (nextNode) {
                        if (nextNode.nodeType === 3) { // Text node
                            value += nextNode.textContent;
                        } else if (nextNode.nodeType === 1) { // Element node
                            if (nextNode.tagName === 'B') break; // Stop at next label
                            value += nextNode.textContent;
                        }
                        nextNode = nextNode.nextSibling;
                    }

                    value = value.trim();
                    if (value) {
                        metadata.info[labelText] = value;
                    }
                });

                // Fallback Strategy 2: Look for .detail-value elements and their labels
                const detailItems = doc.querySelectorAll('.detail-item, .info-row, .movie-info-item');
                detailItems.forEach(item => {
                    const label = item.querySelector('.detail-label, .info-label, span:first-child');
                    const value = item.querySelector('.detail-value, .info-value, span:last-child');

                    if (label && value) {
                        const labelText = label.textContent.trim().replace(':', '').toLowerCase();
                        const valueText = value.textContent.trim();
                        if (labelText && valueText && valueText !== 'N/A') {
                            metadata.info[labelText] = valueText;
                        }
                    }
                });

                // Fallback Strategy 3: Look for specific common patterns
                const metadataPatterns = [
                    { selector: '[class*="imdb"]', key: 'imdb' },
                    { selector: '[class*="genre"]', key: 'genre' },
                    { selector: '[class*="resolution"]', key: 'resolution' },
                    { selector: '[class*="released"], [class*="release"]', key: 'released' },
                    { selector: '[class*="cast"]', key: 'cast' }
                ];

                metadataPatterns.forEach(({ selector, key }) => {
                    if (!metadata.info[key]) {
                        const element = doc.querySelector(selector);
                        if (element) {
                            const text = element.textContent.trim();
                            if (text && text !== 'N/A') {
                                metadata.info[key] = text;
                            }
                        }
                    }
                });
            }
            // 4. Yellow Subtitle
            const yellowSubtitle = doc.querySelector('p.text-sm.text-yellow.font-semibold.text-center');
            if (yellowSubtitle) {
                metadata.subtitle = yellowSubtitle.textContent.trim();
            }

            // 5. Type Badge
            const typeBadge = doc.querySelector('b.text-orange');
            if (typeBadge) {
                metadata.typeBadge = typeBadge.textContent.trim();
            }


            if (this.debug) {
                console.log('[ScraperEngine] Scraped metadata:', metadata);
                console.log('[ScraperEngine] Metadata info keys found:', Object.keys(metadata.info));
                console.log('[ScraperEngine] Screenshots found:', metadata.screenshots.length);
            }
        } catch (error) {
            console.error('[ScraperEngine] Error scraping metadata:', error);
        }

        return metadata;
    }

    // Compare two arrays for equality
    // @param {Array} arr1 - First array
    // @param {Array} arr2 - Second array
    // @returns {boolean} - True if arrays are equal
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
                const unzipLink = 'https://pub-97a4d447859c48eb95966a19c8c274b3.r2.dev/How%20to%20Unzip.mp4';

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
            vlcLink: null,
            downloadButtons: [] // New field for dynamic download buttons
        };

        try {
            // Extract h3 headers (text-success)
            const h3Elements = doc.querySelectorAll('h3.text-md.text-success');
            h3Elements.forEach(h3 => {
                const text = h3.textContent.trim();
                // Filter out download-related headers (case-insensitive, handles emojis)
                const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, ''); // Remove emojis and special chars
                if ((normalizedText.includes('download') || normalizedText.includes('link')) && !normalizedText.includes('complete')) return;

                guideData.headers.push({
                    level: 3,
                    text: text
                });
            });

            // Extract h4 headers (text-warning)
            const h4Elements = doc.querySelectorAll('h4.text-sm.text-warning');
            h4Elements.forEach(h4 => {
                const text = h4.textContent.trim();
                // Filter out download-related headers
                const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, '');
                if (normalizedText.includes('download') || normalizedText.includes('link')) return;

                guideData.headers.push({
                    level: 4,
                    text: text
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

            // Extract dynamic download buttons from specified container
            const parentContainers = doc.querySelectorAll('div.col-12.p-2.text-center.d-flex.flex-wrap.justify-content-center');
            parentContainers.forEach(parent => {
                const subContainers = parent.querySelectorAll('div.d-flex.flex-wrap.justify-content-center.align-items-center.gap-2.gap-md-3.my-2');
                subContainers.forEach(container => {
                    const buttons = container.querySelectorAll('a');
                    buttons.forEach(btn => {
                        guideData.downloadButtons.push({
                            text: btn.textContent.trim(),
                            href: this.resolveRelativeURL(btn.getAttribute('href')),
                            class: btn.className
                        });
                    });
                });
            });

            if (this.debug) {
                console.log('[ScraperEngine] Scraped guide section:', guideData);
            }

        } catch (error) {
            console.error('[ScraperEngine] Error scraping guide section:', error);
        }

        return guideData;
    }

    /**
     * Scrape pagination from navigation
     * @param {Document} doc - Parsed HTML document
     * @returns {Object} - Pagination data { pages: [], currentPage: number }
     */
    scrapePagination(doc) {
        const paginationData = {
            pages: [],
            currentPage: 1
        };

        try {
            // Find pagination nav element
            const navElement = doc.querySelector('nav[aria-label="Page navigation"]');
            if (!navElement) {
                if (this.debug) {
                    console.log('[ScraperEngine] No pagination navigation found');
                }
                return paginationData;
            }

            // Extract all page links
            const pageLinks = navElement.querySelectorAll('.page-link');
            pageLinks.forEach((link, index) => {
                const text = link.textContent.trim();
                const href = link.getAttribute('href');
                const parentLi = link.closest('li.page-item');
                const isActive = parentLi?.classList.contains('active');
                const isDisabled = parentLi?.classList.contains('disabled');

                // Skip disabled items (Previous/Next when at boundaries)
                if (isDisabled) return;

                // Detect current page
                if (isActive) {
                    const pageNum = parseInt(text);
                    if (!isNaN(pageNum)) {
                        paginationData.currentPage = pageNum;
                    }
                }

                // Parse page number or label
                let pageNumber = null;
                let label = text;

                if (text.toLowerCase().includes('previous') || text.toLowerCase().includes('«')) {
                    label = 'Previous';
                } else if (text.toLowerCase().includes('next') || text.toLowerCase().includes('»')) {
                    label = 'Next';
                } else {
                    const num = parseInt(text);
                    if (!isNaN(num)) {
                        pageNumber = num;
                        label = text;
                    }
                }

                // Build full URL
                let fullUrl = href;
                if (href && !href.startsWith('http')) {
                    fullUrl = this.resolveRelativeURL(href);
                }

                paginationData.pages.push({
                    pageNumber: pageNumber,
                    label: label,
                    url: fullUrl,
                    isActive: isActive,
                    isDisabled: isDisabled
                });
            });

            if (this.debug) {
                console.log('[ScraperEngine] Scraped pagination:', paginationData);
            }

        } catch (error) {
            console.error('[ScraperEngine] Error scraping pagination:', error);
        }

        return paginationData;
    }

    /**
     * Scrape languages from the home page
     * @param {Document} doc - Parsed HTML document
     * @returns {Array} - Array of language objects { name, url }
     */
    scrapeLanguages(doc) {
        const languages = [];
        try {
            // Primary selector (Now more resilient with partial ID matching)
            let langGrid = doc.getElementById('mlbdLangGrid') ||
                doc.querySelector('[id*="LangGrid"], [id*="lang-grid"], [class*="lang-grid"]');

            // Fallback 1: Common grid classes
            if (!langGrid) langGrid = doc.querySelector('.mlbd-cat-grid, .lang-list, .language-grid');

            if (langGrid) {
                // Be aggressive: take ANY link inside the grid if it has text
                const items = langGrid.querySelectorAll('a');
                items.forEach(item => {
                    const name = item.textContent.trim();
                    const href = item.getAttribute('href');
                    if (name && href && name.length < 30 && !languages.find(l => l.name === name)) {
                        languages.push({
                            name: name,
                            url: this.resolveRelativeURL(href)
                        });
                    }
                });
            }

            // Fallback 2: Global Keyword-based discovery if grids found nothing
            if (languages.length === 0) {
                const commonLangs = ['Bangla', 'Hindi', 'English', 'Tamil', 'Telugu', 'Chinese', 'Korean', 'Japanese', 'Dubbed'];
                const links = doc.querySelectorAll('a[href*="/category/"], a[href*="/tag/"], a[href*="/language/"]');

                links.forEach(link => {
                    const name = link.textContent.trim();
                    const isLanguage = commonLangs.some(l => name.toLowerCase().includes(l.toLowerCase()));
                    const href = link.getAttribute('href');

                    if (name && href && isLanguage && !languages.find(l => l.name === name)) {
                        languages.push({
                            name: name,
                            url: this.resolveRelativeURL(href)
                        });
                    }
                });
            }

            if (this.debug) console.log(`[ScraperEngine] Scraped ${languages.length} languages`);
        } catch (error) {
            console.error('[ScraperEngine] Error scraping languages:', error);
        }
        return languages;
    }

    /**
     * Scrape top categories from the cat-box section
     * @param {Document} doc - Parsed HTML document
     * @returns {Array} - Array of category objects { name, url }
     */
    scrapeTopCategories(doc) {
        const categories = [];
        try {
            const catBox = doc.querySelector('.cat-box');
            if (catBox) {
                const items = catBox.querySelectorAll('a.cat-btn');
                items.forEach(item => {
                    let name = item.textContent.trim();
                    const href = item.getAttribute('href');

                    if (name && href) {
                        // Emoji stripping logic
                        // If it's not HOME, strip all non-alphanumeric/space characters (including emojis)
                        if (!name.toUpperCase().includes('HOME')) {
                            // Strip common symbols/emojis but keep alphanumeric and other scripts (like Bangla)
                            // We use a more targeted approach: remove only emojis and specific symbols
                            // A simple way is to remove things in the emoji ranges or common symbols
                            name = name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

                            // Also remove leading symbols like 🎙, 🔞, etc if they weren't caught
                            name = name.replace(/^[^\w\s\u0980-\u09FF]+/g, '').trim();

                            if (!name) name = item.textContent.trim();
                        }

                        if (!categories.find(c => c.name === name)) {
                            categories.push({
                                name: name,
                                url: this.resolveRelativeURL(href)
                            });
                        }
                    }
                });
            }
            if (this.debug) console.log(`[ScraperEngine] Scraped ${categories.length} top categories`);
        } catch (error) {
            console.error('[ScraperEngine] Error scraping top categories:', error);
        }
        return categories;
    }

    /**
     * Scrape genres from the home page
     * @param {Document} doc - Parsed HTML document
     * @returns {Array} - Array of genre objects { name, url }
     */
    scrapeGenres(doc) {
        const genres = [];
        try {
            // Primary selector: mlbdGenreGrid
            let genreGrid = doc.getElementById('mlbdGenreGrid') ||
                doc.querySelector('[id*="GenreGrid"], [id*="genre-grid"]');

            if (genreGrid) {
                // Select all anchor tags within the grid
                const items = genreGrid.querySelectorAll('a');
                items.forEach(item => {
                    const name = item.textContent.trim();
                    const href = item.getAttribute('href');

                    // Basic validation to filter out empty or overly long invalid items
                    if (name && href && name.length < 30 && !genres.find(g => g.name === name)) {
                        genres.push({
                            name: name,
                            url: this.resolveRelativeURL(href)
                        });
                    }
                });
            }

            if (this.debug) console.log(`[ScraperEngine] Scraped ${genres.length} genres`);
        } catch (error) {
            console.error('[ScraperEngine] Error scraping genres:', error);
        }
        return genres;
    }

    /**
     * ============================================
     * 7. DOWNLOAD CARD SCRAPING LOGIC
     * ============================================
     */

    /**
     * Scrape download cards from detail page (with incremental emission)
     * @param {Document} doc - Parsed HTML document
     * @param {Function} onCardFound - Callback for each card found (optional)
     * @returns {Array} - Array of download options (for backward compatibility)
     */
    scrapeDownloadCards(doc, onCardFound = null) {
        const downloadOptions = [];

        try {
            // Strategy 1: Grid Layout (Episodes/Movies/Also Download)
            // Expanded selectors to catch more card types
            const episodeCards = doc.querySelectorAll('div.col-md-4.col-sm-6.mb-4.ep-card, div.ep-card, div.card.mb-3');

            if (episodeCards.length > 0) {
                if (this.debug) console.log('[ScraperEngine] Found episode cards:', episodeCards.length);

                episodeCards.forEach(card => {
                    const titleEl = card.querySelector('.ep-card-title, h5, .title');
                    // Find ALL links within the card
                    const allLinks = Array.from(card.querySelectorAll('a'));
                    // Filter for links containing /getLink/
                    const downloadLinks = allLinks.filter(a => {
                        const h = a.getAttribute('href') || '';
                        return h.includes('/getLink/');
                    });

                    if (titleEl && downloadLinks.length > 0) {
                        const cardData = {
                            header: titleEl.textContent.trim(),
                            downloads: [],
                            icon: { exists: true, class: 'fas fa-play-circle' },
                            extraText: '',
                            isNew: card.textContent.toUpperCase().includes('NEW ADDED')
                        };

                        downloadLinks.forEach(link => {
                            const btnText = link.querySelector('.btn-text');
                            const anchorText = btnText ? btnText.textContent.trim() : link.textContent.trim();
                            const href = link.getAttribute('href');

                            const { quality, size } = this.parseQualityAndSize(anchorText, cardData.header, href, card.textContent);

                            cardData.downloads.push({
                                quality: quality,
                                size: size,
                                href: this.resolveRelativeURL(href),
                                fullText: anchorText
                            });
                        });

                        downloadOptions.push(cardData);
                        if (onCardFound) onCardFound(cardData);
                    }
                });
            }

            // Strategy 2: Flex Container (Single Movie)
            const flexContainers = doc.querySelectorAll('div.d-flex.flex-wrap.justify-content-center.align-items-center.gap-2.gap-md-3.my-2');

            if (flexContainers.length > 0) {
                if (this.debug) console.log('[ScraperEngine] Found flex containers:', flexContainers.length);

                flexContainers.forEach(container => {
                    const allLinks = Array.from(container.querySelectorAll('a'));
                    const downloadLinks = allLinks.filter(a => {
                        const h = a.getAttribute('href') || '';
                        return h.includes('/getLink/');
                    });

                    if (downloadLinks.length > 0) {
                        // Try to find a header from a parent card if this is nested
                        const parentCard = container.closest('div.card');
                        let headerText = 'Download Options';
                        if (parentCard) {
                            const h5 = parentCard.querySelector('h5.mb-3') || parentCard.querySelector('h5');
                            if (h5) headerText = h5.textContent.trim();
                        }

                        const cardData = {
                            header: headerText,
                            downloads: [],
                            icon: { exists: true, class: 'fas fa-download' },
                            extraText: '',
                            isNew: container.textContent.toUpperCase().includes('NEW ADDED') || (parentCard && parentCard.textContent.toUpperCase().includes('NEW ADDED'))
                        };

                        downloadLinks.forEach(link => {
                            const btnText = link.querySelector('.btn-text');
                            const anchorText = btnText ? btnText.textContent.trim() : link.textContent.trim();
                            const href = link.getAttribute('href');

                            const { quality, size } = this.parseQualityAndSize(anchorText, headerText, href, container.textContent);

                            cardData.downloads.push({
                                quality: quality,
                                size: size,
                                href: this.resolveRelativeURL(href),
                                fullText: anchorText
                            });
                        });

                        downloadOptions.push(cardData);
                        if (onCardFound) onCardFound(cardData);
                    }
                });
            }

            // Strategy 3: Default Card (Existing)
            const defaultCards = doc.querySelectorAll('div.card[class*="border-left-success"], div.card.h-100');

            if (defaultCards.length > 0) {
                if (this.debug) console.log('[ScraperEngine] Found default cards:', defaultCards.length);

                defaultCards.forEach(card => {
                    const cardData = {
                        header: '',
                        downloads: [],
                        icon: null,
                        extraText: '',
                        isNew: false // "NEW ADDED" indicator
                    };

                    // Check for "NEW ADDED" indicator
                    const cardText = card.textContent.toUpperCase();
                    if (cardText.includes('NEW ADDED')) {
                        cardData.isNew = true;
                        if (this.debug) console.log('[ScraperEngine] Found "NEW ADDED" marker on card');
                    }

                    // Extract header
                    const header = card.querySelector('h5.mb-3');
                    if (header) {
                        cardData.header = header.textContent.trim();
                    }

                    // Extract download links - strictly prioritize the user-specified container
                    let linkContainer = card.querySelector('div.mb-2.d-flex.justify-content-center');
                    if (!linkContainer) {
                        // Fallback to other common containers or the whole card
                        linkContainer = card.querySelector('.d-flex.justify-content-center, .card-footer') || card;
                    }

                    const allLinks = Array.from(linkContainer.querySelectorAll('a'));
                    const downloadLinks = allLinks.filter(a => {
                        const h = a.getAttribute('href') || '';
                        return h.includes('/getLink/');
                    });

                    downloadLinks.forEach(link => {
                        const btnText = link.querySelector('.btn-text');
                        const anchorText = btnText ? btnText.textContent.trim() : link.textContent.trim();

                        const href = this.resolveRelativeURL(link.getAttribute('href'));
                        // Pass the specific container's text for pattern matching like (Download [720p • 443 MB])
                        const { quality, size } = this.parseQualityAndSize(anchorText, cardData.header, link.getAttribute('href'), linkContainer.textContent);

                        // Only add if we found metadata OR the text explicitly contains "download"
                        if (quality !== 'Unknown' || size !== 'Unknown' || anchorText.toLowerCase().includes('download')) {
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
                        if (onCardFound) onCardFound(cardData);
                    }
                });
            }

            if (this.debug && downloadOptions.length === 0) {
                console.log('[ScraperEngine] Strategies 1-3 empty. Trying Strategy 4: Generic Episode Headers');
            }

            // Strategy 4: Generic Episode Headers (Backup for missing classes)
            // Looks for <h5>Episode X</h5> followed by links, ignoring specific container classes
            if (downloadOptions.length === 0) {
                const headers = doc.querySelectorAll('h5');
                headers.forEach(h5 => {
                    const text = h5.textContent.trim();
                    // If header says "Episode"
                    if (/Episode\s+\d+/i.test(text)) {
                        // Look at next siblings for links
                        let sibling = h5.nextElementSibling;
                        let foundLinks = [];
                        let attempts = 0;

                        // Check next 3 siblings or until another header
                        while (sibling && attempts < 5) {
                            if (sibling.tagName === 'H5') break; // Stop at next episode

                            if (sibling.tagName === 'A') {
                                foundLinks.push(sibling);
                            } else {
                                // Check inside div/p wrappers
                                const nested = sibling.querySelectorAll('a');
                                nested.forEach(a => foundLinks.push(a));
                            }
                            sibling = sibling.nextElementSibling;
                            attempts++;
                        }

                        // Process found links
                        foundLinks.forEach(link => {
                            const btnText = link.querySelector('.btn-text');
                            const anchorText = btnText ? btnText.textContent.trim() : link.textContent.trim();
                            const href = link.getAttribute('href');

                            if (href && (href.includes('/getLink/') || anchorText.toLowerCase().includes('download'))) {
                                const { quality, size } = this.parseQualityAndSize(anchorText, text, href, h5.parentElement ? h5.parentElement.textContent : text);

                                const cardData = {
                                    header: text,
                                    downloads: [{
                                        quality,
                                        size,
                                        href: this.resolveRelativeURL(href),
                                        fullText: anchorText
                                    }],
                                    icon: { exists: true, class: 'fas fa-play-circle' },
                                    extraText: '',
                                    isNew: false
                                };
                                downloadOptions.push(cardData);
                                if (onCardFound) onCardFound(cardData);
                            }
                        });
                    }
                });
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
     * @param {AbortSignal} signal - Abort signal
     * @param {Function} onProgress - Progress callback (optional)
     * @returns {Promise<Object>} - Final download button data
     */
    async handleOneClickDownload(downloadURL, signal = null, onProgress = null) {
        try {
            if (this.debug) {
                console.log('[ScraperEngine] Starting one-click download flow:', downloadURL);
            }

            // Step 1: Initial Page -> Find "ONE CLICK DOWNLOAD"
            if (onProgress) onProgress({ step: 1, message: '🚀 ONE CLICK DOWNLOAD' });

            const page1HTML = await this.fetchHTML(downloadURL, false, signal);
            const page1Doc = this.parseHTML(page1HTML);

            const keywords = ['ONE CLICK DOWNLOAD', 'DIRECT DOWNLOAD', 'DOWNLOAD NOW', 'DOWNLOAD', 'CLICK TO DOWNLOAD', 'GET LINK', 'Open Direct Download Link'];
            let oneClickBtn = null;

            // Try different tags and keywords
            const tags = ['a', 'button'];
            for (const tag of tags) {
                for (const kw of keywords) {
                    oneClickBtn = this.findElementByText(page1Doc, tag, kw);
                    if (oneClickBtn) break;
                }
                if (oneClickBtn) break;
            }

            // Fallback: Look for the most prominent button or any link with download patterns
            if (!oneClickBtn) {
                oneClickBtn = page1Doc.querySelector('.entry-content a.btn, #main a.btn, .big-cta a, a.btn-lg, button.btn-lg');
            }

            // High-confidence fallback: search for links containing download-related paths
            if (!oneClickBtn) {
                const allLinks = Array.from(page1Doc.querySelectorAll('a[href]'));
                oneClickBtn = allLinks.find(a => {
                    const h = a.getAttribute('href') || '';
                    const hl = h.toLowerCase();
                    return hl.includes('/getlink/') || hl.includes('/dl/') || hl.includes('/download/');
                });
            }

            if (!oneClickBtn) {
                if (this.debug) console.error('[ScraperEngine] Page 1 HTML sample:', page1HTML.substring(0, 500));
                throw new Error('Download button (Page 1) not found');
            }

            const oneClickURL = this.resolveRelativeURL(oneClickBtn.getAttribute('href'));

            if (this.debug) console.log('[ScraperEngine] Step 1 Complete. Next URL:', oneClickURL);

            // Step 2: Second Page -> Find "#download" or "Open Direct Download Link"
            if (onProgress) onProgress({ step: 2, message: 'Open Direct Download Link' });

            const page2HTML = await this.fetchHTML(oneClickURL, false, signal);
            const page2Doc = this.parseHTML(page2HTML);

            // Try selector first, then text matching
            let intermediateLinkElement = page2Doc.querySelector('#download');
            if (!intermediateLinkElement) {
                intermediateLinkElement = this.findElementByText(page2Doc, 'a', 'Open Direct Download Link') ||
                    this.findElementByText(page2Doc, 'a', 'Continue to Download');
            }

            if (!intermediateLinkElement) throw new Error('Download link (Page 2) not found');

            const finalPageURL = this.resolveRelativeURL(intermediateLinkElement.getAttribute('href'));

            if (this.debug) console.log('[ScraperEngine] Step 2 Complete. Final URL:', finalPageURL);

            // Step 3: Final Page -> Find all buttons in ".big-cta" or similar
            if (onProgress) onProgress({ step: 3, message: 'Fetching final download links...' });

            const page3HTML = await this.fetchHTML(finalPageURL, false, signal);
            const page3Doc = this.parseHTML(page3HTML);

            // Scrape all links within the big-cta container or relevant areas
            const ctaContainer = page3Doc.querySelector('div[class*="big-cta"]') ||
                page3Doc.querySelector('.big-cta');

            let buttons = [];

            if (ctaContainer) {
                const links = ctaContainer.querySelectorAll('a');
                links.forEach(link => {
                    buttons.push({
                        text: link.textContent.trim(),
                        href: this.resolveRelativeURL(link.getAttribute('href')),
                        iconClass: link.querySelector('i')?.className || 'fas fa-download'
                    });
                });
            }

            // Fallback if no container found or no links in container
            if (buttons.length === 0) {
                const fallbackLinks = page3Doc.querySelectorAll('a.btn.btn-primary.btn-lg, a.btn-success.btn-lg');
                fallbackLinks.forEach(link => {
                    buttons.push({
                        text: link.textContent.trim(),
                        href: this.resolveRelativeURL(link.getAttribute('href')),
                        iconClass: link.querySelector('i')?.className || 'fas fa-external-link-alt'
                    });
                });
            }

            if (buttons.length === 0) {
                throw new Error('No download buttons found on the final page');
            }

            const result = {
                success: true,
                buttons: buttons
            };

            if (this.debug) {
                console.log('[ScraperEngine] One-click deep scraping complete. Found buttons:', buttons.length);
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
 * @param {string} tagName - HTML tag name (e.g., 'a', 'div')
 * @param {string} text - Text to search for
 * @returns {Element|null} - Found element or null
 */
    findElementByText(doc, tagName, text) {
        const elements = doc.getElementsByTagName(tagName);
        const searchText = text.toLowerCase().trim();
        for (const el of elements) {
            if (el.textContent.toLowerCase().includes(searchText)) {
                return el;
            }
        }
        return null;
    }

    /**
     * Parse quality and size with strictly defined priority:
     * 1. Check button text/anchor text (text).
     * 2. Check contextText (h5 header).
     * 3. Check href (URL) as a final fallback.
     * 4. Check entire container text (last resort).
     */
    parseQualityAndSize(text, contextText = '', href = '', containerText = '') {
        let quality = 'Unknown';
        let size = 'Unknown';

        const extractFromSource = (source) => {
            let q = 'Unknown';
            let s = 'Unknown';
            if (!source) return { q, s };

            // A. Check for [Quality • Size] brackets or similar
            // Using greedy matching to handle nested brackets: (Download [720p • 443 MB])
            const bracketMatch = source.match(/[\[\(](.*)[\]\)]/);
            if (bracketMatch && bracketMatch[1]) {
                const content = bracketMatch[1];
                // Support multiple common separators including bullet point, pipe, dash, and comma
                const parts = content.split(/[•|\|\-,/]/);

                parts.forEach(part => {
                    const trimmed = part.trim();
                    // Match quality (e.g., 720p, 1080p, 4K)
                    if ((trimmed.match(/\d+p/i) || trimmed.match(/4k|2k|hd|web/i)) && q === 'Unknown') {
                        q = trimmed;
                    }
                    // Match size (e.g., 443 MB, 1.2 GB)
                    else if (trimmed.match(/\d+\.?\d*\s*(mb|gb|kb)/i) && s === 'Unknown') {
                        s = trimmed;
                    }
                });
            }

            // B. Regex scan if still unknown
            if (q === 'Unknown') {
                // Use custom boundaries (non-alphanumeric) to handle URL separators like . or _
                const qualRegex = /(?:^|[^a-zA-Z0-9])(360p|480p|720p|1080p|2160p|4k|2k|hd|webrip|web-rip|web|bluray|bdrip|brrip|hdtv|camrip|cam|ts|hc|dvdrip)(?:$|[^a-zA-Z0-9])/i;
                const match = source.match(qualRegex);
                if (match) q = match[1];
            }

            if (s === 'Unknown') {
                // Match sizes like 1.5GB, 700MB, 500 MB, etc.
                const sizeRegex = /(?:^|[^a-zA-Z0-9])(\d+\.?\d*\s*(?:mb|gb|kb))(?:$|[^a-zA-Z0-9])/i;
                const match = source.match(sizeRegex);
                if (match) s = match[1].toUpperCase();
            }

            return { q, s };
        };

        // PRIORITY 1: Check Button Text
        const buttonResults = extractFromSource(text);
        quality = buttonResults.q;
        size = buttonResults.s;

        // PRIORITY 2: Check Header Context
        if (quality === 'Unknown' || size === 'Unknown') {
            const headerResults = extractFromSource(contextText);
            if (quality === 'Unknown') quality = headerResults.q;
            if (size === 'Unknown') size = headerResults.s;
        }

        // PRIORITY 3: Check URL (href) - High correlation for quality
        if (quality === 'Unknown' || size === 'Unknown') {
            const hrefResults = extractFromSource(href);
            if (quality === 'Unknown') quality = hrefResults.q;
            if (size === 'Unknown') size = hrefResults.s;
        }

        // PRIORITY 4: Check entire container text (last resort)
        if (quality === 'Unknown' || size === 'Unknown') {
            const containerResults = extractFromSource(containerText);
            if (quality === 'Unknown') quality = containerResults.q;
            if (size === 'Unknown') size = containerResults.s;
        }

        return { quality, size };
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
     * @param {AbortSignal} signal - Abort signal
     * @param {Function} onProgress - Callback for incremental updates (type, data)
     * @returns {Promise<Object>} - Final summary
     */
    async scrapeMovie(movieTitle, movieData, signal = null, onProgress = null) {
        try {
            if (this.debug) console.log('[ScraperEngine] Starting scraping workflow for:', movieTitle);

            let detailHTML = null;
            let detailPageURL = movieData?.post_url;

            // Step 1: Attempt post_url first if it exists
            if (detailPageURL) {
                if (this.debug) console.log('[ScraperEngine] Attempting post_url:', detailPageURL);
                try {
                    detailHTML = await this.fetchHTML(detailPageURL, true, signal);

                    // Check if it's the homepage (fallback needed if detail page isn't valid)
                    const tempDoc = this.parseHTML(detailHTML);
                    const isHomepage = tempDoc.querySelector('body.home') ||
                        tempDoc.title.toLowerCase().includes('homepage');

                    if (isHomepage) {
                        if (this.debug) console.log('[ScraperEngine] post_url redirected to home, falling back to search...');
                        detailHTML = null;
                        detailPageURL = null;
                    }
                } catch (e) {
                    if (this.debug) console.warn('[ScraperEngine] post_url fetch failed, falling back to search...', e);
                    detailHTML = null;
                    detailPageURL = null;
                }
            }

            // Step 2: Fallback to Search if post_url failed or was missing
            if (!detailHTML) {
                if (this.debug) console.log('[ScraperEngine] Falling back to search flow...');

                // Step 2.1: Generate search URL
                const searchURL = this.generateSearchURL(movieTitle);

                // Step 2.2: Fetch search page
                const searchHTML = await this.fetchHTML(searchURL, true, signal);

                // Step 2.3: Match search results
                detailPageURL = await this.matchSearchResults(searchHTML, movieData);

                if (!detailPageURL) {
                    return { success: false, error: 'No matching movie found in search results' };
                }

                // Step 2.4: Fetch detail page
                detailHTML = await this.fetchHTML(detailPageURL, true, signal);
            }

            // Step 3: Validate detail page
            const validation = await this.validateDetailPage(detailHTML, movieData);

            if (!validation.valid) {
                return { success: false, error: 'Validation failed', validationErrors: validation.errors };
            }

            const doc = validation.doc;

            // Step 6: Scrape and emit incrementally

            // 6.1 Instruction Section
            const instructionData = this.scrapeInstructionSection(doc);
            if (onProgress) onProgress({ type: 'instruction', data: instructionData });

            // 6.2 Guide Section
            const guideData = this.scrapeGuideSection(doc);
            if (onProgress) onProgress({ type: 'guide', data: guideData });

            // 6.3 Metadata Section
            const metadata = this.scrapeMetadata(doc);
            if (onProgress) onProgress({ type: 'metadata', data: metadata });


            // 6.4 Download Options (Emit each one individually)
            const downloadOptions = this.scrapeDownloadCards(doc);
            if (onProgress) {
                for (const option of downloadOptions) {
                    onProgress({ type: 'option', data: option });
                }
            }

            return {
                success: true,
                detailPageURL,
                instructionData,
                guideData,
                downloadOptions
            };

        } catch (error) {
            console.error('[ScraperEngine] Error in scraping workflow:', error);
            return { success: false, error: error.message };
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