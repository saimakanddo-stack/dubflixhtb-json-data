/**
 * ============================================
 * SCRAPER INTEGRATION LAYER
 * ============================================
 * 
 * This script integrates the scraping engine with the existing website.
 * It handles user interactions, DOM injection, and UI updates.
 * 
 * Features:
 * - Click event handling for movie posters
 * - Dynamic content injection into modal
 * - Loading state management
 * - Download button flow handling
 * - Quality options mapping
 * 
 * @author Antigravity AI
 * @version 1.0.0
 */

class ScraperIntegration {
    constructor() {
        this.scraperEngine = null;
        this.currentMovie = null;
        this.scrapedData = null;
        this.isLoading = false;

        // Configuration
        this.config = {
            baseScrapingURL: 'https://mlink627.movielinkbd.li',
            useCORSProxy: true, // Enable by default to avoid CORS issues
            // Switched to corsproxy.io as alternative to allorigins.win
            corsProxyURL: 'https://corsproxy.io/?',
            debug: true
        };

        // Initialize
        this.init();
    }

    /**
     * Initialize the integration
     */
    async init() {
        try {
            // Load configuration from movies.json
            await this.loadConfiguration();

            // Initialize scraper engine
            this.scraperEngine = new ScraperEngine(this.config);

            // Setup event listeners
            this.setupEventListeners();

            // Create loading indicator
            this.createLoadingIndicator();

            console.log('[ScraperIntegration] Initialized successfully');

        } catch (error) {
            console.error('[ScraperIntegration] Initialization error:', error);
        }
    }

    /**
     * Load configuration from movies.json
     */
    async loadConfiguration() {
        try {
            // Try to get baseScrapingURL from movies.json
            const moviesData = await this.fetchMoviesJSON();

            if (moviesData && moviesData.baseScrapingURL) {
                this.config.baseScrapingURL = moviesData.baseScrapingURL;
                console.log('[ScraperIntegration] Loaded baseScrapingURL:', this.config.baseScrapingURL);
            } else {
                console.warn('[ScraperIntegration] baseScrapingURL not found in movies.json');
            }

        } catch (error) {
            console.error('[ScraperIntegration] Error loading configuration:', error);
        }
    }

