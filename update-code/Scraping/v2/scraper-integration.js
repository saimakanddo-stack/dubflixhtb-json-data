/**
 * ============================================
 * SCRAPER INTEGRATION LAYER
 * ============================================
 * 
 * This script integrates the scraping engine with the website.
 * Handles interactions, caching, and UI updates.
 */

class ScraperIntegration {
    constructor() {
        this.config = {
            baseScrapingURL: 'https://mlink627.movielinkbd.li',
            useCORSProxy: true,
            debug: true
        };

        this.scraperEngine = new ScraperEngine(this.config);
        this.cardExtractor = new ScraperCardExtractor(this.config);

        // Abort controller for cancelling requests
        this.abortController = null;
        this.isLoading = false;
        this.resetToken = 0; // NEW: Token to track and cancel overlapping resets

        // Movie card scraping state
        this.cardScrapingState = {
            isActive: false,
            isPaused: false,
            currentPage: 1,
            totalLoaded: 0,
            batchSize: 20,
            isFetchingCards: false,
            categoryUrl: null
        };

        // Track scraped pagination pages: pageNumber => firstCardId
        this.scrapedPages = new Map();

        // Initialize global signaling for languages
        window.scrapedLanguages = null;

        // Video Guide Elements
        this.videoModal = document.getElementById('videoGuideModal');
        this.videoPlayer = document.getElementById('guideVideo');
        this.closeVideoBtn = document.getElementById('closeVideoModal');

        this.checkOrigin();
        this.init();
    }

    checkOrigin() {
        if (window.location.protocol === 'file:') {
            console.warn('[ScraperIntegration] WARNING: You are running this site from the file system (file://). Browsers may block the scraper\'s fetch requests due to security policies. Please use a local server (e.g., Live Server) for testing.');
        }
    }

    async init() {
        try {
            await this.loadConfiguration();
            this.setupEventListeners();

            // Populated languages from source
            this.fetchAndPopulateLanguages();
            this.fetchAndPopulateGenres();
            this.fetchAndPopulateTopCategories();

            console.log('[ScraperIntegration] Initialized successfully');
        } catch (error) {
            console.error('[ScraperIntegration] Initialization error:', error);
        }
    }

    async loadConfiguration() {
        try {
            const data = await this.fetchMoviesJSON();
            if (!data) return;

            // Handle both object { movies: [], baseScrapingURL: '' } and plain array []
            if (data.baseScrapingURL) {
                this.config.baseScrapingURL = data.baseScrapingURL;
                if (this.scraperEngine) this.scraperEngine.baseScrapingURL = data.baseScrapingURL;
                console.log('[ScraperIntegration] Config loaded from object:', this.config.baseScrapingURL);
            } else if (Array.isArray(data)) {
                console.log('[ScraperIntegration] data is an array, using default baseScrapingURL');
            }
        } catch (error) {
            console.error('[ScraperIntegration] Error loading config:', error);
        }
    }

