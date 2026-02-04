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

        // Movie card scraping state
        this.cardScrapingState = {
            isActive: false,
            isPaused: false,
            currentPage: 1,
            totalLoaded: 0,
            batchSize: 20
        };

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
                console.log('[ScraperIntegration] Config loaded from object:', this.config.baseScrapingURL);
            } else if (Array.isArray(data)) {
                // If it's an array, look for baseScrapingURL in a metadata object if it exists? 
                // Mostly likely it's just an array, so we stick to default or look for a special item.
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
            const movieId = movieCard.getAttribute('data-id');
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
                }
            });

            this.isLoading = false;

            if (!result.success && !signal.aborted) {
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
                this.injectError("An unexpected error occurred: " + error.message);
            }
        }
    }

    async getMovieData(movieId) {
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
        let html = '';

        if (data.header) {
            html += '<div class="text-center mb-4">';
            if (data.header.h3) html += `<h3 class="text-success fw-bold mb-1">${data.header.h3}</h3>`;
            if (data.header.h5) html += `<h5 class="text-warning-light mb-2">${data.header.h5}</h5>`;
            if (data.header.attention) html += `<div class="badge-warning guide-badge mb-2">${data.header.attention}</div>`;
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
                <div class="notice-text">
                    <span class="text-info fw-bold">${data.unzipGuide.text}</span>
                    <a href="${data.unzipGuide.href}" class="text-light text-decoration-underline ms-2">Click Here</a>
                </div>
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
        let html = '';

        data.headers.forEach(header => {
            if (header.level === 3) html += `<h3 class="text-success fw-bold text-center mb-3">${header.text}</h3>`;
            else if (header.level === 4) html += `<h4 class="text-warning-light fw-semibold text-center mb-3">${header.text}</h4>`;
        });

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

    appendDownloadOption(card) {
        const container = document.getElementById('downloadOptions');
        if (!container) return;

        // Clear loading spinner if this is the first card being added
        if (this._isFirstCard) {
            container.innerHTML = '';
            this._isFirstCard = false;
        }

        let cardHtml = `<div class="download-server animate-fade-in ${card.isNew ? 'is-new-added' : ''}">`;

        cardHtml += `
            <div class="server-title">
                <div class="server-info">
                    <i class="${card.icon?.class || 'fas fa-server'}"></i>
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
            // Show unlock UI in the dialog
            this.showScraperDialog("Link Locked", false);
            const body = document.getElementById('scraperDialogBody');
            const adCount = (typeof adCounts !== 'undefined' ? (adCounts[serverKey] || 0) : 0);
            const reqAds = typeof requiredAds !== 'undefined' ? requiredAds : 3;
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
                            onclick="scraperIntegration.processScraperUnlock('${currentMovie}', '${serverKey}', '${url}', this)">
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

    async processScraperUnlock(movieId, serverKey, originalUrl, button) {
        console.log('[ScraperIntegration] processScraperUnlock called:', { movieId, serverKey, originalUrl });

        if (typeof processAdUnlock !== 'function') {
            console.error("[ScraperIntegration] Ad Unlock function not found");
            return;
        }

        const reqAds = typeof requiredAds !== 'undefined' ? requiredAds : 3;
        const serverName = 'DynamicLink';

        try {
            console.log('[ScraperIntegration] Starting ad unlock process...');

            // Set flag to prevent modal reload during scraping
            this.isProcessingScraping = true;

            // Pass the custom key to processAdUnlock
            await processAdUnlock(movieId, serverName, reqAds, button, serverKey);

            console.log('[ScraperIntegration] Ad unlock completed, checking unlock status...');

            // Check if fully unlocked
            const sessionUnlocked = JSON.parse(sessionStorage.getItem('unlockedServers') || '{}');
            const localStorageUnlocked = JSON.parse(localStorage.getItem('unlockedServers') || '{}');
            const allUnlocked = { ...localStorageUnlocked, ...sessionUnlocked };

            console.log('[ScraperIntegration] Unlock status:', { serverKey, isUnlocked: !!allUnlocked[serverKey] });

            if (allUnlocked[serverKey]) {
                console.log('[ScraperIntegration] Link unlocked! Starting deep scraping...');

                // Success! Now trigger the deep scraping directly (avoid recursive call)
                if (this.abortController) this.abortController.abort();
                this.abortController = new AbortController();
                const signal = this.abortController.signal;

                // Open safe tab immediately
                let targetWindow = null;
                if (typeof detectTelegramMiniApp === 'undefined' || !detectTelegramMiniApp()) {
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
                <div class="loading text-center p-4">
                    <div class="loading-spinner mb-2"></div>
                    <p>Fetching download options...</p>
                </div>
            `;
        }
    }

    injectError(msg) {
        const container = document.getElementById('downloadOptions');
        if (container) container.innerHTML = `<div class="text-center text-danger p-4"><i class="fas fa-exclamation-circle"></i> ${msg}</div>`;
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

    /**
     * ============================================
     * MOVIE CARD SCRAPING FUNCTIONALITY
     * ============================================
     */

    /**
     * Scrape movie cards from base URL
     * @param {number} pageNumber - Page number to scrape (default: 1)
     * @returns {Promise<Array>} - Array of movie card objects
     */
    async scrapeMovieCards(pageNumber = 1) {
        try {
            if (this.config.debug) {
                console.log(`[ScraperIntegration] Scraping movie cards from page ${pageNumber}`);
            }

            // Construct URL for pagination
            let url = this.config.baseScrapingURL;
            if (pageNumber > 1) {
                url += `/page/${pageNumber}/`;
            }

            // Fetch HTML
            const html = await this.scraperEngine.fetchHTML(url, false);

            // Extract movie cards
            const cards = this.cardExtractor.extractMovieCards(html);

            if (this.config.debug) {
                console.log(`[ScraperIntegration] Extracted ${cards.length} movie cards from page ${pageNumber}`);
            }

            return cards;
        } catch (error) {
            console.error('[ScraperIntegration] Error scraping movie cards:', error);
            return [];
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

        await this.continueCardScraping();
    }

    /**
     * Continue scraping movie cards (used for auto-load)
     */
    async continueCardScraping() {
        if (!this.cardScrapingState.isActive || this.cardScrapingState.isPaused) {
            return;
        }

        try {
            const cards = await this.scrapeMovieCards(this.cardScrapingState.currentPage);

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
            } else if (typeof createMovieCard === 'function') {
                cards.forEach((card, index) => createMovieCard(card, this.cardScrapingState.totalLoaded + index));
            }

            this.cardScrapingState.totalLoaded += cards.length;
            this.cardScrapingState.currentPage++;

            if (this.config.debug) {
                console.log(`[ScraperIntegration] Loaded ${cards.length} cards. Total: ${this.cardScrapingState.totalLoaded}`);
            }
        } catch (error) {
            console.error('[ScraperIntegration] Error in continueCardScraping:', error);
            this.stopCardScraping();
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
}

// Global instance
window.scraperIntegration = new ScraperIntegration();