    /**
     * Fetch movies.json data
     */
    async fetchMoviesJSON() {
        try {
            const response = await fetch(JSON_URLS.movies);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[ScraperIntegration] Error fetching movies.json:', error);
            return null;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for clicks on movie posters
        document.addEventListener('click', (e) => {
            const poster = e.target.closest('.movie-poster');

            if (poster && !this.isLoading) {
                this.handleMoviePosterClick(poster);
            }
        });

        console.log('[ScraperIntegration] Event listeners setup complete');
    }

    /**
     * Handle movie poster click
     */
    async handleMoviePosterClick(posterElement) {
        try {
            // Extract movie title from the card
            const movieCard = posterElement.closest('.movie-card');
            if (!movieCard) {
                console.warn('[ScraperIntegration] Movie card not found');
                return;
            }

            // Get title from movie-title class
            const titleElement = movieCard.querySelector('.movie-title');
            if (!titleElement) {
                console.warn('[ScraperIntegration] Movie title element not found');
                return;
            }

            const movieTitle = titleElement.textContent.trim();

            // Get movie ID to fetch complete data
            // FIXED: Changed from data-movie-id to data-id to match index.html
            const movieId = movieCard.getAttribute('data-id');
            if (!movieId) {
                console.warn('[ScraperIntegration] Movie ID not found');
                return;
            }

            console.log('[ScraperIntegration] Movie poster clicked:', movieTitle, 'ID:', movieId);

            // Fetch complete movie data from JSON
            const movieData = await this.getMovieData(movieId);

            if (!movieData) {
                console.error('[ScraperIntegration] Movie data not found for ID:', movieId);
                return;
            }

            // Store current movie
            this.currentMovie = movieData;

            // Check if server field is true
            // If server is false or undefined, skip scraping and let existing download options show
            if (movieData.server !== true) {
                console.log('[ScraperIntegration] Server field is false/undefined - skipping scraping, using existing download options');
                // Don't start scraping, let the existing modal system handle download options
                return;
            }

            console.log('[ScraperIntegration] Server field is true - starting scraping process');

            // Start scraping process
            await this.startScrapingProcess(movieTitle, movieData);

        } catch (error) {
            console.error('[ScraperIntegration] Error handling poster click:', error);
            this.hideLoading();
        }
    }

    /**
     * Get movie data from allMovies array
     */
    async getMovieData(movieId) {
        try {
            // Check if allMovies is available globally
            if (typeof allMovies !== 'undefined' && Array.isArray(allMovies)) {
                const movie = allMovies.find(m => m.id === movieId);
                return movie || null;
            }

            // Fallback: fetch from movies.json
            const moviesData = await this.fetchMoviesJSON();
            if (moviesData && Array.isArray(moviesData)) {
                const movie = moviesData.find(m => m.id === movieId);
                return movie || null;
            }

            return null;

        } catch (error) {
            console.error('[ScraperIntegration] Error getting movie data:', error);
            return null;
        }
    }

    /**
     * Start scraping process
     */
    async startScrapingProcess(movieTitle, movieData) {
        try {
            // Show loading indicator
            this.showLoading('Scraping movie data...');

            // Execute scraping workflow
            const result = await this.scraperEngine.scrapeMovie(movieTitle, movieData);

            // Hide loading
            this.hideLoading();

            if (result.success) {
                console.log('[ScraperIntegration] Scraping successful:', result);

                // Store scraped data
                this.scrapedData = result;

                // Inject scraped data into modal
                this.injectScrapedData(result);

            } else {
                console.error('[ScraperIntegration] Scraping failed:', result.error);

                if (result.validationErrors) {
                    console.error('[ScraperIntegration] Validation errors:', result.validationErrors);
                }

                // Show error notification
                this.showNotification('Failed to scrape movie data: ' + result.error, true);
            }

        } catch (error) {
            console.error('[ScraperIntegration] Error in scraping process:', error);
            this.hideLoading();
            this.showNotification('Scraping error: ' + error.message, true);
        }
    }

    /**
     * Inject scraped data into modal
     */
    injectScrapedData(scrapedData) {
        try {
            console.log('[ScraperIntegration] Injecting scraped data into modal');

            // Wait for modal to be open
            const modal = document.getElementById('movieModal');
            if (!modal || modal.style.display === 'none') {
                console.warn('[ScraperIntegration] Modal not open, waiting...');
                setTimeout(() => this.injectScrapedData(scrapedData), 500);
                return;
            }

            // Inject instruction section
            if (scrapedData.instructionData) {
                this.injectInstructionSection(scrapedData.instructionData);
            }

            // Inject guide section
            if (scrapedData.guideData) {
                this.injectGuideSection(scrapedData.guideData);
            }

            // Inject download options
            if (scrapedData.downloadOptions && scrapedData.downloadOptions.length > 0) {
                this.injectDownloadOptions(scrapedData.downloadOptions);
            }

            console.log('[ScraperIntegration] Data injection complete');

        } catch (error) {
            console.error('[ScraperIntegration] Error injecting scraped data:', error);
        }
    }

    /**
     * Inject instruction section into modal
     */
    injectInstructionSection(instructionData) {
        try {
            // Find or create instruction container
            let container = document.getElementById('scraped-instruction-section');

            if (!container) {
                container = document.createElement('div');
                container.id = 'scraped-instruction-section';
                container.className = 'scraped-section instruction-section';

                // Insert before download section
                const downloadSection = document.querySelector('.download-section');
                if (downloadSection) {
                    downloadSection.parentNode.insertBefore(container, downloadSection);
                }
            }

            // Clear existing content
            container.innerHTML = '';

            // Build instruction HTML
            let html = '<div class="text-md border-bottom-dark mb-2 text-center align-items-center text-warning fw-bold">';

            // Header row
            if (instructionData.header) {
                if (instructionData.header.h3) {
                    html += `<h3 class="text-success font-weight-bold">${instructionData.header.h3}</h3>`;
                }
                if (instructionData.header.h5) {
                    html += `<h5 class="text-warning">${instructionData.header.h5}</h5>`;
                }
                if (instructionData.header.attention) {
                    html += `<span class="mlbd-note-attn">${instructionData.header.attention}</span>`;
                }
                if (instructionData.header.redNotice) {
                    html += `<div style="color:#ff5b6b">${instructionData.header.redNotice}</div>`;
                }
            }

            // Notices
            instructionData.notices.forEach(notice => {
                html += `<div style="color:#ffc107">${notice.text}</div>`;
            });

            html += '</div>';

            // Unzip guide
            if (instructionData.unzipGuide) {
                html += `
                    <div class="text-center fw-bold text-info mb-3">
                        <a href="${instructionData.unzipGuide.href}" target="_blank" rel="noopener noreferrer">
                            ${instructionData.unzipGuide.text}
                        </a>
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('[ScraperIntegration] Error injecting instruction section:', error);
        }
    }

    /**
     * Inject guide section into modal
     */
    injectGuideSection(guideData) {
        try {
            // Find or create guide container
            let container = document.getElementById('scraped-guide-section');

            if (!container) {
                container = document.createElement('div');
                container.id = 'scraped-guide-section';
                container.className = 'scraped-section guide-section';

                // Insert before download section
                const downloadSection = document.querySelector('.download-section');
                if (downloadSection) {
                    downloadSection.parentNode.insertBefore(container, downloadSection);
                }
            }

            // Clear existing content
            container.innerHTML = '';

            let html = '';

            // Headers
            guideData.headers.forEach(header => {
                if (header.level === 3) {
                    html += `<h3 class="text-md text-success">${header.text}</h3>`;
                } else if (header.level === 4) {
                    html += `<h4 class="text-sm text-warning">${header.text}</h4>`;
                }
            });

            // Guide blocks
            guideData.guides.forEach(guide => {
                html += '<div class="mb-3">';
                if (guide.warning) {
                    html += `<span class="text-warning fw-bold">${guide.warning}</span> `;
                }
                if (guide.info) {
                    html += `<span class="text-info fw-semibold">${guide.info}</span>`;
                }
                html += '</div>';
            });

            // VLC link
            if (guideData.vlcLink) {
                html += `
                    <div class="text-center mt-3">
                        <a href="${guideData.vlcLink.href}" target="_blank" rel="noopener noreferrer">
                            ${guideData.vlcLink.text}
                        </a>
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('[ScraperIntegration] Error injecting guide section:', error);
        }
    }

    /**
     * Inject download options into modal
     */
    injectDownloadOptions(downloadOptions) {
        try {
            const downloadOptionsContainer = document.getElementById('downloadOptions');

            if (!downloadOptionsContainer) {
                console.warn('[ScraperIntegration] Download options container not found');
                return;
            }

            // Clear existing content
            downloadOptionsContainer.innerHTML = '';

            // Build download options HTML
            downloadOptions.forEach((card, cardIndex) => {
                const cardHTML = this.buildDownloadCardHTML(card, cardIndex);
                downloadOptionsContainer.innerHTML += cardHTML;
            });

            // Setup download button handlers
            this.setupDownloadButtonHandlers();

        } catch (error) {
            console.error('[ScraperIntegration] Error injecting download options:', error);
        }
    }

    /**
     * Build download card HTML
     */
    buildDownloadCardHTML(cardData, cardIndex) {
        let html = '<div class="quality-options">';

        // Card header
        if (cardData.header) {
            html += `<h5 class="mb-3">${cardData.header}</h5>`;
        }

        // Download buttons
        cardData.downloads.forEach((download, downloadIndex) => {
            html += `
                <button class="quality-btn scraped-download-btn" 
                        data-card-index="${cardIndex}" 
                        data-download-index="${downloadIndex}"
                        data-download-url="${download.href}">
                    <div class="quality-info">
                        <span class="quality-text">${download.quality}</span>
                        <span class="file-size">Size: ${download.size}</span>
                    </div>
                    ${cardData.icon ? '<i class="fas fa-cloud-download-alt"></i>' : ''}
                </button>
            `;
        });

        // Extra text
        if (cardData.extraText.trim()) {
            html += `<div class="mb-3">${cardData.extraText}</div>`;
        }

        html += '</div>';

        return html;
    }

    /**
     * Setup download button handlers
     */
    setupDownloadButtonHandlers() {
        const downloadButtons = document.querySelectorAll('.scraped-download-btn');

        downloadButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const downloadURL = button.getAttribute('data-download-url');
                await this.handleDownloadButtonClick(downloadURL, button);
            });
        });
    }

    /**
     * Handle download button click
     */
    async handleDownloadButtonClick(downloadURL, buttonElement) {
        try {
            console.log('[ScraperIntegration] Download button clicked:', downloadURL);

            // Disable button
            buttonElement.disabled = true;
            buttonElement.innerHTML += ' <i class="fas fa-spinner fa-spin"></i>';

            // Execute one-click download flow
            const result = await this.scraperEngine.handleOneClickDownload(downloadURL);

            // Re-enable button
            buttonElement.disabled = false;
            const spinner = buttonElement.querySelector('.fa-spinner');
            if (spinner) spinner.remove();

            if (result.success) {
                console.log('[ScraperIntegration] Download flow successful:', result);

                // Open final download link in new tab (USER-TRIGGERED)
                window.open(result.buttonHref, '_blank', 'noopener,noreferrer');

                this.showNotification('Download link opened in new tab!');

            } else {
                console.error('[ScraperIntegration] Download flow failed:', result.error);
                this.showNotification('Download failed: ' + result.error, true);
            }

        } catch (error) {
            console.error('[ScraperIntegration] Error handling download button:', error);

            // Re-enable button
            buttonElement.disabled = false;
            const spinner = buttonElement.querySelector('.fa-spinner');
            if (spinner) spinner.remove();

            this.showNotification('Download error: ' + error.message, true);
        }
    }

    /**
     * Create loading indicator
     */
    createLoadingIndicator() {
        // Check if already exists
        if (document.getElementById('scraper-loading-indicator')) {
            return;
        }

        const loadingHTML = `
            <div id="scraper-loading-indicator" class="scraper-loading-overlay" style="display: none;">
                <div class="scraper-loading-content">
                    <div class="loading-spinner"></div>
                    <p id="scraper-loading-text">Loading...</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    /**
     * Show loading indicator
     */
    showLoading(message = 'Loading...') {
        this.isLoading = true;

        const indicator = document.getElementById('scraper-loading-indicator');
        const text = document.getElementById('scraper-loading-text');

        if (indicator) {
            indicator.style.display = 'flex';
        }

        if (text) {
            text.textContent = message;
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.isLoading = false;

        const indicator = document.getElementById('scraper-loading-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Show notification
     */
    showNotification(message, isError = false) {
        // Use existing notification system if available
        if (typeof showNotification === 'function') {
            showNotification(message, isError);
        } else {
            console.log('[ScraperIntegration] Notification:', message);
            alert(message);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.scraperIntegration = new ScraperIntegration();
    });
} else {
    window.scraperIntegration = new ScraperIntegration();
}