    async fetchMoviesJSON() {
        try {
            const response = await fetch(typeof JSON_URLS !== 'undefined' ? JSON_URLS.movies : 'movies.json');
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    setupEventListeners() {
        // Modal close listeners
        if (this.closeVideoBtn) {
            this.closeVideoBtn.addEventListener('click', () => this.closeVideoGuide());
        }

        // Close on overlay click
        if (this.videoModal) {
            this.videoModal.addEventListener('click', (e) => {
                if (e.target === this.videoModal) this.closeVideoGuide();
            });
        }

        // Listen for clicks on movie cards (more reliable than just posters)
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.movie-card');

            // Only trigger if clicking the card AND not clicking a specific action button (like share)
            if (card && !this.isLoading && !e.target.closest('.copy-link-btn')) {
                const poster = card.querySelector('.movie-poster');
                if (poster) {
                    this.handleMoviePosterClick(poster);
                }
            }
        });

        // Setup global event listener for closing modals (to stop scraping)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.close-modal') ||
                e.target === document.getElementById('movieModal') ||
                e.target === document.getElementById('scraperDialogOverlay')) {
                this.abortScraping();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.abortScraping();
        });
    }

    async handleMoviePosterClick(posterElement) {
        try {
            const movieCard = posterElement.closest('.movie-card');
            if (!movieCard) return;

            const titleElement = movieCard.querySelector('.movie-title');

            // FIX: Scraped cards use data-post-url, not data-id
            const movieId = movieCard.getAttribute('data-id') || movieCard.getAttribute('data-post-url');

            if (!titleElement || !movieId) return;

            const movieTitle = titleElement.textContent.trim();
            if (this.config.debug) {
                console.log(`[ScraperIntegration] Clicked: "${movieTitle}" (ID: ${movieId})`);
            }

            // 1. Fetch movie data to check if scraping is needed
            const movieData = await this.getMovieData(movieId);
            if (!movieData) {
                console.warn(`[ScraperIntegration] Movie data not found for ID: ${movieId}`);
                return;
            }

            if (movieData.server !== true) {
                if (this.config.debug) console.log('[ScraperIntegration] Scraper not required for this movie (server != true)');
                return;
            }

            // 2. Start Scraping (Automatic)
            this.startScraping(movieId);

        } catch (error) {
            console.error('[ScraperIntegration] Poster click error:', error);
        }
    }

    async startScraping(movieId) {
        if (!movieId) return;
        if (this.isLoading) return;
        try {
            if (this.config.debug) {
                console.log(`[ScraperIntegration] Scraping triggered for Movie ID: ${movieId}`);
            }

            // 1. Fetch movie data 
            const movieData = await this.getMovieData(movieId);
            if (!movieData) return;

            if (movieData.server !== true) return;

            this.activeMovieId = movieId;
            const movieTitle = movieData.title || "Unknown Movie";

            // 3. Start Scraping
            this.resetModalScroll();
            this.abortScraping();
            this.abortController = new AbortController();
            const signal = this.abortController.signal;
            this.isLoading = true;

            if (this.config.debug) console.log(`[ScraperIntegration] Starting fresh scrape for "${movieTitle}"...`);

            // UI feedback in the downloadOptions container
            this._isFirstCard = true;
            this.showInlineLoading();

            const result = await this.scraperEngine.scrapeMovie(movieTitle, movieData, signal, (progress) => {
                if (signal.aborted) return;

                if (progress.type === 'instruction') {
                    this.injectInstructionSection(progress.data);
                } else if (progress.type === 'guide') {
                    this.injectGuideSection(progress.data);
                } else if (progress.type === 'option') {
                    // Remove loader if it's the first option
                    const container = document.getElementById('downloadOptions');
                    if (container && container.querySelector('.loading')) {
                        container.innerHTML = '';
                    }
                    this.appendDownloadOption(progress.data);
                } else if (progress.type === 'metadata') {
                    this.injectMetadata(progress.data);
                }
            });

            this.isLoading = false;

            if (!result.success && !signal.aborted) {
                // Update title to show failure for deep links
                const modalTitle = document.getElementById('modalMovieTitle');
                if (modalTitle && modalTitle.textContent === 'Loading content...') {
                    modalTitle.textContent = 'Failed to load content';
                }

                // Only show error if we got absolutely nothing
                const container = document.getElementById('downloadOptions');
                if (!container || !container.querySelector('.download-server')) {
                    this.injectError(result.error || "Failed to load options");
                }
            } else if (result.success && !signal.aborted) {
                if (this.config.debug) console.log('[ScraperIntegration] Fresh scraping completed');

                // CRITICAL FIX: If successful but no options were found (and thus no 'option' events emitted),
                // the spinner might still be showing. We must clear it or show "No options found".
                const container = document.getElementById('downloadOptions');
                if (container && container.querySelector('.loading')) {
                    if (result.downloadOptions && result.downloadOptions.length === 0) {
                        this.injectError("No download options found.");
                    } else {
                        // Should have been cleared by 'option' event, but safety check
                        container.innerHTML = '';
                    }
                }
            }

        } catch (error) {
            this.isLoading = false;
            if (error.name !== 'AbortError') {
                console.error('[ScraperIntegration] Scraping error:', error);

                // Update title to show failure for deep links
                const modalTitle = document.getElementById('modalMovieTitle');
                if (modalTitle && modalTitle.textContent === 'Loading content...') {
                    modalTitle.textContent = 'Error Loading Content';
                }

                this.injectError("An unexpected error occurred: " + error.message);
            }
        }
    }

    async getMovieData(movieId) {
        // Check for deep link data first
        if (window.deepLinkMovieData && window.deepLinkMovieData.id === movieId) {
            if (this.config.debug) console.log('[ScraperIntegration] Using deep link movie data');
            return window.deepLinkMovieData;
        }

        if (typeof allMovies !== 'undefined' && Array.isArray(allMovies)) {
            // Use loose equality to handle string vs number IDs
            return allMovies.find(m => m.id == movieId);
        }
        const moviesData = await this.fetchMoviesJSON();
        return moviesData?.find(m => m.id == movieId);
    }

    injectScrapedData(data) {
        // Since we disabled link caching, we normally wouldn't call this with full data anymore
        // but keeping it for other potential metadata/instructions
        if (data.instructionData) this.injectInstructionSection(data.instructionData);
        if (data.guideData) this.injectGuideSection(data.guideData);
        if (data.metadata) this.injectMetadata(data.metadata);

        const container = document.getElementById('downloadOptions');
        if (container && data.downloadOptions) {
            container.innerHTML = '';
            data.downloadOptions.forEach(option => this.appendDownloadOption(option));
        }
    }

    injectInstructionSection(data) {
        const container = document.getElementById('instructionSection');
        if (!container) return;

        if (!data || (!data.header && (data.notices?.length || 0) === 0 && !data.unzipGuide)) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.classList.add('scraped-section', 'instruction-section');
        let html = '';

        if (data.header) {
            html += '<div class="text-center mb-4">';
            if (data.header.h3) html += `<h3 class="fw-bold mb-1">${data.header.h3}</h3>`;
            if (data.header.h5) html += `<h5 class="mb-2">${data.header.h5}</h5>`;
            if (data.header.attention) html += `<div class="mlbd-note-attn mb-2">${data.header.attention}</div>`;
            if (data.header.redNotice) html += `<div class="text-danger fw-bold mb-2"><i class="fas fa-exclamation-circle"></i> ${data.header.redNotice}</div>`;
            html += '</div>';
        }

        if (data.notices && data.notices.length > 0) {
            data.notices.forEach(notice => {
                html += `
                <div class="notice-item">
                    <div class="notice-icon text-warning"><i class="fas fa-bullhorn"></i></div>
                    <div class="notice-text text-warning-light fw-semibold">${notice.text}</div>
                </div>`;
            });
        }

        if (data.unzipGuide) {
            html += `
            <div class="notice-item" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                <div class="notice-icon text-info"><i class="fas fa-file-archive"></i></div>
                <div class="notice-text" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <span class="text-info fw-bold">${data.unzipGuide.text}</span> 
                    
                </div>
                <button onclick="scraperIntegration.openVideoGuide('https://pub-97a4d447859c48eb95966a19c8c274b3.r2.dev/How%20to%20Unzip.mp4')" class="video-guide-btn">
                        <i class="fas fa-play-circle"></i>
                    </button>
            </div>`;
        }

        container.innerHTML = html;
    }

    injectGuideSection(data) {
        const container = document.getElementById('guideSection');
        if (!container) return;

        if (!data || (data.headers.length === 0 && data.guides.length === 0 && !data.vlcLink)) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.classList.add('scraped-section', 'guide-section');
        let html = '';

        let hasComplete = false;
        data.headers.forEach(header => {
            if (header.level === 3) {
                html += `<h3 class="text-success fw-bold text-center mb-3">${header.text}</h3>`;
                if (header.text.includes('COMPLETE')) hasComplete = true;
            } else if (header.level === 4) {
                html += `<h4 class="text-warning-light fw-semibold text-center mb-3">${header.text}</h4>`;
            }
        });

        // Inject dynamic download buttons if COMPLETE is found
        if (hasComplete && data.downloadButtons && data.downloadButtons.length > 0) {
            html += '<div class="download-server download-server-group animate-fade-in mb-4" style="padding: 15px;">';
            html += '<div class="server-title"><div class="server-info"><i class="fas fa-cloud-download-alt"></i><span>Scraped Links</span></div></div>';
            html += '<div class="quality-options">';
            data.downloadButtons.forEach(btn => {
                html += `
                <button class="scraped-download-btn dynamic-download-btn animate-fade-in" onclick="scraperIntegration.handleDownloadClick('${btn.href}', this)">
                    <div class="quality-info">
                        <span class="quality-text">${btn.text}</span>
                        <span class="file-size">Fast Direct Link</span>
                    </div>
                    <i class="fas fa-download"></i>
                </button>`;
            });
            html += '</div></div>';
        }

        data.guides.forEach(guide => {
            if (guide.warning) {
                html += `
                <div class="notice-item">
                    <div class="notice-icon text-warning"><i class="fas fa-volume-mute"></i></div>
                    <div class="notice-text text-warning fw-bold">${guide.warning}</div>
                </div>`;
            }
            if (guide.info) {
                html += `
                <div class="notice-item">
                    <div class="notice-icon text-info"><i class="fas fa-hand-point-right"></i></div>
                    <div class="notice-text text-info fw-semibold">${guide.info}</div>
                </div>`;
            }
        });

        if (data.vlcLink) {
            html += `
            <div class="text-center">
                <a href="${data.vlcLink.href}" class="vlc-download-btn" target="_blank">
                    <i class="fas fa-download"></i> ${data.vlcLink.text}
                </a>
            </div>`;
        }

        container.innerHTML = html;
    }

    injectMetadata(data) {
        if (!data) return;

        // 0. Title (Main Modal Title)
        const modalTitle = document.getElementById('modalMovieTitle');
        if (modalTitle && data.title) {
            modalTitle.textContent = data.title;
        }

        // 1. Subtitle (Yellow text)
        const modalSubtitle = document.getElementById('modalMovieSubtitle');
        if (modalSubtitle && data.subtitle) {
            modalSubtitle.textContent = data.subtitle;
            modalSubtitle.style.color = '#ffc107'; // Ensure yellow color
            modalSubtitle.style.display = 'block';
        }

        // 2. Metadata Info Fields
        const fieldMap = {
            'imdb': 'modalIMDb',
            'genre': 'modalGenre',
            'language': 'modalLanguageDetail',
            'quality': 'modalQualityDetail',
            'resolution': 'modalResolution',
            'released': 'modalReleased',
            'cast': 'modalCast'
        };

        for (const [key, id] of Object.entries(fieldMap)) {
            const el = document.getElementById(id);
            if (el && data.info[key]) {
                el.textContent = data.info[key];
            }
        }

        // 3. Storyline
        const modalStoryline = document.getElementById('modalStoryline');
        if (modalStoryline && data.storyline) {
            modalStoryline.textContent = data.storyline;
        }

        // 4. Screenshots
        const screenshotsSection = document.getElementById('screenshotsSection');

        if (data.screenshots && data.screenshots.length > 0) {
            if (window.renderScreenshots) {
                window.renderScreenshots(data.screenshots, this.activeMovieId);
            }
        } else if (screenshotsSection) {
            // Only hide if we explicitly have no screenshots in new data
            if (data.screenshots) {
                screenshotsSection.style.display = 'none';
            }
        }

        // 5. Type Badge
        const typeValue = document.getElementById('modalTypeValue');
        if (typeValue && data.typeBadge) {
            typeValue.textContent = data.typeBadge;
        }
    }

    appendDownloadOption(card) {
        const container = document.getElementById('downloadOptions');
        if (!container) return;

        // Clear skeletons if they are still there
        const skeletons = container.querySelectorAll('.skeleton-options, .scraped-skeleton');
        if (skeletons.length > 0) {
            container.innerHTML = '';
        }

        let cardHtml = `
            <div class="download-server animate-fade-in mb-3 ${card.isNew ? 'is-new-added' : ''}">
                <div class="server-header d-flex justify-content-between align-items-center mb-2">
                    <div class="server-info">
                        <i class="${card.icon?.class || 'fas fa-server'} mr-2"></i>
                        <span>${card.header}</span>
                    </div>
                    ${card.isNew ? '<span class="new-badge">NEW ADDED</span>' : ''}
                </div>
        `;

        cardHtml += '<div class="quality-options">';
        card.downloads.forEach((dl) => {
            cardHtml += `
                <button class="quality-btn scraped-download-btn" onclick="scraperIntegration.handleDownloadClick('${dl.href}', this)">
                    <div class="quality-info">
                        <span class="quality-text">${dl.quality || 'Unknown'}</span>
                        <span class="file-size">Size: ${dl.size || 'Unknown'}</span>
                    </div>
                    <i class="fas fa-download"></i>
                </button>
            `;
        });
        cardHtml += '</div>';

        if (card.extraText) {
            cardHtml += `<div class="text-center text-muted small mt-2">${card.extraText}</div>`;
        }

        cardHtml += '</div>';
        container.innerHTML += cardHtml;
    }

    injectDownloadOptions(options) {
        const container = document.getElementById('downloadOptions');
        if (!container) return;

        container.innerHTML = '';
        options.forEach((card) => {
            this.appendDownloadOption(card);
        });
    }

    async handleDownloadClick(url, btn) {
        // PER-LINK UNLOCK SYSTEM
        const currentMovie = typeof currentMovieId !== 'undefined' ? currentMovieId : 'global';
        const serverName = 'DynamicLink'; // Tracking ID for these links
        const serverKey = `${currentMovie}_${url}`; // Use URL as part of key to make it specific

        // Check if already unlocked
        const sessionUnlocked = JSON.parse(sessionStorage.getItem('unlockedServers') || '{}');
        const localStorageUnlocked = JSON.parse(localStorage.getItem('unlockedServers') || '{}');
        const allUnlockedServers = { ...localStorageUnlocked, ...sessionUnlocked };

        const isUnlocked = allUnlockedServers[serverKey] &&
            (typeof isServerUnlockExpired !== 'undefined' ? !isServerUnlockExpired(currentMovie, serverName) : true);

        if (!isUnlocked) {
            // Determine button type: 'multiple' for dynamic download buttons, 'single' for others
            const buttonType = (btn && btn.classList.contains('dynamic-download-btn')) ? 'multiple' : 'single';
            const config = typeof unlockConfig !== 'undefined' && unlockConfig[buttonType]
                ? unlockConfig[buttonType]
                : (buttonType === 'multiple' ? { timerDuration: 15, requiredAds: 3 } : { timerDuration: 10, requiredAds: 2 });

            // --- YouTube Direct Ad Logic: If requiredAds is 1, bypass "Link Locked" screen ---
            const isYouTube = window.currentFilterType === 'youtube';
            const activeConfig = isYouTube ? (unlockConfig.youtube || config) : config;

            if (activeConfig.requiredAds === 1) {
                console.log("[Scraper] Direct ad mode triggered (requiredAds=1)");
                // Trigger unlock process directly
                this.processScraperUnlock(currentMovie, serverKey, url, btn, isYouTube ? 'youtube' : buttonType);
                return;
            }
            // --- End Direct Ad Logic ---

            // Show unlock UI in the dialog
            this.showScraperDialog("Link Locked", false);
            const body = document.getElementById('scraperDialogBody');
            const adCount = (typeof adCounts !== 'undefined' ? (adCounts[serverKey] || 0) : 0);
            const reqAds = config.requiredAds;
            const timerDuration = config.timerDuration;
            const t = typeof translations !== 'undefined' ? translations[currentLanguage || 'en'] : {
                unlock_button: "Unlock Link ({adCount}/{requiredCount})",
                loading_ad: "Loading ad...",
                verifying_button: "Wait {countdown}s"
            };

            const unlockBtnText = t.unlock_button.replace('{adCount}', adCount).replace('{requiredCount}', reqAds);

            body.innerHTML = `
                <div class="scraped-buttons-container text-center p-3">
                    <div class="lock-icon mb-3" style="font-size: 3rem; color: #ff5b6b;"><i class="fas fa-lock"></i></div>
                    <h4>Verification Required</h4>
                    <p class="text-muted small mb-4">Please watch ${reqAds} short ads to generate your high-speed download link.</p>
                    
                    <button id="scraperUnlockBtn" class="big-cta-btn unlock-btn mb-2" 
                            data-movie-id="${currentMovie}" 
                            data-server-name="${serverName}"
                            data-button-type="${buttonType}"
                            data-timer-duration="${timerDuration}"
                            onclick="scraperIntegration.processScraperUnlock('${currentMovie}', '${serverKey}', '${url}', this, '${buttonType}')">
                        <i class="fas fa-play-circle"></i> <span class="unlock-text">${unlockBtnText}</span>
                    </button>
                    
                    <div id="scraperTimerProgress" class="timer-progress mt-2" 
                         data-movie-id="${currentMovie}" 
                         data-server-name="${serverName}"
                         style="${adCount > 0 ? '' : 'display:none'}">
                        Ads Viewed: ${adCount} / ${reqAds}
                    </div>
                </div>
            `;
            return;
        }

        const isYouTube = window.currentFilterType === 'youtube';

        if (isYouTube) {
            this.showScraperDialog("Success! Link Unlocked.", false);
            this.updateScraperDialogSuccess({
                success: true,
                buttons: [{
                    href: url,
                    text: 'Watch On YouTube',
                    iconClass: 'fab fa-youtube'
                }]
            });
            return;
        }

        // If already unlocked, proceed with scraping
        if (this.abortController) this.abortController.abort();
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        // --- POPUP BLOCK FIX: "Safe-Tab" Pattern ---
        const targetWindow = window.open('about:blank', '_blank');
        if (targetWindow) {
            targetWindow.document.write(`
                <html>
                <head>
                    <title>Generating Download Link...</title>
                    <style>
                        body { background: #1a1d21; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
                        .loader { text-align: center; }
                        .spinner { border: 4px solid rgba(255,255,255,0.1); border-left-color: #ff5b6b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                        @keyframes spin { to { transform: rotate(360deg); } }
                        h2 { color: #ff5b6b; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="loader">
                        <div class="spinner"></div>
                        <h2 id="msg">Scraping Link...</h2>
                        <p>One moment while we process your request.</p>
                    </div>
                </body>
                </html>
            `);
        }

        this.showScraperDialog("Analyzing link...", true);

        const result = await this.scraperEngine.handleOneClickDownload(url, signal, (progress) => {
            if (signal.aborted) return;

            // Update loading tab if it exists
            if (targetWindow && !targetWindow.closed) {
                const msgEl = targetWindow.document.getElementById('msg');
                if (msgEl) msgEl.textContent = progress.message;
            }

            // Update main dialog with progress
            const body = document.getElementById('scraperDialogBody');
            if (body) {
                body.innerHTML = `
                    <div class="scraper-loading-state">
                        <div class="loading-spinner"></div>
                        <p>${progress.message}</p>
                        <button class="btn-cancel mt-3" onclick="scraperIntegration.abortScraping()">Cancel</button>
                    </div>
                `;
            }
        });

        if (!signal.aborted) {
            if (result.success) {
                // SUCCESS: Redirect the already-opened tab if there's only one link
                if (result.buttons && result.buttons.length === 1 && targetWindow && !targetWindow.closed) {
                    targetWindow.location.assign(result.buttons[0].href);
                    this.closeScraperDialog();
                } else if (result.buttons && result.buttons.length > 0) {
                    if (targetWindow && !targetWindow.closed) targetWindow.close();
                    this.updateScraperDialogSuccess(result);
                } else {
                    if (targetWindow && !targetWindow.closed) targetWindow.close();
                    this.showScraperDialog("Success! Click below to download.", false);
                    this.updateScraperDialogSuccess(result);
                }
            } else {
                if (targetWindow && !targetWindow.closed) targetWindow.close();
                this.showScraperDialog("Error: " + result.error, false);
            }
        } else {
            // Aborted
            if (targetWindow && !targetWindow.closed) targetWindow.close();
        }
    }

    async processScraperUnlock(movieId, serverKey, originalUrl, button, buttonType = 'multiple') {
        console.log('[ScraperIntegration] processScraperUnlock called:', { movieId, serverKey, originalUrl, buttonType });

        if (typeof processAdUnlock !== 'function') {
            console.error("[ScraperIntegration] Ad Unlock function not found");
            return;
        }

        // Get config for this button type
        const config = typeof unlockConfig !== 'undefined' && unlockConfig[buttonType]
            ? unlockConfig[buttonType]
            : { timerDuration: 15, requiredAds: 3 };

        const reqAds = config.requiredAds;
        const timerDuration = config.timerDuration;
        const serverName = 'DynamicLink';

        try {
            console.log('[ScraperIntegration] Starting ad unlock process...');

            // Set flag to prevent modal reload during scraping
            this.isProcessingScraping = true;

            // Pass the custom key and timerDuration to processAdUnlock
            await processAdUnlock(movieId, serverName, reqAds, button, serverKey, timerDuration);

            console.log('[ScraperIntegration] Ad unlock completed, checking unlock status...');

            // Check if fully unlocked
            const sessionUnlocked = JSON.parse(sessionStorage.getItem('unlockedServers') || '{}');
            const localStorageUnlocked = JSON.parse(localStorage.getItem('unlockedServers') || '{}');
            const allUnlocked = { ...localStorageUnlocked, ...sessionUnlocked };

            console.log('[ScraperIntegration] Unlock status:', { serverKey, isUnlocked: !!allUnlocked[serverKey] });

            if (allUnlocked[serverKey]) {
                console.log('[ScraperIntegration] Link unlocked! Starting deep scraping...');

                // Success! Now trigger the deep scraping directly (avoid recursive call)
                if (window.currentFilterType === 'youtube') {
                    this.showScraperDialog("Success! Link Unlocked.", false);
                    this.updateScraperDialogSuccess({
                        success: true,
                        buttons: [{
                            href: originalUrl,
                            text: 'Watch On YouTube',
                            iconClass: 'fab fa-youtube'
                        }]
                    });
                    return;
                }

                // If not YouTube, proceed with scraping
                if (this.abortController) this.abortController.abort();
                this.abortController = new AbortController();
                const signal = this.abortController.signal;

                // --- POPUP BLOCK FIX: "Safe-Tab" Pattern ---
                let targetWindow = null;
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                if (!isMobile) {
                    targetWindow = window.open('about:blank', '_blank');
                    if (targetWindow) {
                        targetWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Generating Download Link...</title>
                                    <style>
                                        body { background: #1a1d21; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
                                        .loader { text-align: center; }
                                        .spinner { border: 4px solid rgba(255,255,255,0.1); border-left-color: #ff5b6b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                                        @keyframes spin { to { transform: rotate(360deg); } }
                                        h2 { color: #ff5b6b; margin-bottom: 10px; }
                                    </style>
                                </head>
                                <body>
                                    <div class="loader">
                                        <div class="spinner"></div>
                                        <h2 id="msg">Scraping Link...</h2>
                                        <p>One moment while we process your request.</p>
                                    </div>
                                </body>
                            </html>
                        `);
                    }
                }

                // Ensure dialog exists and update it with scraping progress
                const dialog = document.getElementById('scraperDialogOverlay');
                if (!dialog || dialog.style.display === 'none') {
                    console.log('[ScraperIntegration] Dialog not visible, showing it...');
                    this.showScraperDialog("Analyzing link...", true);
                } else {
                    // Dialog is already visible, just update the body
                    const dialogBody = document.getElementById('scraperDialogBody');
                    if (dialogBody) {
                        console.log('[ScraperIntegration] Updating dialog body with scraping progress...');
                        dialogBody.innerHTML = `
                            <div class="scraper-loading-state">
                                <div class="loading-spinner"></div>
                                <p>Analyzing link...</p>
                                <button class="btn-cancel mt-3" onclick="scraperIntegration.abortScraping()">Cancel</button>
                            </div>
                        `;
                    }
                }

                const result = await this.scraperEngine.handleOneClickDownload(originalUrl, signal, (progress) => {
                    if (signal.aborted) return;

                    // Update loading tab if it exists
                    if (targetWindow && !targetWindow.closed) {
                        const msgEl = targetWindow.document.getElementById('msg');
                        if (msgEl) msgEl.textContent = progress.message;
                    }

                    // Update main dialog with progress
                    const body = document.getElementById('scraperDialogBody');
                    if (body) {
                        body.innerHTML = `
                            <div class="scraper-loading-state">
                                <div class="loading-spinner"></div>
                                <p>${progress.message}</p>
                                <button class="btn-cancel mt-3" onclick="scraperIntegration.abortScraping()">Cancel</button>
                            </div>
                        `;
                    }
                });

                console.log('[ScraperIntegration] Scraping completed:', result);

                if (!signal.aborted) {
                    if (result.success) {
                        // SUCCESS: Redirect the already-opened tab if there's only one link
                        if (result.buttons && result.buttons.length === 1 && targetWindow && !targetWindow.closed) {
                            targetWindow.location.assign(result.buttons[0].href);
                            this.closeScraperDialog();
                        } else if (result.buttons && result.buttons.length > 1) {
                            // Multiple links: Show them in dialog
                            if (targetWindow && !targetWindow.closed) targetWindow.close();
                            this.updateScraperDialogSuccess(result);
                        } else {
                            // No buttons found
                            if (targetWindow && !targetWindow.closed) targetWindow.close();
                            this.showScraperDialog("No download links found", false);
                        }
                    } else {
                        // ERROR
                        if (targetWindow && !targetWindow.closed) targetWindow.close();
                        this.showScraperDialog("Error: " + result.error, false);
                    }
                } else {
                    // Aborted
                    if (targetWindow && !targetWindow.closed) targetWindow.close();
                }
            } else {
                console.log('[ScraperIntegration] Still locked, updating progress...');

                // Update specific progress element text if still locked
                const count = typeof adCounts !== 'undefined' ? (adCounts[serverKey] || 0) : 0;
                const progressEl = document.getElementById('scraperTimerProgress');
                if (progressEl) {
                    progressEl.style.display = 'block';
                    progressEl.textContent = `Ads Viewed: ${count} / ${reqAds}`;
                }
            }
        } catch (error) {
            console.error("[ScraperIntegration] Scraper ad unlock error:", error);
        } finally {
            // Reset flag
            this.isProcessingScraping = false;
        }
    }

    showInlineLoading() {
        const container = document.getElementById('downloadOptions');
        if (container) {
            container.innerHTML = `
                <div class="skeleton-options p-2">
                    <div class="mb-3" style="border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; background: rgba(255,255,255,0.02);">
                        <div class="d-flex justify-content-between mb-3">
                            <div class="skeleton" style="width: 120px; height: 18px;"></div>
                            <div class="skeleton" style="width: 80px; height: 18px;"></div>
                        </div>
                        <div class="d-flex gap-2">
                            <div class="skeleton" style="flex: 1; height: 45px; border-radius: 8px;"></div>
                            <div class="skeleton" style="flex: 1; height: 45px; border-radius: 8px;"></div>
                        </div>
                    </div>
                    <div class="mb-3" style="border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; background: rgba(255,255,255,0.02);">
                        <div class="d-flex justify-content-between mb-3">
                            <div class="skeleton" style="width: 100px; height: 18px;"></div>
                        </div>
                        <div class="d-flex gap-2">
                            <div class="skeleton" style="flex: 1; height: 45px; border-radius: 8px;"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    injectError(msg) {
        const container = document.getElementById('downloadOptions');
        if (container) container.innerHTML = `<div class="text-center text-danger p-4"><i class="fas fa-exclamation-circle"></i> ${msg}</div>`;
    }

    /**
     * Show a grid of skeleton loaders
     * @param {HTMLElement} container - The container to inject skeletons into
     * @param {number} count - Number of skeletons to show
     */
    showSkeletonGrid(container, count = 15) {
        if (!container) return;

        const skeletons = [];
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-card scraper-skeleton';
            skeleton.innerHTML = `
                <div class="skeleton-poster skeleton"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-subtitle skeleton"></div>
                    <div class="skeleton-meta skeleton"></div>
                </div>
            `;
            skeletons.push(skeleton);
            container.appendChild(skeleton);
        }
        return skeletons;
    }

    /**
     * Remove all skeleton cards from a container
     * @param {HTMLElement} container - The container to clean
     */
    hideSkeletons(container) {
        if (!container) return;
        const skeletons = container.querySelectorAll('.scraper-skeleton');
        skeletons.forEach(s => s.remove());
    }

    abortScraping() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.closeScraperDialog();
    }

    showScraperDialog(message, isLoading = false) {
        let dialog = document.getElementById('scraperDialogOverlay');
        if (!dialog) {
            document.body.insertAdjacentHTML('beforeend', `
                <div id="scraperDialogOverlay" class="scraper-dialog-overlay" style="display: none;">
                    <div class="scraper-dialog-content">
                        <div class="scraper-dialog-header">
                            <h3>Download Option</h3>
                            <button class="scraper-dialog-close" onclick="scraperIntegration.abortScraping()">&times;</button>
                        </div>
                        <div class="scraper-dialog-body" id="scraperDialogBody"></div>
                    </div>
                </div>
            `);
            dialog = document.getElementById('scraperDialogOverlay');
        }

        const body = document.getElementById('scraperDialogBody');
        body.innerHTML = isLoading ? `
            <div class="scraper-loading-state">
                <div class="loading-spinner"></div>
                <p>${message}</p>
                <button class="btn-cancel mt-3" onclick="scraperIntegration.abortScraping()">Cancel</button>
            </div>
        ` : `<p>${message}</p>`;

        dialog.style.display = 'flex';
    }

    updateScraperDialogSuccess(result) {
        const body = document.getElementById('scraperDialogBody');
        if (body) {
            let buttonsHTML = '';

            if (result.buttons && result.buttons.length > 0) {
                result.buttons.forEach(btn => {
                    buttonsHTML += `
                        <a href="${btn.href}" class="big-cta-btn" target="_blank" rel="noopener noreferrer">
                            <i class="${btn.iconClass || 'fas fa-cloud-download-alt'}"></i> ${btn.text || 'Download'}
                        </a>
                    `;
                });
            }

            body.innerHTML = `
                <div class="scraper-success-state">
                    <div class="success-icon"><i class="fas fa-check-circle"></i></div>
                    <h4>Links Generated!</h4>
                    <div class="scraped-buttons-container">
                        ${buttonsHTML}
                    </div>
                    <p class="text-muted small mt-2">Click to start your download</p>
                </div>
            `;
        }
    }

    resetModalScroll() {
        const modal = document.getElementById('movieModal');
        if (modal) {
            // Reset modal body or the modal element itself depending on structure
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) modalBody.scrollTop = 0;
            modal.scrollTop = 0;
        }

        const optionsContainer = document.getElementById('downloadOptions');
        if (optionsContainer) optionsContainer.scrollTop = 0;
    }

    closeScraperDialog() {
        const dialog = document.getElementById('scraperDialogOverlay');
        if (dialog) dialog.style.display = 'none';
    }

    openVideoGuide(url) {
        if (!this.videoModal || !this.videoPlayer) return;

        const videoSource = this.videoPlayer.querySelector('source');
        if (videoSource) {
            videoSource.src = url;
            this.videoPlayer.load();
        }

        this.videoModal.classList.add('active');
        this.videoPlayer.play().catch(err => console.log("Auto-play blocked or error:", err));
        document.body.style.overflow = 'hidden';
    }

    closeVideoGuide() {
        if (!this.videoModal || !this.videoPlayer) return;

        this.videoModal.classList.remove('active');
        this.videoPlayer.pause();
        this.videoPlayer.currentTime = 0;
        document.body.style.overflow = '';
    }

    /**
     * Fetch languages from source site and populate sideboard
     */
    async fetchAndPopulateLanguages() {
        try {
            const fetchUrl = this.scraperEngine.baseScrapingURL || this.config.baseScrapingURL;
            if (this.config.debug) console.log('[ScraperIntegration] Fetching languages from: ' + fetchUrl);

            if (!fetchUrl) {
                console.warn('[ScraperIntegration] No base URL found for language fetching');
                return;
            }

            // Fetch home page to get languages grid
            const html = await this.scraperEngine.fetchHTML(fetchUrl, true);

            if (!html || html.length < 100) {
                console.warn('[ScraperIntegration] Failed to fetch HTML for languages');
                return;
            }

            const doc = new DOMParser().parseFromString(html, 'text/html');
            const languages = this.scraperEngine.scrapeLanguages(doc);

            if (this.config.debug) {
                console.log(`[ScraperIntegration] Found ${languages.length} languages from source`);
                if (languages.length === 0) {
                    if (html.includes('mlbdLangGrid')) {
                        console.log('[ScraperIntegration] DEBUG: mlbdLangGrid ID found in HTML string but no DOM elements extracted. Selector issue?');
                    } else {
                        console.log('[ScraperIntegration] DEBUG: mlbdLangGrid ID NOT found in fetched HTML string');
                    }
                }
            }

            if (languages.length > 0) {
                this.renderSidebarLanguages(languages);
            } else {
                console.warn('[ScraperIntegration] Scraped 0 languages from the home page');
                window.scrapedLanguages = [];
                if (typeof renderSidebarLanguages === 'function') renderSidebarLanguages();
            }
        } catch (error) {
            console.error('[ScraperIntegration] Error fetching languages:', error);
            window.scrapedLanguages = [];
            if (typeof renderSidebarLanguages === 'function') renderSidebarLanguages();
        }
    }

    /**
     * Render scraped languages into the sidebar
     * @param {Array} languages - Array of { name, url }
     */
    renderSidebarLanguages(languages) {
        const languagesList = document.getElementById('languagesList');
        const languagesCount = document.getElementById('languagesCount');

        if (!languagesList) return;

        // Store globally for other filters
        window.scrapedLanguages = languages;

        if (this.config.debug) console.log(`[ScraperIntegration] Rendering ${languages.length} scraped languages`);

        let html = '';
        languages.forEach(lang => {
            const safeName = lang.name.replace(/'/g, "\\'");
            const safeUrl = lang.url.replace(/'/g, "\\'");

            html += `
                <a href="javascript:void(0)" class="sidebar-item" 
                   data-type="language"
                   onclick="scraperIntegration.handleLanguageFilter('${safeName}', '${safeUrl}'); return false;">
                    <i class="fas fa-language"></i>
                    <span>${lang.name}</span>
                </a>
            `;
        });

        languagesList.innerHTML = html;
        if (languagesCount) languagesCount.textContent = languages.length.toString();

        if (this.config.debug) console.log(`[ScraperIntegration] Populated ${languages.length} languages in sidebar`);
    }

    /**
     * Fetch genres from source site and populate sideboard
     */
    async fetchAndPopulateGenres() {
        try {
            const fetchUrl = this.scraperEngine.baseScrapingURL || this.config.baseScrapingURL;
            if (this.config.debug) console.log('[ScraperIntegration] Fetching genres from: ' + fetchUrl);

            if (!fetchUrl) return;

            // Try to load from localStorage first
            const cachedGenres = localStorage.getItem('scrapedGenres');
            if (cachedGenres) {
                try {
                    const parsed = JSON.parse(cachedGenres);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.renderSidebarGenres(parsed);
                        this.renderCategoryPills(parsed);
                        if (this.config.debug) console.log('[ScraperIntegration] Loaded genres from cache');
                    }
                } catch (e) {
                    console.error('Error parsing cached genres', e);
                }
            }

            // Fetch home page to get genres grid
            // We only fetch if we are on the base URL or if we don't have cached genres
            // But to keep it fresh, we might want to fetch always, but only update if successful
            const html = await this.scraperEngine.fetchHTML(fetchUrl, true);

            if (!html || html.length < 100) return;

            const doc = new DOMParser().parseFromString(html, 'text/html');
            const genres = this.scraperEngine.scrapeGenres(doc);

            if (this.config.debug) {
                console.log(`[ScraperIntegration] Found ${genres.length} genres from source`);
            }

            if (genres.length > 0) {
                this.renderSidebarGenres(genres);
                this.renderCategoryPills(genres);
                localStorage.setItem('scrapedGenres', JSON.stringify(genres));
            } else if (!cachedGenres) {
                // If no genres found and no cache, maybe handle empty state?
                // For now, we leave it as is (loading state or empty)
            }
        } catch (error) {
            console.error('[ScraperIntegration] Error fetching genres:', error);
        }
    }

    /**
     * Render scraped genres into the sidebar
     * @param {Array} genres - Array of { name, url }
     */
    renderSidebarGenres(genres) {
        const categoriesList = document.getElementById('categoriesList');
        const categoriesCount = document.getElementById('categoriesCount');

        if (!categoriesList) return;

        // Store globally
        window.scrapedGenres = genres;

        // Also save to local storage for persistence across navigations
        localStorage.setItem('scrapedGenres', JSON.stringify(genres));

        if (this.config.debug) console.log(`[ScraperIntegration] Rendering ${genres.length} scraped genres`);

        let html = '';
        genres.forEach(genre => {
            const safeName = genre.name.replace(/'/g, "\\'");
            const safeUrl = genre.url.replace(/'/g, "\\'");

            html += `
                <a href="javascript:void(0)" class="sidebar-item" 
                   data-type="category"
                   data-filter="${safeName}"
                   onclick="scraperIntegration.handleCategoryFilter('${safeName}', '${safeUrl}'); return false;">
                    <i class="fas fa-film"></i>
                    <span>${genre.name}</span>
                </a>
            `;
        });

        categoriesList.innerHTML = html;
        if (categoriesCount) categoriesCount.textContent = genres.length.toString();
    }

    /**
     * Fetch top categories from source site and populate sideboard
     */
    async fetchAndPopulateTopCategories() {
        try {
            const fetchUrl = this.scraperEngine.baseScrapingURL || this.config.baseScrapingURL;
            if (this.config.debug) console.log(`[ScraperIntegration] Fetching top categories from: ${fetchUrl}`);

            const html = await this.scraperEngine.fetchHTML(fetchUrl, true);
            if (!html || html.length < 100) {
                console.warn('[ScraperIntegration] Failed to fetch home page for top categories (empty response)');
                return;
            }

            const doc = new DOMParser().parseFromString(html, 'text/html');
            const categories = this.scraperEngine.scrapeTopCategories(doc);

            if (this.config.debug) console.log(`[ScraperIntegration] Scraped ${categories.length} top categories`);

            if (categories && categories.length > 0) {
                this.renderSidebarTopCategories(categories);
            } else {
                console.warn('[ScraperIntegration] No top categories found in .cat-box');
                const topCatsList = document.getElementById('topCategoriesList');
                if (topCatsList) topCatsList.innerHTML = '<div class="sidebar-info-text">No categories found.</div>';
            }
        } catch (error) {
            console.error('[ScraperIntegration] Error populating top categories:', error);
        }
    }

    /**
     * Render scraped top categories into the sidebar
     * @param {Array} categories - Array of { name, url }
     */
    renderSidebarTopCategories(categories) {
        const topCategoriesList = document.getElementById('topCategoriesList');
        const topCategoriesCount = document.getElementById('topCategoriesCount');
        const topCategoriesSection = document.getElementById('topCategoriesSection');

        if (!topCategoriesList) return;

        if (this.config.debug) console.log(`[ScraperIntegration] Rendering ${categories.length} top categories`);

        let html = '';
        categories.forEach(cat => {
            // SKIP HOME and 18+ as they are hardcoded in the primary sidebar section
            const upperName = cat.name.toUpperCase();
            if (upperName.includes('HOME') || upperName.includes('18+')) return;

            const safeName = cat.name.replace(/'/g, "\\'");
            const safeUrl = cat.url.replace(/'/g, "\\'");

            html += `
                <a href="javascript:void(0)" class="sidebar-item" 
                   data-type="top-category"
                   data-filter="${safeName}"
                   onclick="scraperIntegration.handleTopCategoryFilter('${safeName}', '${safeUrl}'); return false;">
                    <i class="fas fa-th-list"></i>
                    <span>${cat.name}</span>
                </a>
            `;
        });

        topCategoriesList.innerHTML = html;
        if (topCategoriesCount) topCategoriesCount.textContent = categories.length.toString();
        if (topCategoriesSection) topCategoriesSection.style.display = 'block';
    }

    /**
     * Render scraped genres into the category pills section
     * @param {Array} genres - Array of { name, url }
     */
    renderCategoryPills(genres) {
        const container = document.getElementById('categoryPills');
        if (!container) return;

        // Start with "All" pill
        let html = `
            <button class="category-pill active" id="pill-all"
                    onclick="scraperIntegration.resetScraping(); return false;">
                <i class="fas fa-th-large"></i>
                All
            </button>
        `;

        genres.forEach(genre => {
            const safeName = genre.name.replace(/'/g, "\\'");
            const safeUrl = genre.url.replace(/'/g, "\\'");

            html += `
                <button class="category-pill" 
                        onclick="scraperIntegration.handleCategoryFilter('${safeName}', '${safeUrl}')">
                    <i class="fas fa-tags"></i>
                    ${genre.name}
                </button>
            `;
        });

        container.innerHTML = html;

        // Sync with current filter if applicable
        if (typeof currentFilter !== 'undefined' && typeof currentFilterType !== 'undefined' && currentFilterType === 'category') {
            this.updateActiveCategoryPill(currentFilter);
        } else {
            this.updateActiveCategoryPill(null); // Default to "All"
        }
    }

    /**
     * Update active state for category pills
     * @param {string} name - Selected category name (null for "All")
     */
    updateActiveCategoryPill(name) {
        const pills = document.querySelectorAll('#categoryPills .category-pill');
        const allPill = document.getElementById('pill-all');

        pills.forEach(pill => {
            if (!name || name === 'all') {
                if (pill === allPill) pill.classList.add('active');
                else pill.classList.remove('active');
            } else {
                const pillText = pill.textContent.trim();
                if (pillText === name) {
                    pill.classList.add('active');
                } else {
                    pill.classList.remove('active');
                }
            }
        });
    }

    /**
     * Handle language filter click - Triggers dynamic category scraping
     * @param {string} name - Language name
     * @param {string} url - Category URL
     */
    async handleLanguageFilter(name, url) {
        if (this.isLoading) return;

        console.log(`[ScraperIntegration] Filtering by language: ${name} (${url})`);

        // Reset and switch to Home tab
        if (typeof resetYouTubeGrid === 'function') resetYouTubeGrid();
        await this.handleCategoryFilter(name, url, 'language');
    }

    /**
     * Handle category/genre filter click
     * @param {string} name - Category name
     * @param {string} url - Category URL
     * @param {string} type - Source type ('category', 'top-category', 'language', 'adult')
     */
    async handleCategoryFilter(name, url, type = 'category') {
        // If it's HOME, just reset
        if (name.toUpperCase().includes('HOME')) {
            this.resetScraping();
            return;
        }
        if (this.isLoading) return;

        console.log(`[ScraperIntegration] Filtering by category: ${name} (${url})`);

        // Reset and switch to Home tab
        if (typeof resetYouTubeGrid === 'function') resetYouTubeGrid();
        if (typeof setActiveTab === 'function') setActiveTab('home');

        // Restore sections (respect hasActiveSliders for slider visibility)
        const sliderSection = document.getElementById('sliderSection');
        const categorySection = document.getElementById('categorySection');
        if (sliderSection) {
            // Only show slider if hasActiveSliders is true
            const hasSliders = typeof window.hasActiveSliders !== 'undefined' ? window.hasActiveSliders : false;
            sliderSection.style.display = hasSliders ? 'block' : 'none';
        }
        if (categorySection) categorySection.style.display = 'block';

        // Update pill highlighting
        this.updateActiveCategoryPill(name);

        // Sync sidebar
        if (typeof updateActiveSidebarItem === 'function') {
            if (!name || name === 'all') {
                updateActiveSidebarItem('all', 'home');
            } else {
                updateActiveSidebarItem(name, type);
            }
        }

        // Update Section Title
        const sectionTitle = document.getElementById('sectionTitle');
        if (sectionTitle) {
            sectionTitle.textContent = name;
        }

        // Auto-expand relevant sidebar section with mutual collapse
        const expandSection = (headerId) => {
            const header = document.getElementById(headerId);
            if (!header) return;

            if (typeof window.toggleSidebarSection === 'function') {
                // Only toggle if not already active to avoid collapsing it if it was already open
                if (!header.classList.contains('active')) {
                    window.toggleSidebarSection(header);
                }
            } else {
                header.classList.add('active');
            }
        };

        if (type === 'top-category') {
            expandSection('topCategoriesHeader');
        } else if (type === 'language') {
            expandSection('languagesHeader');
        } else if (type === 'category') {
            expandSection('categoriesHeader');
        }

        // Clear existing movies and grid
        if (typeof allMovies !== 'undefined') {
            allMovies.length = 0;
        }

        const moviesGrid = document.getElementById('moviesGrid');
        if (moviesGrid) {
            moviesGrid.innerHTML = '';
            this.showSkeletonGrid(moviesGrid, 15);
        }

        this.isLoading = true;

        // Reset scraping state for the new category
        this.cardScrapingState.currentPage = 1;
        this.cardScrapingState.totalLoaded = 0;
        this.cardScrapingState.isActive = true;
        this.cardScrapingState.categoryUrl = url;
        this.scrapedPages.clear();

        try {
            // First page scrape
            const cards = await this.scrapeMovieCards(1, url);

            this.hideSkeletons(moviesGrid);

            if (cards.length === 0) {
                if (moviesGrid) moviesGrid.innerHTML = '<div class="no-results">No movies found in this category.</div>';
                this.isLoading = false;
                return;
            }

            // Global movies update
            if (typeof allMovies !== 'undefined' && Array.isArray(allMovies)) {
                allMovies.length = 0;
                allMovies.push(...cards);
            }
            // Render
            if (typeof renderMovieCards === 'function') {
                renderMovieCards(cards);
            } else {
                const fragment = document.createDocumentFragment();
                cards.forEach((cardData, index) => {
                    const card = this.createMovieCard(cardData, 1, index);
                    fragment.appendChild(card);
                });
                if (moviesGrid) moviesGrid.appendChild(fragment);
            }

            // Scroll to top of grid
            window.scrollTo({ top: 0, behavior: 'smooth' });

            this.cardScrapingState.totalLoaded = cards.length;
            this.cardScrapingState.currentPage = 2; // Next page

            // Close sidebar on mobile
            if (typeof closeSidebar === 'function') closeSidebar();

        } catch (error) {
            console.error('[ScraperIntegration] Error in handleCategoryFilter:', error);
            this.hideSkeletons(moviesGrid);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Handle 18+ filter click
     */
    async handle18PlusFilter() {
        const fetchUrl = this.scraperEngine.baseScrapingURL || this.config.baseScrapingURL;
        const adultUrl = this.scraperEngine.resolveRelativeURL('/adult18plus', fetchUrl);
        const name = '18+ Adult';

        // Sync sidebar
        if (typeof updateActiveSidebarItem === 'function') {
            updateActiveSidebarItem('adult', 'adult');
        }

        await this.handleCategoryFilter(name, adultUrl, 'adult');
    }

    /**
     * Handle top category filter click
     * @param {string} name - Category name
     * @param {string} url - Category URL
     */
    async handleTopCategoryFilter(name, url) {
        // If it's HOME, just reset
        if (name.toUpperCase().includes('HOME')) {
            this.resetScraping();
            return;
        }

        // Sync sidebar for top-category type
        if (typeof updateActiveSidebarItem === 'function') {
            updateActiveSidebarItem(name, 'top-category');
        }

        await this.handleCategoryFilter(name, url, 'top-category');
    }

    /**
     * ============================================
     * MOVIE CARD SCRAPING FUNCTIONALITY
     * ============================================
     */

    /**
     * Scrape movie cards from a specific URL or base URL
     * @param {number} pageNumber - Page number to scrape (default: 1)
     * @param {string} customBaseUrl - Optional custom URL to use as base (e.g., for categories)
     * @returns {Promise<Array>} - Array of movie card objects
     */
    async scrapeMovieCards(pageNumber = 1, customBaseUrl = null) {
        try {
            if (this.config.debug) {
                console.log(`[ScraperIntegration] Scraping movie cards from page ${pageNumber} (Base: ${customBaseUrl || this.config.baseScrapingURL})`);
            }

            // Construct URL
            let baseUrl = (customBaseUrl || this.config.baseScrapingURL).replace(/\/$/, '');
            let url = baseUrl;

            if (pageNumber > 1) {
                url = `${baseUrl}/page/${pageNumber}/`;
            }

            // Fetch HTML
            const html = await this.scraperEngine.fetchHTML(url, false);

            // Extract movie cards and pagination
            // We pass scraperEngine to cardExtractor so it can call scrapePagination internally
            const result = this.cardExtractor.extractMovieCards(html, this.scraperEngine);
            const cards = result.movieCards || [];
            const pagination = result.pagination;

            if (this.config.debug) {
                console.log(`[ScraperIntegration] Extracted ${cards.length} movie cards and pagination from page ${pageNumber}`);
            }

            // Inject pagination if found
            if (pagination && pagination.pages && pagination.pages.length > 0) {
                this.injectPagination(pagination);

                // Track already scraped page (the current one)
                if (pagination.currentPage) {
                    // For the initial page (usually page 1), we mark it as scraped
                    // The cards are already in the DOM (or will be shortly)
                    // We'll use a placeholder ID for the first card of page 1 if needed
                    // For now, tracking page 1 is good for visual state
                    if (!this.scrapedPages.has(pagination.currentPage)) {
                        this.scrapedPages.set(pagination.currentPage, 'moviesGrid'); // Just point to the grid for page 1
                    }
                }
            }

            return cards;
        } catch (error) {
            console.error('[ScraperIntegration] Error scraping movie cards:', error);
            return [];
        }
    }

    /**
     * Clear pagination cache
     * Called when category, language, or search filter changes
     * to force re-scraping of pagination with new context
     */
    clearPaginationCache() {
        this.scrapedPages.clear();
        if (this.config.debug) {
            console.log('[ScraperIntegration] Pagination cache cleared');
        }
    }

    /**
     * Start auto-loading movie cards
     * @param {number} startPage - Starting page number
     */
    async startCardScraping(startPage = 1) {
        if (this.cardScrapingState.isActive) {
            if (this.config.debug) {
                console.log('[ScraperIntegration] Card scraping already active');
            }
            return;
        }

        this.cardScrapingState.isActive = true;
        this.cardScrapingState.isPaused = false;
        this.cardScrapingState.currentPage = startPage;

        if (this.config.debug) {
            console.log('[ScraperIntegration] Starting card scraping from page', startPage);
        }

        // Show skeletons immediately if we are starting from page 1 (initial load/reset)
        if (startPage === 1) {
            const moviesGrid = document.getElementById('moviesGrid');
            if (moviesGrid) {
                moviesGrid.innerHTML = '';
                this.showSkeletonGrid(moviesGrid, 15);
            }
        }

        await this.continueCardScraping();
    }

    /**
     * Continue scraping movie cards (used for auto-load)
     */
    async continueCardScraping() {
        if (!this.cardScrapingState.isActive || this.cardScrapingState.isPaused || this.cardScrapingState.isFetchingCards) {
            return;
        }

        this.cardScrapingState.isFetchingCards = true;
        const currentResetToken = this.resetToken;

        // Get grid and show skeletons only if not already showing many
        // (If we are starting a fresh page, skeletons are already handled by startCardScraping/handleCategoryFilter)
        const moviesGrid = document.getElementById('moviesGrid');
        if (moviesGrid && this.cardScrapingState.currentPage > 1) {
            this.showSkeletonGrid(moviesGrid, 8);
        }

        try {
            const cards = await this.scrapeMovieCards(
                this.cardScrapingState.currentPage,
                this.cardScrapingState.categoryUrl || null
            );

            // Hide skeletons after fetch
            if (moviesGrid) {
                this.hideSkeletons(moviesGrid);
            }

            // RACE CONDITION FIX: Check if we are still active AND if this is still the valid reset batch
            if (!this.cardScrapingState.isActive || this.cardScrapingState.isPaused || currentResetToken !== this.resetToken) {
                if (this.config.debug) console.log('[ScraperIntegration] Scraping stopped/paused or stale batch during fetch, aborting render');
                return;
            }

            if (cards.length === 0) {
                // No more cards found
                this.stopCardScraping();

                // Trigger "all movies loaded" UI
                if (typeof showAllMoviesLoaded === 'function') {
                    showAllMoviesLoaded();
                }
                return;
            }

            // Add cards to the global movies array if it exists
            if (typeof allMovies !== 'undefined' && Array.isArray(allMovies)) {
                allMovies.push(...cards);
            }

            // Render cards to the UI
            if (typeof renderMovieCards === 'function') {
                renderMovieCards(cards);
            } else {
                const fragment = document.createDocumentFragment();
                cards.forEach((cardData, index) => {
                    const card = this.createMovieCard(cardData, this.cardScrapingState.currentPage - 1, this.cardScrapingState.totalLoaded + index);
                    fragment.appendChild(card);
                });
                if (moviesGrid) moviesGrid.appendChild(fragment);
            }

            this.cardScrapingState.totalLoaded += cards.length;
            this.cardScrapingState.currentPage++;

            if (this.config.debug) {
                console.log(`[ScraperIntegration] Loaded ${cards.length} cards. Total: ${this.cardScrapingState.totalLoaded}`);
            }
        } catch (error) {
            console.error('[ScraperIntegration] Error in continueCardScraping:', error);
            // Cleanup skeletons on error
            if (moviesGrid) this.hideSkeletons(moviesGrid);
            this.stopCardScraping();
        } finally {
            this.cardScrapingState.isFetchingCards = false;
        }
    }

    /**
     * Pause card scraping (e.g., when user clicks a movie)
     */
    pauseCardScraping() {
        if (this.cardScrapingState.isActive && !this.cardScrapingState.isPaused) {
            this.cardScrapingState.isPaused = true;

            if (this.config.debug) {
                console.log('[ScraperIntegration] Card scraping paused');
            }
        }
    }

    /**
     * Resume card scraping
     */
    async resumeCardScraping() {
        if (this.cardScrapingState.isActive && this.cardScrapingState.isPaused) {
            this.cardScrapingState.isPaused = false;

            if (this.config.debug) {
                console.log('[ScraperIntegration] Card scraping resumed');
            }

            await this.continueCardScraping();
        }
    }

    /**
     * Stop card scraping completely
     */
    stopCardScraping() {
        this.cardScrapingState.isActive = false;
        this.cardScrapingState.isPaused = false;

        if (this.config.debug) {
            console.log('[ScraperIntegration] Card scraping stopped');
        }
    }

    /**
     * Load more movie cards (for infinite scroll)
     * @returns {Promise<boolean>} - True if more cards were loaded
     */
    async loadMoreCards() {
        if (this.cardScrapingState.isPaused) {
            if (this.config.debug) {
                console.log('[ScraperIntegration] Scraping is paused, skipping loadMoreCards');
            }
            return false;
        }

        await this.continueCardScraping();
        return this.cardScrapingState.isActive;
    }

    /**
     * ============================================
     * PAGINATION HANDLING
     * ============================================
     */

    /**
     * Inject pagination controls into the page
     * @param {Object} paginationData - Pagination data from scraper
     */
    injectPagination(paginationData) {
        const container = document.getElementById('paginationContainer');
        if (!container) {
            console.warn('[ScraperIntegration] Pagination container not found');
            return;
        }

        if (!paginationData || !paginationData.pages || paginationData.pages.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = '';

        // Build pagination HTML
        let html = '<nav class="pagination-nav" aria-label="Movie pages"><ul class="pagination-list">';

        paginationData.pages.forEach((page, index) => {
            const isActive = page.isActive;
            const isDisabled = page.isDisabled;
            const classes = ['pagination-btn'];

            if (isActive) classes.push('active');
            if (isDisabled) classes.push('disabled');

            // Check if this page has been scraped
            const pageNumber = page.pageNumber;
            if (pageNumber && this.scrapedPages.has(pageNumber)) {
                classes.push('scraped');
            }

            const pageDisplay = page.label;
            const dataAttr = pageNumber ? `data-page-number="${pageNumber}"` : '';

            html += `
                <li class="pagination-item">
                    <button 
                        class="${classes.join(' ')}"
                        ${dataAttr}
                        data-url="${page.url || ''}"
                        ${isDisabled ? 'disabled' : ''}
                        onclick="scraperIntegration.handlePageClick(this)"
                    >
                        ${pageDisplay}
                    </button>
                </li>
            `;
        });

        html += '</ul></nav>';
        container.innerHTML = html;

        if (this.config.debug) {
            console.log('[ScraperIntegration] Injected pagination:', paginationData);
        }
    }

    /**
     * Handle pagination button click
     * @param {HTMLElement} button - The clicked pagination button
     */
    async handlePageClick(button) {
        const pageNumber = parseInt(button.getAttribute('data-page-number'));
        const url = button.getAttribute('data-url');

        if (!pageNumber || !url) {
            console.warn('[ScraperIntegration] Invalid pagination data');
            return;
        }

        // Scrape new page
        console.log(`[ScraperIntegration] Scraping page ${pageNumber}...`);

        // Show loading indicator
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        // Get grid
        const moviesGrid = document.getElementById('moviesGrid');
        if (!moviesGrid) {
            console.error('[ScraperIntegration] Movies grid not found');
            button.disabled = false;
            button.innerHTML = originalText;
            return;
        }

        // NEW: Clear grid and show skeletons immediately
        moviesGrid.innerHTML = '';
        this.showSkeletonGrid(moviesGrid, 15);

        // Scroll to top of grid area for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            // Fetch page HTML
            const html = await this.scraperEngine.fetchHTML(url, false);

            // Extract movie cards and pagination from the new page
            const result = this.cardExtractor.extractMovieCards(html, this.scraperEngine);

            if (!result || !result.movieCards || result.movieCards.length === 0) {
                console.warn(`[ScraperIntegration] No cards found on page ${pageNumber}`);
                this.hideSkeletons(moviesGrid);
                button.innerHTML = 'No cards!';
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 2000);
                return;
            }

            // Hide skeletons
            this.hideSkeletons(moviesGrid);

            // Inject movie cards (Clear again just to be sure)
            moviesGrid.innerHTML = '';

            // Global movies update
            if (typeof allMovies !== 'undefined' && Array.isArray(allMovies)) {
                allMovies.length = 0;
                allMovies.push(...result.movieCards);
            }

            // Use global renderer if available for consistent styling (handles quality, language, etc.)
            if (typeof renderMovieCards === 'function') {
                renderMovieCards(result.movieCards);
            } else {
                result.movieCards.forEach((card, index) => {
                    const cardElement = this.createMovieCard(card, pageNumber, index);
                    moviesGrid.appendChild(cardElement);
                });
            }

            // Update internal state
            this.cardScrapingState.currentPage = pageNumber + 1;

            // Update scraped pages tracking (clear old ones for true paged view)
            this.scrapedPages.clear();
            const firstCardId = `scraped-card-${pageNumber}-0`;
            this.scrapedPages.set(pageNumber, firstCardId);

            // Update pagination if available
            if (result.pagination) {
                this.injectPagination(result.pagination);
            }

            button.innerHTML = originalText;
            button.disabled = false;

            console.log(`[ScraperIntegration] Successfully scraped ${result.movieCards.length} cards from page ${pageNumber}`);

        } catch (error) {
            console.error(`[ScraperIntegration] Error scraping page ${pageNumber}:`, error);
            this.hideSkeletons(moviesGrid);
            button.innerHTML = 'Error!';
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 2000);
        }
    }

    /**
     * Create a movie card element from scraped data
     * @param {Object} cardData - Movie card data
     * @param {number} pageNumber - Page number
     * @param {number} index - Card index on page
     * @returns {HTMLElement} - Movie card element
     */
    createMovieCard(cardData, pageNumber, index) {
        const cardId = `scraped-card-${pageNumber}-${index}`;
        const card = document.createElement('div');
        card.className = 'movie-card animate-fade-in';
        card.id = cardId;
        card.setAttribute('data-page-number', pageNumber);
        card.setAttribute('data-post-url', cardData.post_url || '');
        card.setAttribute('data-share-id', cardData.share_Id || ''); // Shareable ID


        // Build card HTML
        card.innerHTML = `
            <div class="movie-poster">
                <img src="${cardData.imageUrl || LAZY_LOADING_GIF}" 
                     alt="${cardData.title || 'Movie'}" 
                     class="lazy-load"
                     onerror="this.src='${LAZY_LOADING_GIF}'">
                ${cardData.badge ? `<span class="movie-badge">${cardData.badge}</span>` : ''}
            </div>
            <div class="movie-details">
                <h3 class="movie-title">${cardData.title || 'Unknown Title'}</h3>
                ${cardData.subtitle ? `<p class="movie-subtitle">${cardData.subtitle}</p>` : ''}
            </div>
        `;

        // Add click event to trigger scraping
        card.addEventListener('click', () => {
            if (cardData.post_url) {
                this.handleMoviePosterClick(card);
            }
        });

        return card;
    }

    /**
     * Reset scraping to base URL (Home view)
     */
    async resetScraping() {
        if (this.isLoading) return;

        console.log('[ScraperIntegration] Resetting scraping to home view');
        this.isLoading = true;
        this.resetToken++; // Increment token for this reset attempt
        const currentResetToken = this.resetToken;

        // Reset state
        this.cardScrapingState.currentPage = 1;
        this.cardScrapingState.totalLoaded = 0;
        this.cardScrapingState.isActive = true;
        this.cardScrapingState.categoryUrl = null;
        this.scrapedPages.clear();

        const moviesGrid = document.getElementById('moviesGrid');
        if (moviesGrid) {
            moviesGrid.innerHTML = '';
            this.showSkeletonGrid(moviesGrid, 15);
        }

        // Deactivate pills on reset
        this.updateActiveCategoryPill(null);

        // Sync sidebar
        if (typeof updateActiveSidebarItem === 'function') {
            updateActiveSidebarItem('all', 'home');
        }

        try {
            const cards = await this.scrapeMovieCards(1);

            // RACE CONDITION FIX: Check if we are still active AND if this is still the current reset attempt
            if (!this.cardScrapingState.isActive || this.cardScrapingState.isPaused || currentResetToken !== this.resetToken) {
                if (this.config.debug) console.log('[ScraperIntegration] Scraping stopped, paused, or newer reset started during fetch, aborting');
                return;
            }

            this.hideSkeletons(moviesGrid);

            if (typeof allMovies !== 'undefined' && Array.isArray(allMovies)) {
                allMovies.length = 0;
                allMovies.push(...cards);
            }

            if (typeof renderMovieCards === 'function') {
                renderMovieCards(cards);
            } else if (typeof createMovieCard === 'function') {
                cards.forEach((card, index) => createMovieCard(card, index));
            }

            this.cardScrapingState.totalLoaded = cards.length;
            this.cardScrapingState.currentPage = 2;
        } catch (error) {
            console.error('[ScraperIntegration] Error in resetScraping:', error);
            this.hideSkeletons(moviesGrid);
        } finally {
            this.isLoading = false;
        }
    }
}

// Global instance
window.scraperIntegration = new ScraperIntegration();