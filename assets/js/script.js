<!-- Firebase Configuration -->

        // Firebase Configuration (মক ফাংশন)
        const firebaseConfig = {}; // মক কনফিগারেশন
        
        // Global Variables
        let db = null;
        let realtimeDb = null;
        let lastVisible = null;
        let downloadServers = [];
        let globalDomains = [];
        let unlockedMovies = {};
        let currentMovieId = null;
        let movieViews = {};
        let dailyViews = {};
        let adsConfig = {
            ads1: { enabled: true, code: '' },
            ads2: { enabled: true, code: '' },
            ads3: { enabled: true, code: '' },
            ads4: { enabled: true, code: '' },
            ads5: { enabled: true, code: '' },
            ads6: { enabled: true, code: '' }
        };
        let monetagSDKLoaded = false;
        let currentLanguage = localStorage.getItem('movieAppLanguage') || 'en';
        let siteConfig = {
            siteName: "Dub Fusion Hub",
            siteLogoUrl: "",
            showLogo: false,
            placeholderImage: "https://via.placeholder.com/300x450/1a1a2e/ffffff?text=No+Image",
            enablePosterBlur: false,
            blurPercentage: 10,
            showInfo5Views: true
        };
        
        // Affiliate System Variables
        let affiliateLinks = [];
        let affiliateConfig = {
            enabled: true,
            redirectDelay: 2000,
            openInNewTab: true,
            randomSelection: true
        };
        
        // Connection Management Variables
        let isOnline = navigator.onLine;
        let connectionCheckInterval = null;
        let lastUpdateCheck = 0;
        let autoUpdateEnabled = false; // JSON ব্যবহার করায় অটো আপডেট বন্ধ
        
        // Download System Variables
        let downloadQueue = [];
        let activeDownloads = 0;
        let maxParallelDownloads = 2;
        
        // Slider variables
        let sliderInterval = null;
        let currentSlide = 0;
        let sliderItems = [];
        let sliderInitialized = false;
        let currentSwiper = null;
        
        // Ad unlock system variables
        let timerDuration = 10;
        let requiredAds = 3;
        let adCounts = {};
        
        // Unlock expiry system
        let unlockExpiryDays = 2;
        let movieUnlockTimestamps = {};
        
        // Download link generation variables
        let linkGenerators = [];
        let linkPatterns = [];
        let fileExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
        
        // File Size Database Variables
        let fileSizesCache = {};
        let fileSizeConfig = {
            defaultSizes: {
                '480p': '700MB',
                '720p': '1.5GB',
                '1080p': '3GB',
                '4K': '10GB',
                'WEB-DL': '2GB',
                'BluRay': '4GB',
                'HDTV': '1.2GB',
                'HD': '1GB',
                'SD': '500MB'
            },
            sizeMapping: {}
        };
        
        // Sidebar variables
        let sidebarCategories = [];
        let sidebarLanguages = [];
        let currentFilter = 'all';
        let currentFilterType = 'home';
        
        // Search variables
        let currentSearchQuery = '';
        let searchTimeout = null;
        
        // Dialog box variables
        let dialogDownloadUrl = '';
        let dialogMovieId = '';
        let dialogServerName = '';
        let dialogQuality = '';
        let dialogButton = null;
        let dialogLanguage = 'bn';

        // Dialog translations
        const dialogTranslations = {
            bn: {
                message: 'ডাউনলোড শুরু হয়েছে! যদি "টেলিগ্রাম বট" স্বয়ংক্রিয়ভাবে ডাউনলোড না হয়, তাহলে নিচে "আবার চেষ্টা করুন" বাটনে ক্লিক করুন।',
                cancel: 'বন্ধ করুন',
                retry: 'আবার চেষ্টা করুন',
                switchLang: 'Switch to English'
            },
            en: {
                message: 'Download has started! If "Telegram Bot" does not download automatically, click "Try again" below.',
                cancel: 'Close',
                retry: 'Try again',
                switchLang: 'বাংলায় পরিবর্তন করুন'
            }
        };
        
        // Translations
        const translations = {
            en: {
                appTitle: "Dub Fusion Hub",
                searchPlaceholder: "Search movies...",
                sectionTitle: "Popular Movies",
                loadingMovies: "Loading movies...",
                loadMore: "Load More",
                noMovies: "No movies found",
                screenshots: "Screenshots",
                downloadOptions: "Download Options",
                loadingOptions: "Loading download options...",
                noDownloadOptions: "No download options available",
                unlockBtn: "Unlock to Download",
                downloadBtn: "Download",
                views: "views",
                status: "status",
                notificationUnlocked: "Download options unlocked!",
                notificationAdError: "Error loading ad. Please try again.",
                notificationNetworkError: "Network error. Please check your connection.",
                notificationSearchError: "Search error. Please try again.",
                language: "English",
                customText: "Custom Text",
                quality: "Quality",
                languageText: "Language",
                type: "Type",
                newServer: "New",
                unlock_button: "Unlock ({adCount}/{requiredCount})",
                download_now_button: "Download Now",
                toast_download_starting: "Your download is starting...",
                toast_progress: "Progress: {adCount}/{requiredCount}",
                toast_unlocked: "Download unlocked!",
                toast_ad_error: "Could not load ad. Please try again.",
                loading_ad: "Loading ad...",
                verifying_button: "Please wait {countdown}s",
                connectionOnline: "Online",
                connectionOffline: "Offline",
                connectionSyncing: "Syncing...",
                connectionReconnecting: "Reconnecting...",
                generating_link: "Generating download link...",
                link_generated: "Link generated successfully",
                file_size: "Size",
                download_type: "Type",
                direct_download: "Direct",
                streaming: "Streaming",
                loading_file_size: "Loading size...",
                noSlides: "No promotional slides available",
                slidesError: "Could not load slides",
                footerText: "&copy; 2025 {siteName}. All rights reserved.",
                disclaimer: "Disclaimer: This site does not host any files.",
                sidebarHome: "Home",
                sidebarNew: "New Movies",
                sidebarUpdated: "Updated Movies",
                categoriesTitle: "Categories",
                languagesTitle: "Languages",
                loadingCategories: "Loading categories...",
                loadingLanguages: "Loading languages...",
                searchSidebarPlaceholder: "Search category or language...",
                searchResults: "Found {count} movies for '{query}'",
                noSearchResults: "No movies found for '{query}'",
                backToTop: "Back to Top",
                filterAll: "All Movies",
                filterNew: "New Movies",
                filterUpdated: "Updated Movies",
                filterCategory: "{filter}",
                filterLanguage: "{filter} Language",
                filterSearch: "Search: {query}",
                shareBtn: "Share",
                copyLinkBtn: "Copy Link",
                linkCopiedToast: "Link copied to clipboard!",
                linkCopyFailedToast: "Failed to copy link",
                shareText: "Share This {type}",
                movieType: "Movie",
                seriesType: "Series",
                backToHome: "Back to Home",
                storyline: "Storyline",
                downloadSection: "Download Options",
                shareMovie: "Share This Movie",
                copyMovieLink: "Copy Movie Link"
            },
            bn: {
                appTitle: "ডাব ফিউশন হাব",
                searchPlaceholder: "মুভি খুঁজুন...",
                sectionTitle: "জনপ্রিয় মুভি",
                loadingMovies: "মুভি লোড হচ্ছে...",
                loadMore: "আরো দেখুন",
                noMovies: "কোনো মুভি পাওয়া যায়নি",
                screenshots: "স্ক্রিনশট",
                downloadOptions: "ডাউনলোড অপশন",
                loadingOptions: "ডাউনলোড অপশন লোড হচ্ছে...",
                noDownloadOptions: "কোনো ডাউনলোড অপশন নেই",
                unlockBtn: "ডাউনলোড আনলক করুন",
                downloadBtn: "ডাউনলোড",
                views: "ভিউ",
                status: "স্ট্যাটাস",
                notificationUnlocked: "ডাউনলোড অপশন আনলক করা হয়েছে!",
                notificationAdError: "এডস লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।",
                notificationNetworkError: "নেটওয়ার্ক ত্রুটি। ইন্টারনেট কানেকশন চেক করুন।",
                notificationSearchError: "সার্চ করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।",
                language: "বাংলা",
                customText: "কাস্টম টেক্সট",
                quality: "গুণমান",
                languageText: "ভাষা",
                type: "ধরণ",
                newServer: "নতুন",
                unlock_button: "আনলক করুন ({adCount}/{requiredCount})",
                download_now_button: "এখনই ডাউনলোড করুন",
                toast_download_starting: "আপনার ডাউনলোড শুরু হচ্ছে...",
                toast_progress: "অগ্রগতি: {adCount}/{requiredCount}",
                toast_unlocked: "ডাউনলোড আনলক করা হয়েছে!",
                toast_ad_error: "বিজ্ঞাপন লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
                loading_ad: "বিজ্ঞাপন লোড হচ্ছে...",
                verifying_button: "অনুগ্রহ করে অপেক্ষা করুন... {countdown}s",
                connectionOnline: "অনলাইন",
                connectionOffline: "অফলাইন",
                connectionSyncing: "সিঙ্ক করছি...",
                connectionReconnecting: "পুনঃসংযোগ করা হচ্ছে...",
                generating_link: "ডাউনলোড লিঙ্ক তৈরি হচ্ছে...",
                link_generated: "লিঙ্ক সফলভাবে তৈরি হয়েছে",
                file_size: "সাইজ",
                download_type: "ধরণ",
                direct_download: "ডাইরেক্ট",
                streaming: "স্ট্রিমিং",
                loading_file_size: "সাইজ লোড হচ্ছে...",
                noSlides: "কোন প্রচারমূলক স্লাইড উপলব্ধ নেই",
                slidesError: "স্লাইড লোড করা যায়নি",
                footerText: "&copy; ২০২৫ {siteName}. সর্বস্বত্ব সংরক্ষিত।",
                disclaimer: "দাবিত্যাগ: এই সাইটটি কোনো ফাইল হোস্ট করে না।",
                sidebarHome: "হোম",
                sidebarNew: "নতুন মুভি",
                sidebarUpdated: "আপডেটেড মুভি",
                categoriesTitle: "ক্যাটাগরি",
                languagesTitle: "ভাষা",
                loadingCategories: "ক্যাটাগরি লোড হচ্ছে...",
                loadingLanguages: "ভাষা লোড হচ্ছে...",
                searchSidebarPlaceholder: "ক্যাটাগরি বা ভাষা খুঁজুন...",
                searchResults: "'{query}' এর জন্য {count}টি মুভি পাওয়া গেছে",
                noSearchResults: "'{query}' এর জন্য কোন মুভি পাওয়া যায়নি",
                backToTop: "উপরে যান",
                filterAll: "সব মুভি",
                filterNew: "নতুন মুভি",
                filterUpdated: "আপডেটেড মুভি",
                filterCategory: "{filter}",
                filterLanguage: "{filter} ভাষা",
                filterSearch: "সার্চ: {query}",
                shareBtn: "শেয়ার",
                copyLinkBtn: "লিংক কপি",
                linkCopiedToast: "লিংক ক্লিপবোর্ডে কপি করা হয়েছে!",
                linkCopyFailedToast: "লিংক কপি করতে ব্যর্থ হয়েছে",
                shareText: "এই {type} শেয়ার করুন",
                movieType: "মুভি",
                seriesType: "সিরিজ",
                backToHome: "হোমে ফিরে যান",
                storyline: "গল্পসংক্ষেপ",
                downloadSection: "ডাউনলোড অপশন",
                shareMovie: "এই মুভিটি শেয়ার করুন",
                copyMovieLink: "মুভি লিংক কপি করুন"
            }
        };
        
        // Mock Firebase Functions
        const mockFirebase = {
            initializeApp: function(config) {
                console.log('Mock Firebase initialized');
                return {
                    firestore: function() {
                        return mockFirestore;
                    },
                    database: function() {
                        return mockDatabase;
                    }
                };
            },
            apps: { length: 0 }
        };

        // Mock Firestore
        const mockFirestore = {
            collection: function(name) {
                return {
                    doc: function(id) {
                        return {
                            get: function() {
                                return loadFromJson(name, id);
                            },
                            update: function(data) {
                                console.log('Mock update:', name, id, data);
                                return Promise.resolve();
                            }
                        };
                    },
                    where: function(field, operator, value) {
                        return this;
                    },
                    orderBy: function(field, direction) {
                        return this;
                    },
                    limit: function(limit) {
                        return this;
                    },
                    startAfter: function(lastDoc) {
                        return this;
                    },
                    get: function() {
                        return loadCollectionFromJson(name);
                    }
                };
            }
        };

        // Mock Realtime Database
        const mockDatabase = {
            ref: function(path) {
                return {
                    once: function(type) {
                        return Promise.resolve({
                            val: function() {
                                return Date.now();
                            }
                        });
                    }
                };
            }
        };

        // Mock FieldValue
        const mockFieldValue = {
            increment: function(value) {
                return value;
            },
            serverTimestamp: function() {
                return new Date();
            }
        };

        // Load data from JSON files
        async function loadFromJson(collection, docId) {
            try {
                let data;
                
                switch(collection) {
                    case 'movies':
                        const moviesResponse = await fetch('data/movies.json');
                        const moviesData = await moviesResponse.json();
                        const movie = moviesData.find(m => m.id === docId);
                        return Promise.resolve({
                            exists: !!movie,
                            data: function() {
                                return movie || {};
                            },
                            id: docId
                        });
                        
                    case 'config':
                        const configResponse = await fetch('config/config.json');
                        const configData = await configResponse.json();
                        
                        if (docId === 'settings') {
                            return Promise.resolve({
                                exists: true,
                                data: function() {
                                    return configData.settings || {};
                                }
                            });
                        } else if (docId === 'siteConfig') {
                            return Promise.resolve({
                                exists: true,
                                data: function() {
                                    return configData.siteConfig || {};
                                }
                            });
                        }
                        break;
                        
                    case 'adsConfig':
                        const adsResponse = await fetch('config/adsConfig.json');
                        const adsData = await adsResponse.json();
                        
                        if (docId === 'current') {
                            return Promise.resolve({
                                exists: true,
                                data: function() {
                                    return adsData;
                                }
                            });
                        }
                        break;
                        
                    case 'settings':
                        if (docId === 'general') {
                            const configResponse = await fetch('config/config.json');
                            const configData = await configResponse.json();
                            return Promise.resolve({
                                exists: true,
                                data: function() {
                                    return configData.settings || {};
                                }
                            });
                        }
                        break;
                }
                
                return Promise.resolve({
                    exists: false,
                    data: function() { return {}; }
                });
            } catch (error) {
                console.error('Error loading JSON:', error);
                return Promise.resolve({
                    exists: false,
                    data: function() { return {}; }
                });
            }
        }

        // Load collection from JSON
        async function loadCollectionFromJson(collection) {
            try {
                let data = [];
                
                switch(collection) {
                    case 'movies':
                        const moviesResponse = await fetch('data/movies.json');
                        const moviesData = await moviesResponse.json();
                        data = moviesData;
                        break;
                        
                    case 'sliders':
                        const slidersResponse = await fetch('data/sliders.json');
                        const slidersData = await slidersResponse.json();
                        data = slidersData;
                        break;
                        
                    case 'config':
                        const configResponse = await fetch('config/config.json');
                        const configData = await configResponse.json();
                        data = [configData];
                        break;
                }
                
                return Promise.resolve({
                    empty: data.length === 0,
                    forEach: function(callback) {
                        data.forEach((item, index) => {
                            callback({
                                data: function() { return item; },
                                id: item.id || `doc_${index}`
                            });
                        });
                    },
                    docs: data.map((item, index) => ({
                        data: function() { return item; },
                        id: item.id || `doc_${index}`
                    }))
                });
            } catch (error) {
                console.error('Error loading collection:', error);
                return Promise.resolve({
                    empty: true,
                    forEach: function() {},
                    docs: []
                });
            }
        }
        
        // Helper function to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Helper function to load data from localStorage with error handling
        function loadFromStorage(key, defaultValue) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch (error) {
                console.error(`Error loading ${key} from localStorage:`, error);
                return defaultValue;
            }
        }
        
        // Helper function to save data to localStorage with error handling
        function saveToStorage(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error(`Error saving ${key} to localStorage:`, error);
            }
        }
        
        // Initialize data from localStorage
        function initializeStorageData() {
            unlockedMovies = loadFromStorage('unlockedMovies', {});
            movieViews = loadFromStorage('movieViews', {});
            dailyViews = loadFromStorage('dailyViews', {});
            adCounts = loadFromStorage('adCounts', {});
            fileSizesCache = loadFromStorage('fileSizesCache', {});
            movieUnlockTimestamps = loadFromStorage('movieUnlockTimestamps', {});
        }
        
        // Go back to home function
        function goBackToHome() {
            window.location.href = 'index.html';
        }
        
        // Load single movie from URL
        async function loadSingleMovie(movieId) {
            const t = translations[currentLanguage];
            const singleMovieContainer = document.getElementById('singleMovieContainer');
            
            if (!singleMovieContainer) return;
            
            singleMovieContainer.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>${t.loadingMovies}</p>
                </div>
            `;
            
            try {
                const doc = await db.collection('movies').doc(movieId).get();
                
                if (!doc.exists) {
                    singleMovieContainer.innerHTML = `
                        <div class="no-movies">
                            <i class="fas fa-film"></i>
                            <h3>${t.noMovies}</h3>
                            <p>Movie not found</p>
                        </div>
                    `;
                    return;
                }
                
                const movie = doc.data();
                movie.id = doc.id;
                
                renderSingleMovie(movie);
                
            } catch (error) {
                console.error("Error loading single movie:", error);
                singleMovieContainer.innerHTML = `
                    <div class="no-movies">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Error loading movie</h3>
                        <p>Please try again later</p>
                    </div>
                `;
            }
        }
        
        // Render single movie view
        function renderSingleMovie(movie) {
            const singleMovieContainer = document.getElementById('singleMovieContainer');
            const t = translations[currentLanguage];
            
            if (!singleMovieContainer) return;
            
            const shouldApplyBlur = (movie.enablePosterBlur !== undefined ? movie.enablePosterBlur : siteConfig.enablePosterBlur);
            const blurValue = (movie.enablePosterBlur !== undefined ? movie.blurPercentage : siteConfig.blurPercentage) || 10;
            const posterUrl = movie.imageUrl || siteConfig.placeholderImage;
            const totalViews = Number(movie.total_views) || 0;
            const info5Views = Number(movie.info5_views) || 0;
            const serverViews = totalViews + info5Views;
            
            let customBadgeText = '';
            if (movie.info1_custom) {
                customBadgeText = movie.info1_custom;
            } else if (movie.isNewPost && isWithinDays(movie.createdAt, 7)) {
                customBadgeText = 'NEW';
            } else if (movie.lastUpdated && isWithinDays(movie.lastUpdated, 7)) {
                customBadgeText = 'UPDATED';
            }
            
            // Determine movie type
            const movieType = (movie.info4_type && movie.info4_type.toLowerCase().includes('series')) ? 'series' : 'movie';
            const typeText = movieType === 'series' ? t.seriesType : t.movieType;
            
            // Check if movie unlock has expired
            const isExpired = isMovieUnlockExpired(movie.id);
            const adCount = adCounts[movie.id] || 0;
            const isUnlocked = unlockedMovies[movie.id] && !isExpired;
            
            let downloadOptionsHtml = '';
            if (movie.downloadOptions && movie.downloadOptions.length > 0) {
                movie.downloadOptions.forEach((server, serverIndex) => {
                    const isNewServer = checkIfNewServer(movie, serverIndex);
                    const serverName = server.server || 'Server';
                    
                    downloadOptionsHtml += `
                        <div class="download-server" style="margin-top: 20px;">
                            <div class="server-title">
                                <i class="fas fa-server"></i>
                                <span>${escapeHtml(serverName)}</span>
                                ${isNewServer ? `<span class="new-server-badge">${t.newServer}</span>` : ''}
                            </div>
                            <div class="quality-options">
                    `;
                    
                    if (server.qualities && server.qualities.length > 0) {
                        server.qualities.forEach((quality, qualityIndex) => {
                            const optionId = `single_option_${movie.id}_${serverIndex}_${qualityIndex}`;
                            const downloadType = getDownloadType(quality.path);
                            const downloadTypeText = downloadType === 'streaming' ? t.streaming : t.direct_download;
                            
                            // Get file size asynchronously
                            const fileSize = quality.file_size ? quality.file_size : getDefaultFileSize(quality.quality_text);
                            
                            if (isUnlocked) {
                                const downloadUrl = getDownloadUrl(quality.path, serverName, movie);
                                
                                downloadOptionsHtml += `
                                    <div class="quality-option unlocked" id="${optionId}">
                                        <div class="quality-text">${escapeHtml(quality.quality_text || 'Quality')}</div>
                                        <div class="download-link-details">
                                            <div class="file-size">
                                                <i class="fas fa-hdd"></i>
                                                <span>${t.file_size}: ${escapeHtml(fileSize)}</span>
                                            </div>
                                            <span class="download-type">${downloadTypeText}</span>
                                        </div>
                                        <a href="javascript:void(0)" 
                                            class="download-btn" 
                                            data-download-url="${escapeHtml(downloadUrl)}"
                                            onclick="startDownload('${movie.id}', '${escapeHtml(serverName)}', '${escapeHtml(quality.quality_text || 'Quality')}', this, event)"
                                            oncontextmenu="return false;">
                                            <i class="fas fa-download"></i> ${t.download_now_button}
                                        </a>
                                        <div class="download-progress" id="progress_${optionId}">
                                            <div class="download-progress-bar"></div>
                                        </div>
                                        
                                        <div class="link-generated" id="link_generated_${optionId}">
                                            <i class="fas fa-check-circle"></i> ${t.link_generated}
                                        </div>
                                    </div>
                                `;
                            } else {
                                downloadOptionsHtml += `
                                    <div class="quality-option locked" id="${optionId}">
                                        <div class="quality-text">${escapeHtml(quality.quality_text || 'Quality')}</div>
                                        <div class="download-link-details">
                                            <div class="file-size">
                                                <i class="fas fa-hdd"></i>
                                                <span>${t.file_size}: ${escapeHtml(fileSize)}</span>
                                            </div>
                                            <span class="download-type">${downloadTypeText}</span>
                                        </div>
                                        <button class="unlock-btn" 
                                                onclick="processAdUnlock('${movie.id}', ${requiredAds}, this)"
                                                data-movie-id="${movie.id}"
                                                data-required-ads="${requiredAds}">
                                            <i class="fas fa-lock"></i> 
                                            <span class="unlock-text">
                                                ${t.unlock_button.replace('{adCount}', adCount).replace('{requiredCount}', requiredAds)}
                                            </span>
                                        </button>
                                        <div class="download-progress" id="progress_${optionId}" style="display: none;">
                                            <div class="download-progress-bar"></div>
                                        </div>
                                        ${adCount > 0 ? `<div class="timer-progress">${t.toast_progress.replace('{adCount}', adCount).replace('{requiredCount}', requiredAds)}</div>` : ''}
                                    </div>
                                `;
                            }
                        });
                    }
                    
                    downloadOptionsHtml += `
                            </div>
                        </div>
                    `;
                });
            } else {
                downloadOptionsHtml = `
                    <div class="no-movies" style="margin-top: 30px;">
                        <i class="fas fa-download"></i>
                        <h3>${t.noDownloadOptions}</h3>
                        <p>Download options will be available soon</p>
                    </div>
                `;
            }
            
            const html = `
                <div class="single-movie-header">
                    <div class="single-movie-poster">
                        <div class="single-poster-container">
                            <img src="${escapeHtml(posterUrl)}" 
                                 alt="${escapeHtml(movie.title || 'Movie')}" 
                                 class="single-movie-poster-img"
                                 style="${shouldApplyBlur ? `filter: blur(${blurValue}px);` : ''}"
                                 onerror="this.onerror=null; this.src='${escapeHtml(siteConfig.placeholderImage)}'; this.style.filter='none'">
                            
                            ${shouldApplyBlur ? `
                                <div class="single-blur-overlay">
                                    <div class="single-blur-text">🔞 18+ Adult</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="single-movie-info">
                        <h1 class="single-movie-title">${escapeHtml(movie.title || 'Untitled Movie')}</h1>
                        
                        <div class="single-movie-subtitle">
                            ${escapeHtml(movie.info2_quality || 'HD')} | ${escapeHtml(movie.info4_type || 'Movie')}
                        </div>
                        
                        <div class="single-movie-badges">
                            ${customBadgeText ? `
                                <span class="single-badge badge-custom">
                                    ${escapeHtml(customBadgeText)}
                                </span>
                            ` : ''}
                            
                            <span class="single-badge badge-quality">
                                ${escapeHtml(movie.info2_quality || 'HD')}
                            </span>
                            
                            <span class="single-badge badge-language">
                                ${escapeHtml(movie.info3_language || t.languageText)}
                            </span>
                            
                            <span class="single-badge badge-type">
                                ${escapeHtml(movie.info4_type || t.type)}
                            </span>
                            
                            ${hasNewServerWithinDays(movie, 7) ? `
                                <span class="single-badge badge-new">
                                    ${escapeHtml(t.newServer)}
                                </span>
                            ` : ''}
                        </div>
                        
                        <div class="single-movie-meta">
                            <div class="meta-item">
                                <span class="meta-label">${t.views}:</span>
                                <span class="meta-value views-value">${formatViewCount(serverViews)}</span>
                            </div>
                            
                            <div class="meta-item">
                                <span class="meta-label">${t.status}:</span>
                                <span class="meta-value status-value">${escapeHtml(movie.info6_status || 'Online')}</span>
                            </div>
                        </div>
                        
                        <div class="single-share-buttons">
                            <button class="single-share-btn single-copy-link-btn" 
                                    onclick="copyMovieLink('${movie.id}', '${escapeHtml(movie.title || 'Untitled Movie')}', '${movieType}')">
                                <i class="fas fa-share-alt"></i>
                                <span>${t.copyMovieLink}</span>
                            </button>
                        </div>
                        
                        ${movie.storyline ? `
                            <div class="single-movie-description">
                                <h4 class="description-title">
                                    <i class="fas fa-book"></i>
                                    ${t.storyline}
                                </h4>
                                <p class="description-text">${escapeHtml(movie.storyline)}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="single-movie-content">
                    <h3 class="section-subtitle">
                        <i class="fas fa-download"></i>
                        ${t.downloadSection}
                    </h3>
                    
                    ${downloadOptionsHtml}
                </div>
            `;
            
            singleMovieContainer.innerHTML = html;
            
            // Update back button text
            const backToHomeText = document.getElementById('backToHomeText');
            if (backToHomeText) {
                backToHomeText.textContent = t.backToHome;
            }
        }
        
        // Check if movie unlock has expired
        function isMovieUnlockExpired(movieId) {
            if (!movieUnlockTimestamps[movieId]) {
                return true;
            }
            
            const unlockTime = movieUnlockTimestamps[movieId];
            const currentTime = Date.now();
            const expiryTime = unlockTime + (unlockExpiryDays * 24 * 60 * 60 * 1000);
            
            return currentTime > expiryTime;
        }
        
        // Update unlock timestamp
        function updateUnlockTimestamp(movieId) {
            movieUnlockTimestamps[movieId] = Date.now();
            saveToStorage('movieUnlockTimestamps', movieUnlockTimestamps);
        }
        
        // Check and reset expired unlocks
        function checkAndResetExpiredUnlocks() {
            for (const movieId in movieUnlockTimestamps) {
                if (isMovieUnlockExpired(movieId)) {
                    // Reset progress for expired movies
                    if (adCounts[movieId]) {
                        adCounts[movieId] = 0;
                    }
                    
                    // Remove from unlocked movies
                    if (unlockedMovies[movieId]) {
                        delete unlockedMovies[movieId];
                    }
                    
                    // Remove timestamp
                    delete movieUnlockTimestamps[movieId];
                }
            }
            
            // Save updated data
            saveToStorage('adCounts', adCounts);
            saveToStorage('movieUnlockTimestamps', movieUnlockTimestamps);
            saveToStorage('unlockedMovies', unlockedMovies);
        }
        
        // Update section title based on filter
        function updateSectionTitle() {
            const sectionTitleElement = document.getElementById('sectionTitle');
            const filterIndicator = document.getElementById('filterIndicator');
            const filterTextElement = document.getElementById('filterText');
            
            if (!sectionTitleElement || !filterIndicator || !filterTextElement) return;
            
            const t = translations[currentLanguage];
            
            let sectionTitle = '';
            let filterText = '';
            let showFilterIndicator = false;
            
            switch (currentFilterType) {
                case 'all':
                    sectionTitle = t.sectionTitle;
                    filterText = t.filterAll;
                    showFilterIndicator = false;
                    break;
                    
                case 'new':
                    sectionTitle = t.sectionTitle;
                    filterText = t.filterNew;
                    showFilterIndicator = true;
                    break;
                    
                case 'updated':
                    sectionTitle = t.sectionTitle;
                    filterText = t.filterUpdated;
                    showFilterIndicator = true;
                    break;
                    
                case 'category':
                    sectionTitle = t.sectionTitle;
                    filterText = t.filterCategory.replace('{filter}', currentFilter);
                    showFilterIndicator = true;
                    break;
                    
                case 'language':
                    sectionTitle = t.sectionTitle;
                    filterText = t.filterLanguage.replace('{filter}', currentFilter);
                    showFilterIndicator = true;
                    break;
                    
                default:
                    sectionTitle = t.sectionTitle;
                    filterText = t.filterAll;
                    showFilterIndicator = false;
            }
            
            // If searching, override with search title
            if (currentSearchQuery && currentSearchQuery.trim() !== '') {
                sectionTitle = t.sectionTitle;
                filterText = t.filterSearch.replace('{query}', currentSearchQuery);
                showFilterIndicator = true;
            }
            
            sectionTitleElement.textContent = sectionTitle;
            filterTextElement.textContent = filterText;
            
            if (showFilterIndicator) {
                filterIndicator.style.display = 'flex';
            } else {
                filterIndicator.style.display = 'none';
            }
        }

        // Detect Telegram Mini App environment
        function detectTelegramMiniApp() {
            if (window.Telegram && window.Telegram.WebApp) {
                return true;
            }
            
            if (window.location.search.includes('tgWebApp') || 
                window.location.hash.includes('tgWebApp')) {
                return true;
            }
            
            const userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.includes('telegram') || userAgent.includes('webview')) {
                return true;
            }
            
            return false;
        }

        // Handle redirect in Telegram Mini App
        function handleTelegramRedirect(url) {
            if (window.Telegram?.WebApp?.openLink) {
                try {
                    window.Telegram.WebApp.openLink(url);
                    return true;
                } catch (error) {
                    console.error("Telegram openLink failed:", error);
                }
            }
            
            if (window.Telegram?.WebApp?.postEvent) {
                try {
                    window.Telegram.WebApp.postEvent('web_app_open_link', { url: url });
                    return true;
                } catch (error) {
                    console.error("Telegram postEvent failed:", error);
                }
            }
            
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = url;
                document.body.appendChild(iframe);
                
                setTimeout(() => {
                    if (iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                }, 5000);
                
                return true;
            } catch (error) {
                console.error("Telegram iframe fallback failed:", error);
            }
            
            window.open(url, '_blank', 'noopener,noreferrer');
            return true;
        }
        
        // App Initialization
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize storage data
            initializeStorageData();
            
            // Check if we're in single movie view mode
            const urlParams = new URLSearchParams(window.location.search);
            const movieId = urlParams.get('movie');
            
            if (movieId) {
                // Single movie view mode
                document.getElementById('mainContainer').style.display = 'none';
                document.getElementById('singleMovieView').style.display = 'block';
                
                // Initialize Mock Firebase and load single movie
                try {
                    db = mockFirestore;
                    realtimeDb = mockDatabase;
                    
                    setLanguage(currentLanguage);
                    loadSingleMovie(movieId);
                    initConnectionManagement();
                    initDownloadSystem();
                    loadGlobalSettings().catch(console.error);
                    loadAdsConfig().catch(console.error);
                    loadSiteConfig().catch(console.error);
                    loadDownloadServers().catch(console.error);
                    loadTimerSettings().catch(console.error);
                    
                } catch (error) {
                    console.error("Mock Firebase initialization error:", error);
                    showNotification("Failed to initialize app. Please refresh.", true);
                }
                
                setupEventListeners();
                
            } else {
                // Regular homepage view
                document.getElementById('mainContainer').style.display = 'block';
                document.getElementById('singleMovieView').style.display = 'none';
                
                setLanguage(currentLanguage);
                
                try {
                    db = mockFirestore;
                    realtimeDb = mockDatabase;
                    
                    initConnectionManagement();
                    initDownloadSystem();
                    initializeApp();
                } catch (error) {
                    console.error("Mock Firebase initialization error:", error);
                    showNotification("Failed to initialize app. Please refresh.", true);
                }
                
                setupEventListeners();
                initSidebar();
                initBackToTop();
                initDialogBox();
                
                // Check for expired unlocks on app start
                checkAndResetExpiredUnlocks();
                
                // Check every hour for expired unlocks
                setInterval(() => {
                    checkAndResetExpiredUnlocks();
                }, 60 * 60 * 1000);
                
                // Handle deep linking on page load
                handleDeepLink();
            }
        });
        
        // Handle Deep Link Function
        function handleDeepLink() {
            const urlParams = new URLSearchParams(window.location.search);
            const movieParam = urlParams.get('movie');
            
            if (movieParam) {
                // Extract movie ID from parameter (format: movietitle-ID)
                const parts = movieParam.split('-');
                const movieId = parts.length > 1 ? parts[parts.length - 1] : movieParam;
                
                setTimeout(() => {
                    const targetCard = document.getElementById(`movie-${movieId}`);
                    if (targetCard) {
                        // Scroll to target card
                        targetCard.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        
                        // Highlight the card
                        targetCard.classList.add('highlighted');
                        
                        // Remove highlight after 3 seconds
                        setTimeout(() => {
                            targetCard.classList.remove('highlighted');
                        }, 3000);
                        
                        // Clean URL (remove parameter from browser history)
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }
                }, 1000);
            }
        }
        
        // Generate Shareable Link for Movie
        function generateMovieLink(movieId, movieTitle, movieType) {
            // Clean movie title: remove special characters and spaces
            const cleanTitle = encodeURIComponent(movieTitle
                .toLowerCase()
                .replace(/[^\w\s]/gi, '')
                .replace(/\s+/g, '-')
                .substring(0, 50));
            
            // Create link format: https://domain.com/index.html?movie=movietitle-ID
            const baseUrl = window.location.origin + window.location.pathname;
            const movieTypeText = movieType || 'movie';
            return `${baseUrl}?movie=${cleanTitle}-${movieId}`;
        }
        
        // Copy Link to Clipboard
        function copyMovieLink(movieId, movieTitle, movieType) {
            const link = generateMovieLink(movieId, movieTitle, movieType);
            
            navigator.clipboard.writeText(link)
                .then(() => {
                    const t = translations[currentLanguage];
                    showNotification(t.linkCopiedToast);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                    const t = translations[currentLanguage];
                    showNotification(t.linkCopyFailedToast, true);
                    
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = link;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        const successful = document.execCommand('copy');
                        if (successful) {
                            const t = translations[currentLanguage];
                            showNotification(t.linkCopiedToast);
                        } else {
                            throw new Error('Copy command failed');
                        }
                    } catch (err) {
                        console.error('Fallback copy failed: ', err);
                    }
                    document.body.removeChild(textArea);
                });
        }
        
        // Initialize Dialog Box
        function initDialogBox() {
            const dialogCancel = document.getElementById('dialogCancel');
            if (dialogCancel) {
                dialogCancel.addEventListener('click', closeDownloadDialog);
            }
            
            const dialogRetry = document.getElementById('dialogRetry');
            if (dialogRetry) {
                dialogRetry.addEventListener('click', executeDownloadFromDialog);
            }
            
            const dialogLangSwitch = document.getElementById('dialogLangSwitch');
            if (dialogLangSwitch) {
                dialogLangSwitch.addEventListener('click', switchDialogLanguage);
            }
            
            const downloadDialog = document.getElementById('downloadDialog');
            if (downloadDialog) {
                downloadDialog.addEventListener('click', function(e) {
                    if (e.target === this) {
                        closeDownloadDialog();
                    }
                });
            }
        }
        
        // Show Download Dialog
        function showDownloadDialog() {
            dialogLanguage = 'bn';
            updateDialogLanguage();
            
            setTimeout(() => {
                const dialog = document.getElementById('downloadDialog');
                if (dialog) {
                    dialog.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    
                    // Auto close after 30 seconds
                    setTimeout(() => {
                        if (dialog.style.display === 'flex') {
                            closeDownloadDialog();
                        }
                    }, 30000);
                }
            }, 1500);
        }
        
        // Update Dialog Language
        function updateDialogLanguage() {
            const t = dialogTranslations[dialogLanguage];
            
            const dialogMessage = document.getElementById('dialogMessage');
            const cancelBtnText = document.getElementById('cancelBtnText');
            const retryBtnText = document.getElementById('retryBtnText');
            const dialogLangText = document.getElementById('dialogLangText');
            
            if (dialogMessage) dialogMessage.textContent = t.message;
            if (cancelBtnText) cancelBtnText.textContent = t.cancel;
            if (retryBtnText) retryBtnText.textContent = t.retry;
            if (dialogLangText) dialogLangText.textContent = t.switchLang;
        }
        
        // Switch Dialog Language
        function switchDialogLanguage() {
            dialogLanguage = dialogLanguage === 'bn' ? 'en' : 'bn';
            updateDialogLanguage();
        }
        
        // Close Download Dialog
        function closeDownloadDialog() {
            const dialog = document.getElementById('downloadDialog');
            if (dialog) {
                dialog.style.display = 'none';
                document.body.style.overflow = '';
            }
            
            dialogDownloadUrl = '';
            dialogMovieId = '';
            dialogServerName = '';
            dialogQuality = '';
            dialogButton = null;
        }
        
        // Execute Download (from dialog) - Retry function
        function executeDownloadFromDialog() {
            if (dialogDownloadUrl && dialogButton) {
                showNotification("Retrying download...");
                
                initiateDialogDownload(dialogDownloadUrl, dialogMovieId, dialogServerName, dialogQuality, dialogButton);
                
                setTimeout(() => {
                    closeDownloadDialog();
                }, 1000);
            }
        }
        
        // Initiate Download from Dialog Box (opens in new tab)
        function initiateDialogDownload(downloadUrl, movieId, serverName, quality) {
            const t = translations[currentLanguage];
            
            showNotification(t.toast_download_starting);
            
            if (downloadUrl.startsWith('http')) {
                try {
                    const newTab = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
                    
                    if (!newTab || newTab.closed || typeof newTab.closed == 'undefined') {
                        showNotification("Popup blocked! Please allow popups for this site.", true);
                        
                        setTimeout(() => {
                            if (confirm("Popup blocked. Click OK to copy download link to clipboard.")) {
                                navigator.clipboard.writeText(downloadUrl).then(() => {
                                    showNotification("Download link copied to clipboard!");
                                });
                            }
                        }, 1000);
                    }
                } catch (error) {
                    console.error("New tab open error:", error);
                    window.location.href = downloadUrl;
                }
            }
            
            try {
                const progressId = `progress_option_${movieId}_${serverName}_${quality}`.replace(/\s+/g, '_');
                const progressBar = document.getElementById(`progress_${progressId}`);
                const progressBarInner = progressBar ? progressBar.querySelector('.download-progress-bar') : null;
                
                if (progressBar && progressBarInner) {
                    progressBar.style.display = 'block';
                    
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += Math.random() * 15;
                        if (progress > 100) progress = 100;
                        progressBarInner.style.width = progress + '%';
                        
                        if (progress >= 100) {
                            clearInterval(interval);
                            setTimeout(() => {
                                progressBar.style.display = 'none';
                                progressBarInner.style.width = '0%';
                            }, 500);
                        }
                    }, 200);
                }
            } catch (error) {
                console.error("Progress bar error:", error);
            }
        }
        
        // Initialize Back to Top Button
        function initBackToTop() {
            const backToTopBtn = document.getElementById('backToTop');
            if (!backToTopBtn) return;
            
            const scrollHandler = function() {
                if (window.scrollY > 300) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            };
            
            window.addEventListener('scroll', scrollHandler);
            
            backToTopBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
            
            const t = translations[currentLanguage];
            backToTopBtn.title = t.backToTop;
        }
        
        // Initialize Sidebar
        function initSidebar() {
            loadSidebarData();
            setupSidebarEvents();
            updateSidebarTranslations();
        }
        
        // Load Sidebar Data from JSON
        async function loadSidebarData() {
            try {
                const response = await fetch('data/movies.json');
                const movies = await response.json();
                
                const categories = new Set();
                const languages = new Set();
                
                movies.forEach(movie => {
                    if (movie.info4_type) {
                        if (Array.isArray(movie.info4_type)) {
                            movie.info4_type.forEach(category => {
                                if (category && typeof category === 'string' && category.trim()) categories.add(category.trim());
                            });
                        } else if (typeof movie.info4_type === 'string') {
                            const categoryList = movie.info4_type.split(',').map(c => c.trim());
                            categoryList.forEach(category => {
                                if (category) categories.add(category);
                            });
                        }
                    }
                    
                    if (movie.info3_language) {
                        if (Array.isArray(movie.info3_language)) {
                            movie.info3_language.forEach(language => {
                                if (language && typeof language === 'string' && language.trim()) languages.add(language.trim());
                            });
                        } else if (typeof movie.info3_language === 'string') {
                            const languageList = movie.info3_language.split(',').map(l => l.trim());
                            languageList.forEach(language => {
                                if (language) languages.add(language);
                            });
                        }
                    }
                });
                
                sidebarCategories = Array.from(categories).sort();
                sidebarLanguages = Array.from(languages).sort();
                
                renderSidebarCategories();
                renderSidebarLanguages();
                
            } catch (error) {
                console.error("Error loading sidebar data:", error);
                const cachedMovies = localStorage.getItem('cachedMovies');
                if (cachedMovies) {
                    try {
                        const movies = JSON.parse(cachedMovies);
                        const categories = new Set();
                        const languages = new Set();
                        
                        movies.forEach(movie => {
                            if (movie.info4_type) {
                                if (Array.isArray(movie.info4_type)) {
                                    movie.info4_type.forEach(category => {
                                        if (category && typeof category === 'string' && category.trim()) categories.add(category.trim());
                                    });
                                } else if (typeof movie.info4_type === 'string') {
                                    const categoryList = movie.info4_type.split(',').map(c => c.trim());
                                    categoryList.forEach(category => {
                                        if (category) categories.add(category);
                                    });
                                }
                            }
                            
                            if (movie.info3_language) {
                                if (Array.isArray(movie.info3_language)) {
                                    movie.info3_language.forEach(language => {
                                        if (language && typeof language === 'string' && language.trim()) languages.add(language.trim());
                                    });
                                } else if (typeof movie.info3_language === 'string') {
                                    const languageList = movie.info3_language.split(',').map(l => l.trim());
                                    languageList.forEach(language => {
                                        if (language) languages.add(language);
                                    });
                                }
                            }
                        });
                        
                        sidebarCategories = Array.from(categories).sort();
                        sidebarLanguages = Array.from(languages).sort();
                        
                        renderSidebarCategories();
                        renderSidebarLanguages();
                    } catch (cacheError) {
                        console.error("Error loading sidebar from cache:", cacheError);
                    }
                }
            }
        }
        
        // Render Categories in Sidebar
        function renderSidebarCategories() {
            const categoriesList = document.getElementById('categoriesList');
            const categoriesCount = document.getElementById('categoriesCount');
            
            if (!categoriesList) return;
            
            if (sidebarCategories.length === 0) {
                categoriesList.innerHTML = '<div class="sidebar-empty">No categories found</div>';
                if (categoriesCount) categoriesCount.textContent = '0';
                return;
            }
            
            let html = '';
            sidebarCategories.forEach(category => {
                const safeCategory = escapeHtml(category);
                html += `
                    <a href="#" class="sidebar-item" 
                       data-filter="${safeCategory.replace(/'/g, "\\'")}" 
                       data-type="category"
                       onclick="filterByCategory('${safeCategory.replace(/'/g, "\\'")}'); return false;">
                        <i class="fas fa-folder"></i>
                        <span>${safeCategory}</span>
                    </a>
                `;
            });
            
            categoriesList.innerHTML = html;
            if (categoriesCount) categoriesCount.textContent = sidebarCategories.length.toString();
        }
        
        // Render Languages in Sidebar
        function renderSidebarLanguages() {
            const languagesList = document.getElementById('languagesList');
            const languagesCount = document.getElementById('languagesCount');
            
            if (!languagesList) return;
            
            if (sidebarLanguages.length === 0) {
                languagesList.innerHTML = '<div class="sidebar-empty">No languages found</div>';
                if (languagesCount) languagesCount.textContent = '0';
                return;
            }
            
            let html = '';
            sidebarLanguages.forEach(language => {
                const safeLanguage = escapeHtml(language);
                html += `
                    <a href="#" class="sidebar-item" 
                       data-filter="${safeLanguage.replace(/'/g, "\\'")}" 
                       data-type="language"
                       onclick="filterByLanguage('${safeLanguage.replace(/'/g, "\\'")}'); return false;">
                        <i class="fas fa-language"></i>
                        <span>${safeLanguage}</span>
                    </a>
                `;
            });
            
            languagesList.innerHTML = html;
            if (languagesCount) languagesCount.textContent = sidebarLanguages.length.toString();
        }
        
        // Filter by Category
        function filterByCategory(category) {
            currentFilter = category;
            currentFilterType = 'category';
            updateActiveSidebarItem(category, 'category');
            updateSectionTitle();
            filterMovies();
            closeSidebar();
        }
        
        // Filter by Language
        function filterByLanguage(language) {
            currentFilter = language;
            currentFilterType = 'language';
            updateActiveSidebarItem(language, 'language');
            updateSectionTitle();
            filterMovies();
            closeSidebar();
        }
        
        // Filter by New Movies
        function filterByNew() {
            currentFilter = 'new';
            currentFilterType = 'new';
            updateActiveSidebarItem('new', 'new');
            updateSectionTitle();
            filterMovies();
            closeSidebar();
        }
        
        // Filter by Updated Movies
        function filterByUpdated() {
            currentFilter = 'updated';
            currentFilterType = 'updated';
            updateActiveSidebarItem('updated', 'updated');
            updateSectionTitle();
            filterMovies();
            closeSidebar();
        }
        
        // Show All Movies (Home)
        function showAllMovies() {
            currentFilter = 'all';
            currentFilterType = 'home';
            currentSearchQuery = '';
            updateActiveSidebarItem('all', 'home');
            updateSectionTitle();
            loadMovies();
            closeSidebar();
            hideSearchResultsInfo();
        }
        
        // Filter Movies based on current filter
        async function filterMovies() {
            const moviesGrid = document.getElementById('moviesGrid');
            if (!moviesGrid) return;
            
            const t = translations[currentLanguage];
            
            moviesGrid.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>${t.loadingMovies}</p>
                </div>
            `;
            
            try {
                const response = await fetch('data/movies.json');
                const allMovies = await response.json();
                
                let filteredMovies = [];
                
                if (currentFilterType === 'category') {
                    filteredMovies = allMovies.filter(movie => {
                        if (!movie.info4_type) return false;
                        if (Array.isArray(movie.info4_type)) {
                            return movie.info4_type.includes(currentFilter);
                        } else if (typeof movie.info4_type === 'string') {
                            return movie.info4_type.includes(currentFilter);
                        }
                        return false;
                    });
                } else if (currentFilterType === 'language') {
                    filteredMovies = allMovies.filter(movie => {
                        if (!movie.info3_language) return false;
                        if (Array.isArray(movie.info3_language)) {
                            return movie.info3_language.includes(currentFilter);
                        } else if (typeof movie.info3_language === 'string') {
                            return movie.info3_language.includes(currentFilter);
                        }
                        return false;
                    });
                } else if (currentFilterType === 'new') {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    filteredMovies = allMovies.filter(movie => {
                        if (!movie.createdAt) return false;
                        const movieDate = new Date(movie.createdAt);
                        return movieDate >= sevenDaysAgo;
                    });
                } else if (currentFilterType === 'updated') {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    filteredMovies = allMovies.filter(movie => {
                        if (!movie.lastUpdated) return false;
                        const updatedDate = new Date(movie.lastUpdated);
                        return updatedDate >= sevenDaysAgo;
                    });
                } else {
                    filteredMovies = allMovies;
                }
                
                // Sort by creation date
                filteredMovies.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);
                    return dateB - dateA;
                });
                
                // Limit to 20 movies
                filteredMovies = filteredMovies.slice(0, 20);
                
                if (filteredMovies.length === 0) {
                    moviesGrid.innerHTML = `
                        <div class="no-movies">
                            <i class="fas fa-film"></i>
                            <h3>${t.noMovies}</h3>
                            <p>Try a different category or language</p>
                        </div>
                    `;
                    return;
                }
                
                moviesGrid.innerHTML = '';
                let movieCount = 0;
                
                filteredMovies.forEach(movie => {
                    createMovieCard(movie, movieCount);
                    movieCount++;
                });
                
                const loadMoreContainer = document.getElementById('loadMoreContainer');
                if (loadMoreContainer) {
                    loadMoreContainer.style.display = 'none';
                }
                
            } catch (error) {
                console.error("Error filtering movies:", error);
                
                if (!isOnline) {
                    filterMoviesOffline();
                } else {
                    showNotification(t.notificationNetworkError, true);
                    filterMoviesOffline();
                }
            }
        }
        
        // Filter Movies Offline
        function filterMoviesOffline() {
            const moviesGrid = document.getElementById('moviesGrid');
            if (!moviesGrid) return;
            
            const t = translations[currentLanguage];
            const cachedMovies = localStorage.getItem('cachedMovies');
            
            if (!cachedMovies) {
                moviesGrid.innerHTML = `
                    <div class="no-movies">
                        <i class="fas fa-wifi-slash"></i>
                        <h3>${t.noMovies} (Offline)</h3>
                        <p>Connect to the internet to load movies</p>
                    </div>
                `;
                return;
            }
            
            try {
                const movies = JSON.parse(cachedMovies);
                moviesGrid.innerHTML = '';
                
                let movieCount = 0;
                let foundMovies = 0;
                
                movies.forEach(movie => {
                    let shouldInclude = false;
                    
                    if (currentFilterType === 'category' && movie.info4_type) {
                        if (Array.isArray(movie.info4_type)) {
                            shouldInclude = movie.info4_type.includes(currentFilter);
                        } else if (typeof movie.info4_type === 'string') {
                            shouldInclude = movie.info4_type.includes(currentFilter);
                        }
                    } else if (currentFilterType === 'language' && movie.info3_language) {
                        if (Array.isArray(movie.info3_language)) {
                            shouldInclude = movie.info3_language.includes(currentFilter);
                        } else if (typeof movie.info3_language === 'string') {
                            shouldInclude = movie.info3_language.includes(currentFilter);
                        }
                    } else if (currentFilterType === 'new' && movie.createdAt) {
                        const movieDate = new Date(movie.createdAt);
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        shouldInclude = movieDate >= sevenDaysAgo;
                    } else if (currentFilterType === 'updated' && movie.lastUpdated) {
                        const updatedDate = new Date(movie.lastUpdated);
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        shouldInclude = updatedDate >= sevenDaysAgo;
                    }
                    
                    if (shouldInclude) {
                        createMovieCard(movie, movieCount);
                        movieCount++;
                        foundMovies++;
                    }
                });
                
                if (foundMovies === 0) {
                    moviesGrid.innerHTML = `
                        <div class="no-movies">
                            <i class="fas fa-film"></i>
                            <h3>${t.noMovies}</h3>
                            <p>Try a different category or language</p>
                        </div>
                    `;
                }
                
                const loadMoreContainer = document.getElementById('loadMoreContainer');
                if (loadMoreContainer) {
                    loadMoreContainer.style.display = 'none';
                }
                
            } catch (error) {
                console.error("Offline filter error:", error);
                moviesGrid.innerHTML = `
                    <div class="no-movies">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>${t.noMovies}</h3>
                        <p>Error loading movies</p>
                    </div>
                `;
            }
        }
        
        // Update Active Sidebar Item
        function updateActiveSidebarItem(filter, type) {
            const sidebarItems = document.querySelectorAll('.sidebar-item');
            sidebarItems.forEach(item => {
                item.classList.remove('active');
            });
            
            const activeItem = document.querySelector(`.sidebar-item[data-filter="${filter}"][data-type="${type}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            } else if (type === 'home') {
                const homeBtn = document.getElementById('sidebarHomeBtn');
                if (homeBtn) homeBtn.classList.add('active');
            } else if (type === 'new') {
                const newBtn = document.getElementById('sidebarNewBtn');
                if (newBtn) newBtn.classList.add('active');
            } else if (type === 'updated') {
                const updatedBtn = document.getElementById('sidebarUpdatedBtn');
                if (updatedBtn) updatedBtn.classList.add('active');
            }
            
            const categoriesHeader = document.getElementById('categoriesHeader');
            const languagesHeader = document.getElementById('languagesHeader');
            
            if (type === 'category') {
                if (categoriesHeader) categoriesHeader.classList.add('active');
                if (languagesHeader) languagesHeader.classList.remove('active');
            } else if (type === 'language') {
                if (categoriesHeader) categoriesHeader.classList.remove('active');
                if (languagesHeader) languagesHeader.classList.add('active');
            } else {
                if (categoriesHeader) categoriesHeader.classList.remove('active');
                if (languagesHeader) languagesHeader.classList.remove('active');
            }
        }
        
        // Search in Sidebar
        function searchInSidebar(query) {
            const lowerQuery = query.toLowerCase().trim();
            
            if (lowerQuery === '') {
                renderSidebarCategories();
                renderSidebarLanguages();
                const categoriesHeader = document.getElementById('categoriesHeader');
                const languagesHeader = document.getElementById('languagesHeader');
                if (categoriesHeader) categoriesHeader.classList.remove('active');
                if (languagesHeader) languagesHeader.classList.remove('active');
                return;
            }
            
            const normalizedQuery = normalizeText(lowerQuery);
            
            const categoryItems = document.querySelectorAll('.sidebar-item[data-type="category"]');
            let foundCategories = 0;
            
            categoryItems.forEach(item => {
                const text = item.querySelector('span').textContent.toLowerCase();
                const normalizedText = normalizeText(text);
                
                if (normalizedText.includes(normalizedQuery)) {
                    item.style.display = 'flex';
                    foundCategories++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            const languageItems = document.querySelectorAll('.sidebar-item[data-type="language"]');
            let foundLanguages = 0;
            
            languageItems.forEach(item => {
                const text = item.querySelector('span').textContent.toLowerCase();
                const normalizedText = normalizeText(text);
                
                if (normalizedText.includes(normalizedQuery)) {
                    item.style.display = 'flex';
                    foundLanguages++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            const categoriesHeader = document.getElementById('categoriesHeader');
            const languagesHeader = document.getElementById('languagesHeader');
            
            if (foundCategories > 0) {
                categoriesHeader.classList.add('active');
            } else {
                categoriesHeader.classList.remove('active');
            }
            
            if (foundLanguages > 0) {
                languagesHeader.classList.add('active');
            } else {
                languagesHeader.classList.remove('active');
            }
            
            const categoriesList = document.getElementById('categoriesList');
            const languagesList = document.getElementById('languagesList');
            
            if (categoriesList && foundCategories === 0 && lowerQuery) {
                categoriesList.innerHTML = `<div class="sidebar-empty">No categories found for "${escapeHtml(query)}"</div>`;
            }
            
            if (languagesList && foundLanguages === 0 && lowerQuery) {
                languagesList.innerHTML = `<div class="sidebar-empty">No languages found for "${escapeHtml(query)}"</div>`;
            }
        }
        
        // Normalize text for search
        function normalizeText(text) {
            return text.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
        }
        
        // Setup Sidebar Events
        function setupSidebarEvents() {
            const sidebarToggle = document.getElementById('sidebarToggle');
            const sidebarClose = document.getElementById('sidebarClose');
            const sidebar = document.getElementById('sidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', openSidebar);
            }
            
            if (sidebarClose) {
                sidebarClose.addEventListener('click', closeSidebar);
            }
            
            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', closeSidebar);
            }
            
            const categoriesHeader = document.getElementById('categoriesHeader');
            const languagesHeader = document.getElementById('languagesHeader');
            
            if (categoriesHeader) {
                categoriesHeader.addEventListener('click', () => {
                    categoriesHeader.classList.toggle('active');
                    if (categoriesHeader.classList.contains('active')) {
                        languagesHeader.classList.remove('active');
                    }
                });
            }
            
            if (languagesHeader) {
                languagesHeader.addEventListener('click', () => {
                    languagesHeader.classList.toggle('active');
                    if (languagesHeader.classList.contains('active')) {
                        categoriesHeader.classList.remove('active');
                    }
                });
            }
            
            const sidebarSearch = document.getElementById('sidebarSearch');
            if (sidebarSearch) {
                let searchTimeout;
                sidebarSearch.addEventListener('input', function() {
                    clearTimeout(searchTimeout);
                    const query = this.value;
                    
                    searchTimeout = setTimeout(() => {
                        searchInSidebar(query);
                    }, 300);
                });
            }
            
            const homeItem = document.getElementById('sidebarHomeBtn');
            if (homeItem) {
                homeItem.addEventListener('click', function(e) {
                    e.preventDefault();
                    showAllMovies();
                });
            }
            
            const newItem = document.getElementById('sidebarNewBtn');
            if (newItem) {
                newItem.addEventListener('click', function(e) {
                    e.preventDefault();
                    filterByNew();
                });
            }
            
            const updatedItem = document.getElementById('sidebarUpdatedBtn');
            if (updatedItem) {
                updatedItem.addEventListener('click', function(e) {
                    e.preventDefault();
                    filterByUpdated();
                });
            }
        }
        
        // Open Sidebar
        function openSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            
            if (sidebar) sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
            
            document.body.style.overflow = 'hidden';
        }
        
        // Close Sidebar
        function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            
            if (sidebar) sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            
            document.body.style.overflow = '';
            
            const sidebarSearch = document.getElementById('sidebarSearch');
            if (sidebarSearch) sidebarSearch.value = '';
            
            renderSidebarCategories();
            renderSidebarLanguages();
            
            const categoriesHeader = document.getElementById('categoriesHeader');
            const languagesHeader = document.getElementById('languagesHeader');
            if (categoriesHeader) categoriesHeader.classList.remove('active');
            if (languagesHeader) languagesHeader.classList.remove('active');
        }
        
        // Update Sidebar Translations
        function updateSidebarTranslations() {
            const t = translations[currentLanguage];
            
            const elements = [
                { id: 'sidebarHome', text: t.sidebarHome },
                { id: 'sidebarNew', text: t.sidebarNew },
                { id: 'sidebarUpdated', text: t.sidebarUpdated },
                { id: 'categoriesTitle', text: t.categoriesTitle },
                { id: 'languagesTitle', text: t.languagesTitle },
                { id: 'loadingCategories', text: t.loadingCategories },
                { id: 'loadingLanguages', text: t.loadingLanguages }
            ];
            
            elements.forEach(item => {
                const element = document.getElementById(item.id);
                if (element) element.textContent = item.text;
            });
            
            const sidebarSearch = document.getElementById('sidebarSearch');
            if (sidebarSearch) {
                sidebarSearch.placeholder = t.searchSidebarPlaceholder;
            }
        }
        
        // Search Results Info Functions
        function showSearchResultsInfo(count, query) {
            const searchResultsInfo = document.getElementById('searchResultsInfo');
            if (!searchResultsInfo) return;
            
            const t = translations[currentLanguage];
            
            if (count === 0) {
                searchResultsInfo.innerHTML = t.noSearchResults.replace('{query}', escapeHtml(query));
                searchResultsInfo.style.display = 'block';
            } else {
                searchResultsInfo.innerHTML = t.searchResults.replace('{count}', count).replace('{query}', escapeHtml(query));
                searchResultsInfo.style.display = 'block';
            }
        }
        
        function hideSearchResultsInfo() {
            const searchResultsInfo = document.getElementById('searchResultsInfo');
            if (searchResultsInfo) {
                searchResultsInfo.style.display = 'none';
            }
        }
        
        // Load Affiliate Links from JSON
        async function loadAffiliateLinks() {
            try {
                const response = await fetch('config/affiliateLinks.json');
                const data = await response.json();
                
                affiliateLinks = data.links || [];
                affiliateConfig = {
                    enabled: data.enabled !== undefined ? data.enabled : true,
                    redirectDelay: data.redirectDelay || 2000,
                    openInNewTab: data.openInNewTab !== undefined ? data.openInNewTab : true,
                    randomSelection: data.randomSelection !== undefined ? data.randomSelection : true
                };
            } catch (error) {
                console.error("Error loading affiliate links:", error);
                affiliateLinks = [
                    {
                        name: "Monetag",
                        url: "https://monetag.com/visit/?ref=moviehub",
                        weight: 3,
                        enabled: true
                    },
                    {
                        name: "Adsterra",
                        url: "https://adsterra.com/?ref=moviehub",
                        weight: 2,
                        enabled: true
                    },
                    {
                        name: "Bitcoin Ads",
                        url: "https://bitcoin-ads.com/?ref=moviehub",
                        weight: 1,
                        enabled: true
                    }
                ];
            }
        }
        
        // Get Random Affiliate Link
        function getRandomAffiliateLink() {
            if (!affiliateLinks.length || !affiliateConfig.enabled) {
                return null;
            }
            
            const enabledLinks = affiliateLinks.filter(link => link.enabled !== false);
            if (!enabledLinks.length) {
                return null;
            }
            
            if (affiliateConfig.randomSelection) {
                const totalWeight = enabledLinks.reduce((sum, link) => sum + (link.weight || 1), 0);
                let random = Math.random() * totalWeight;
                
                for (const link of enabledLinks) {
                    random -= (link.weight || 1);
                    if (random <= 0) {
                        return link;
                    }
                }
            }
            
            return enabledLinks[0];
        }
        
        // Track Affiliate Click
        async function trackAffiliateClick(affiliateName, movieId) {
            if (!isOnline) return;
            
            console.log(`Affiliate click tracked: ${affiliateName} for movie ${movieId}`);
        }
        
        // Initialize Connection Management System
        function initConnectionManagement() {
            const connectionStatus = document.getElementById('connectionStatus');
            const connectionText = document.getElementById('connectionText');
            
            updateConnectionStatus(isOnline);
            
            const onlineHandler = () => {
                isOnline = true;
                updateConnectionStatus(true);
                
                setTimeout(() => {
                    autoSyncData();
                    processPendingDownloads();
                }, 1000);
            };
            
            const offlineHandler = () => {
                isOnline = false;
                updateConnectionStatus(false);
            };
            
            window.addEventListener('online', onlineHandler);
            window.addEventListener('offline', offlineHandler);
            
            connectionCheckInterval = setInterval(() => {
                checkServerConnection();
            }, 30000);
        }
        
        // Initialize Download System
        function initDownloadSystem() {
            loadLinkGenerators();
            loadLinkPatterns();
            loadFileSizeConfig();
            
            setInterval(() => {
                processDownloadQueue();
            }, 5000);
        }
        
        // Load File Size Configuration from JSON
        async function loadFileSizeConfig() {
            try {
                const response = await fetch('config/fileSizeConfig.json');
                const data = await response.json();
                
                fileSizeConfig = {
                    defaultSizes: data.defaultSizes || fileSizeConfig.defaultSizes,
                    sizeMapping: data.sizeMapping || {}
                };
                
                saveToStorage('fileSizeConfig', fileSizeConfig);
            } catch (error) {
                console.error("Error loading file size config:", error);
                const cachedConfig = localStorage.getItem('fileSizeConfig');
                if (cachedConfig) {
                    try {
                        fileSizeConfig = JSON.parse(cachedConfig);
                    } catch (e) {
                        console.error("Error loading cached file size config:", e);
                    }
                }
            }
        }
        
        // Get File Size from JSON or Cache
        async function getFileSize(movieId, serverName, quality, path, movieData = null) {
            const t = translations[currentLanguage];
            
            const cacheKey = `${movieId}_${serverName}_${quality}`.toLowerCase().replace(/\s+/g, '_');
            
            if (fileSizesCache[cacheKey]) {
                return fileSizesCache[cacheKey];
            }
            
            if (movieData && movieData.downloadOptions) {
                for (const server of movieData.downloadOptions) {
                    if (server.server === serverName && server.qualities) {
                        for (const qualityOption of server.qualities) {
                            if (qualityOption.quality_text === quality && qualityOption.file_size) {
                                fileSizesCache[cacheKey] = qualityOption.file_size;
                                saveToStorage('fileSizesCache', fileSizesCache);
                                return qualityOption.file_size;
                            }
                        }
                    }
                }
            }
            
            if (!isOnline) {
                const defaultSize = getDefaultFileSize(quality);
                return defaultSize || t.loading_file_size;
            }
            
            try {
                const pathSize = await getFileSizeFromPath(path, quality);
                if (pathSize) {
                    fileSizesCache[cacheKey] = pathSize;
                    saveToStorage('fileSizesCache', fileSizesCache);
                    return pathSize;
                }
            } catch (error) {
                console.error("Error getting file size:", error);
            }
            
            const defaultSize = getDefaultFileSize(quality);
            return defaultSize || t.loading_file_size;
        }
        
        // Get File Size from Path Pattern
        async function getFileSizeFromPath(path, quality) {
            if (!path) return null;
            
            try {
                for (const [pattern, size] of Object.entries(fileSizeConfig.sizeMapping)) {
                    if (path.includes(pattern)) {
                        return size;
                    }
                }
                
                if (fileSizeConfig.defaultSizes[quality]) {
                    return fileSizeConfig.defaultSizes[quality];
                }
                
                const sizeMatch = path.match(/(\d+(?:\.\d+)?)\s*(GB|MB|KB)/i);
                if (sizeMatch) {
                    return `${sizeMatch[1]}${sizeMatch[2].toUpperCase()}`;
                }
                
            } catch (error) {
                console.error("Error getting file size from path:", error);
            }
            
            return null;
        }
        
        // Get Default File Size based on Quality
        function getDefaultFileSize(quality) {
            if (!quality) return '1GB';
            
            const qualityLower = quality.toLowerCase();
            
            if (fileSizeConfig.defaultSizes[quality]) {
                return fileSizeConfig.defaultSizes[quality];
            }
            
            for (const [key, size] of Object.entries(fileSizeConfig.defaultSizes)) {
                if (qualityLower.includes(key.toLowerCase())) {
                    return size;
                }
            }
            
            const defaultMappings = {
                '480': '700MB',
                '720': '1.5GB',
                '1080': '3GB',
                '2160': '10GB',
                '4k': '10GB',
                'web': '2GB',
                'bluray': '4GB',
                'hdtv': '1.2GB',
                'hd': '1GB',
                'sd': '500MB'
            };
            
            for (const [key, size] of Object.entries(defaultMappings)) {
                if (qualityLower.includes(key)) {
                    return size;
                }
            }
            
            return '1GB';
        }
        
        // Load Link Generators from JSON
        async function loadLinkGenerators() {
            try {
                const response = await fetch('config/linkGenerators.json');
                const data = await response.json();
                linkGenerators = data.generators || [];
            } catch (error) {
                console.error("Error loading link generators:", error);
                linkGenerators = [
                    {
                        name: "Default Generator",
                        pattern: "{domain}/{path}",
                        priority: 1,
                        enabled: true
                    }
                ];
            }
        }
        
        // Load Link Patterns from JSON
        async function loadLinkPatterns() {
            try {
                const response = await fetch('config/linkPatterns.json');
                const data = await response.json();
                linkPatterns = data.patterns || [];
            } catch (error) {
                console.error("Error loading link patterns:", error);
                linkPatterns = [
                    {
                        pattern: "/movies/{id}/{filename}",
                        type: "direct",
                        priority: 1
                    },
                    {
                        pattern: "/download/{id}/{quality}",
                        type: "direct",
                        priority: 2
                    }
                ];
            }
        }
        
        // Update Connection Status Display
        function updateConnectionStatus(online) {
            const connectionStatus = document.getElementById('connectionStatus');
            const connectionText = document.getElementById('connectionText');
            const t = translations[currentLanguage];
            
            if (!connectionStatus || !connectionText) return;
            
            if (online) {
                connectionStatus.className = 'connection-status online show';
                connectionText.textContent = t.connectionOnline;
                
                setTimeout(() => {
                    if (isOnline) {
                        connectionStatus.classList.remove('show');
                    }
                }, 3000);
            } else {
                connectionStatus.className = 'connection-status offline show';
                connectionText.textContent = t.connectionOffline;
            }
        }
        
        // Show Syncing Status
        function showSyncingStatus() {
            const connectionStatus = document.getElementById('connectionStatus');
            const connectionText = document.getElementById('connectionText');
            const t = translations[currentLanguage];
            
            if (!connectionStatus || !connectionText) return;
            
            connectionStatus.className = 'connection-status syncing show';
            connectionText.textContent = t.connectionSyncing;
        }
        
        // Check Server Connection
        async function checkServerConnection() {
            if (!isOnline) return;
            
            isOnline = true;
            updateConnectionStatus(true);
        }
        
        // Auto Sync Data when connection is restored
        async function autoSyncData() {
            if (!isOnline || !autoUpdateEnabled) return;
            
            showSyncingStatus();
            
            try {
                await Promise.all([
                    checkForMovieUpdates(),
                    checkForSliderUpdates(),
                    checkForConfigUpdates(),
                    syncPendingViews()
                ]);
                
                updateConnectionStatus(true);
                
                if (await checkForUpdates()) {
                    showNotification("Content updated successfully");
                }
                
            } catch (error) {
                console.error("Auto-sync error:", error);
                updateConnectionStatus(true);
            }
        }
        
        // Update File Size Cache
        async function updateFileSizeCache() {
            if (!isOnline) return;
            
            try {
                // JSON ব্যবহার করায় ক্যাশ আপডেটের দরকার নেই
                console.log("File size cache update not needed for JSON");
            } catch (error) {
                console.error("Error updating file size cache:", error);
            }
        }
        
        // Check for any updates
        async function checkForUpdates() {
            try {
                // JSON ব্যবহার করায় সার্ভার আপডেট চেকের দরকার নেই
                return false;
            } catch (error) {
                console.error("Error checking updates:", error);
                return false;
            }
        }
        
        // Check for movie updates
        async function checkForMovieUpdates() {
            if (!isOnline) return;
            
            try {
                const response = await fetch('data/movies.json');
                const movies = await response.json();
                
                if (movies.length > 0) {
                    const latestMovie = movies[0];
                    const latestTimestamp = new Date(latestMovie.createdAt || 0).getTime();
                    
                    localStorage.setItem('lastMovieUpdate', latestTimestamp);
                }
            } catch (error) {
                console.error("Error checking movie updates:", error);
            }
        }
        
        // Check for slider updates
        async function checkForSliderUpdates() {
            if (!isOnline) return;
            
            try {
                await loadSlider();
            } catch (error) {
                console.error("Error checking slider updates:", error);
            }
        }
        
        // Check for config updates
        async function checkForConfigUpdates() {
            if (!isOnline) return;
            
            try {
                await Promise.all([
                    loadGlobalSettings(),
                    loadAdsConfig(),
                    loadSiteConfig(),
                    loadDownloadServers(),
                    loadTimerSettings(),
                    loadLinkGenerators(),
                    loadLinkPatterns(),
                    loadFileSizeConfig(),
                    loadAffiliateLinks(),
                    loadSidebarData()
                ]);
                
                updateSiteLogo();
                loadAds();
                
            } catch (error) {
                console.error("Error checking config updates:", error);
            }
        }
        
        // Sync pending views to Firebase (Mock)
        async function syncPendingViews() {
            if (!isOnline) return;
            
            try {
                const pendingUpdates = loadFromStorage('pendingViewUpdates', []);
                
                if (pendingUpdates.length > 0) {
                    console.log(`Syncing ${pendingUpdates.length} view updates to mock database`);
                    
                    localStorage.removeItem('pendingViewUpdates');
                }
            } catch (error) {
                console.error("Error syncing pending views:", error);
            }
        }
        
        // Initialize App
        async function initializeApp() {
            try {
                await Promise.all([
                    loadGlobalSettings().catch(err => {
                        console.error("Failed to load global settings:", err);
                        globalDomains = [];
                    }),
                    loadAdsConfig().catch(err => {
                        console.error("Failed to load ads config:", err);
                    }),
                    loadSiteConfig().catch(err => {
                        console.error("Failed to load site config:", err);
                    }),
                    loadDownloadServers().catch(err => {
                        console.error("Failed to load download servers:", err);
                        downloadServers = [];
                    }),
                    loadTimerSettings().catch(err => {
                        console.error("Failed to load timer settings:", err);
                        timerDuration = 10;
                        requiredAds = 3;
                    }),
                    loadLinkGenerators().catch(err => {
                        console.error("Failed to load link generators:", err);
                    }),
                    loadLinkPatterns().catch(err => {
                        console.error("Failed to load link patterns:", err);
                    }),
                    loadFileSizeConfig().catch(err => {
                        console.error("Failed to load file size config:", err);
                    }),
                    loadAffiliateLinks().catch(err => {
                        console.error("Failed to load affiliate links:", err);
                    })
                ]);
                
                await loadSlider();
                loadMovies();
                checkMonetagSDK();
                
                lastUpdateCheck = Date.now();
                
            } catch (error) {
                console.error("Failed to initialize app:", error);
                if (isOnline) {
                    showNotification("Failed to initialize app. Please check your connection.", true);
                }
                loadMovies();
            }
        }
        
        // Load Slider Images from JSON
        async function loadSlider() {
            const sliderWrapper = document.getElementById('sliderWrapper');
            const sliderDots = document.getElementById('sliderDots');
            const sliderSection = document.getElementById('sliderSection');
            
            if (!sliderWrapper || !sliderDots || !sliderSection) {
                console.error("Slider elements not found");
                return;
            }
            
            try {
                const t = translations[currentLanguage];
                
                sliderWrapper.innerHTML = '';
                sliderDots.innerHTML = '';
                
                const response = await fetch('data/sliders.json');
                sliderItems = await response.json();
                
                if (sliderItems.length === 0) {
                    sliderWrapper.innerHTML = `
                        <div class="slider-item">
                            <div class="slider-loading">
                                <p>${t.noSlides}</p>
                            </div>
                        </div>
                    `;
                    return;
                }
                
                sliderItems.forEach((slide, index) => {
                    const slideElement = document.createElement('div');
                    slideElement.className = 'slider-item';
                    
                    if (slide.linkUrl && slide.linkUrl.trim() !== '') {
                        slideElement.innerHTML = `
                            <a href="${escapeHtml(slide.linkUrl)}" target="_blank" rel="noopener noreferrer">
                                <img src="${escapeHtml(slide.imageUrl)}" 
                                     alt="Promotional Slide ${index + 1}"
                                     onerror="this.onerror=null; this.src='https://placehold.co/1280x400/cccccc/ffffff?text=Image+Not+Found'">
                            </a>
                        `;
                    } else {
                        slideElement.innerHTML = `
                            <img src="${escapeHtml(slide.imageUrl)}" 
                                 alt="Promotional Slide ${index + 1}"
                                 onerror="this.onerror=null; this.src='https://placehold.co/1280x400/cccccc/ffffff?text=Image+Not+Found'">
                        `;
                    }
                    
                    sliderWrapper.appendChild(slideElement);
                    
                    const dot = document.createElement('div');
                    dot.className = 'slider-dot';
                    dot.dataset.index = index;
                    sliderDots.appendChild(dot);
                });
                
                if (sliderItems.length > 1) {
                    setupSlider();
                } else if (sliderItems.length === 1) {
                    document.querySelector('.slider-dot').classList.add('active');
                }
                
            } catch (error) {
                console.error("Error loading slider:", error);
                if (isOnline) {
                    const t = translations[currentLanguage];
                    sliderWrapper.innerHTML = `
                        <div class="slider-item">
                            <div class="slider-error">
                                <i class="fas fa-exclamation-circle"></i>
                                <p>${t.slidesError}</p>
                                <p><small>Please try again later</small></p>
                            </div>
                        </div>
                    `;
                }
            }
        }
        
        // Setup Slider Functionality
        function setupSlider() {
            const sliderWrapper = document.getElementById('sliderWrapper');
            const sliderDots = document.getElementById('sliderDots');
            const dots = sliderDots.querySelectorAll('.slider-dot');
            const prevBtn = document.getElementById('sliderPrev');
            const nextBtn = document.getElementById('sliderNext');
            const sliderContainer = document.getElementById('sliderContainer');
            
            if (!sliderWrapper || sliderItems.length <= 1) return;
            
            if (sliderInterval) {
                clearInterval(sliderInterval);
            }
            
            currentSlide = 0;
            updateSlider();
            
            sliderInterval = setInterval(() => {
                nextSlide();
            }, 5000);
            
            // Remove old event listeners and add new ones
            const newPrevBtn = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
            newPrevBtn.addEventListener('click', () => {
                prevSlide();
                resetAutoSlide();
            });
            
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            newNextBtn.addEventListener('click', () => {
                nextSlide();
                resetAutoSlide();
            });
            
            dots.forEach((dot, index) => {
                const newDot = dot.cloneNode(true);
                dot.parentNode.replaceChild(newDot, dot);
                newDot.addEventListener('click', () => {
                    const slideIndex = parseInt(newDot.dataset.index);
                    goToSlide(slideIndex);
                    resetAutoSlide();
                });
            });
            
            if (sliderContainer) {
                sliderContainer.onmouseenter = null;
                sliderContainer.onmouseleave = null;
                
                const mouseEnterHandler = () => {
                    if (sliderInterval) {
                        clearInterval(sliderInterval);
                    }
                };
                
                const mouseLeaveHandler = () => {
                    resetAutoSlide();
                };
                
                sliderContainer.addEventListener('mouseenter', mouseEnterHandler);
                sliderContainer.addEventListener('mouseleave', mouseLeaveHandler);
            }
            
            sliderInitialized = true;
        }
        
        // Go to specific slide
        function goToSlide(slideIndex) {
            if (slideIndex < 0) slideIndex = sliderItems.length - 1;
            if (slideIndex >= sliderItems.length) slideIndex = 0;
            
            currentSlide = slideIndex;
            updateSlider();
        }
        
        // Go to next slide
        function nextSlide() {
            goToSlide(currentSlide + 1);
        }
        
        // Go to previous slide
        function prevSlide() {
            goToSlide(currentSlide - 1);
        }
        
        // Update slider position and active dot
        function updateSlider() {
            const sliderWrapper = document.getElementById('sliderWrapper');
            const dots = document.querySelectorAll('.slider-dot');
            
            if (!sliderWrapper) return;
            
            sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            dots.forEach((dot, index) => {
                if (index === currentSlide) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
        
        // Reset auto slide timer
        function resetAutoSlide() {
            if (sliderInterval) {
                clearInterval(sliderInterval);
            }
            
            if (sliderItems.length > 1) {
                sliderInterval = setInterval(() => {
                    nextSlide();
                }, 5000);
            }
        }
        
        // Clean up slider resources
        function cleanupSlider() {
            if (sliderInterval) {
                clearInterval(sliderInterval);
                sliderInterval = null;
            }
            
            if (currentSwiper) {
                currentSwiper.destroy();
                currentSwiper = null;
            }
        }
        
        // Language Functions
        function setLanguage(lang) {
            try {
                currentLanguage = lang;
                localStorage.setItem('movieAppLanguage', lang);
                
                const t = translations[lang];
                
                const elements = [
                    { id: 'currentLang', text: t.language },
                    { id: 'appTitle', text: t.appTitle },
                    { id: 'sectionTitle', text: t.sectionTitle },
                    { id: 'loadingText', text: t.loadingMovies },
                    { id: 'loadMoreText', text: t.loadMore },
                    { id: 'screenshotsTitle', text: t.screenshots },
                    { id: 'downloadTitle', text: t.downloadOptions },
                    { id: 'loadingOptions', text: t.loadingOptions },
                    { id: 'sidebarHome', text: t.sidebarHome },
                    { id: 'sidebarNew', text: t.sidebarNew },
                    { id: 'sidebarUpdated', text: t.sidebarUpdated },
                    { id: 'backToHomeText', text: t.backToHome }
                ];
                
                elements.forEach(item => {
                    const element = document.getElementById(item.id);
                    if (element) {
                        element.textContent = item.text;
                    }
                });
                
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.placeholder = t.searchPlaceholder;
                }
                
                updateConnectionStatus(isOnline);
                updateFooter();
                updateMovieCardsLanguage();
                updateSidebarTranslations();
                loadSlider();
                
                updateSectionTitle();
                
                const backToTopBtn = document.getElementById('backToTop');
                if (backToTopBtn) {
                    backToTopBtn.title = t.backToTop;
                }
                
            } catch (error) {
                console.error("Error in setLanguage:", error);
            }
        }
        
        function updateFooter() {
            try {
                const t = translations[currentLanguage];
                const footerText = document.querySelector('.footer-text');
                if (footerText) {
                    footerText.innerHTML = `${t.footerText.replace('{siteName}', siteConfig.siteName)}<br><small>${t.disclaimer}</small>`;
                }
                
                const footerSiteName = document.getElementById('footerSiteName');
                if (footerSiteName) {
                    footerSiteName.textContent = siteConfig.siteName;
                }
            } catch (error) {
                console.error("Error updating footer:", error);
            }
        }
        
        function updateMovieCardsLanguage() {
            const t = translations[currentLanguage];
            const viewElements = document.querySelectorAll('.views-count span');
            
            viewElements.forEach(element => {
                const text = element.textContent;
                const match = text.match(/([\d.]+[KMB]?)\s*/);
                if (match) {
                    element.textContent = `${match[1]} ${t.views}`;
                }
            });
            
            const statusElements = document.querySelectorAll('.status span');
            statusElements.forEach(element => {
                if (element.textContent.toLowerCase().includes('status') || element.textContent === 'স্ট্যাটাস') {
                    element.textContent = t.status;
                }
            });
            
            // Update share button texts
            const shareButtons = document.querySelectorAll('.copy-link-btn');
            shareButtons.forEach(button => {
                const movieType = button.getAttribute('data-type') || 'movie';
                const typeText = movieType === 'series' ? t.seriesType : t.movieType;
                const span = button.querySelector('span');
                if (span) {
                    span.textContent = t.shareText.replace('{type}', typeText);
                }
            });
        }
        
        function toggleLanguage() {
            const newLang = currentLanguage === 'en' ? 'bn' : 'en';
            setLanguage(newLang);
            reloadMoviesWithCurrentLanguage();
        }
        
        // Reload movies with current language
        async function reloadMoviesWithCurrentLanguage() {
            try {
                const scrollPos = window.scrollY;
                
                const response = await fetch('data/movies.json');
                const movies = await response.json();
                
                const moviesGrid = document.getElementById('moviesGrid');
                if (!moviesGrid) return;
                
                moviesGrid.innerHTML = '';
                
                let movieCount = 0;
                
                // Sort by creation date
                const sortedMovies = [...movies].sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);
                    return dateB - dateA;
                }).slice(0, 10);
                
                sortedMovies.forEach(movie => {
                    createMovieCard(movie, movieCount);
                    movieCount++;
                });
                
                setTimeout(() => {
                    window.scrollTo(0, scrollPos);
                }, 100);
                
            } catch (error) {
                console.error("Error reloading movies:", error);
            }
        }
        
        // Load Download Servers from JSON
        async function loadDownloadServers() {
            try {
                const response = await fetch('config/downloadServers.json');
                const data = await response.json();
                downloadServers = data.servers || [];
            } catch (error) {
                console.error("Error loading download servers:", error);
                downloadServers = [];
            }
        }
        
        // Load Global Settings from JSON
        async function loadGlobalSettings() {
            try {
                const response = await fetch('config/config.json');
                const data = await response.json();
                
                if (data.settings && data.settings.globalDomains && Array.isArray(data.settings.globalDomains)) {
                    globalDomains = data.settings.globalDomains
                        .map(d => {
                            if (typeof d === 'string') {
                                return { url: d, priority: 1 };
                            }
                            if (d && typeof d === 'object') {
                                return {
                                    url: d.url || d,
                                    priority: d.priority || 1
                                };
                            }
                            return null;
                        })
                        .filter(d => d && d.url && d.url.trim())
                        .sort((a, b) => a.priority - b.priority)
                        .map(d => d.url.replace(/\/$/, ''));
                } else {
                    globalDomains = [];
                }
            } catch (error) {
                console.error("Error loading global settings:", error);
                globalDomains = [];
            }
        }
        
        // Get Download URL
        function getDownloadUrl(path, serverName = '', movieData = null) {
            if (!path || typeof path !== 'string') return '';
            
            if (path.startsWith('http://') || path.startsWith('https://')) {
                return path;
            }
            
            let finalUrl = '';
            
            if (serverName && downloadServers && downloadServers.length > 0) {
                const server = downloadServers.find(s => s && s.name === serverName);
                if (server && server.domains && Array.isArray(server.domains) && server.domains.length > 0) {
                    const sortedDomains = [...server.domains]
                        .map(d => {
                            if (typeof d === 'string') {
                                return { url: d, priority: 1 };
                            }
                            return { url: d.url || d, priority: d.priority || 1 };
                        })
                        .filter(d => d.url && d.url.trim())
                        .sort((a, b) => a.priority - b.priority);
                    
                    for (const domain of sortedDomains) {
                        if (domain.url && domain.url.trim()) {
                            const cleanDomain = domain.url.replace(/\/$/, '');
                            const cleanPath = path.startsWith('/') ? path : '/' + path;
                            finalUrl = cleanDomain + cleanPath;
                            break;
                        }
                    }
                }
            }
            
            if (!finalUrl && globalDomains && globalDomains.length > 0) {
                for (const domain of globalDomains) {
                    if (domain && domain.trim()) {
                        const cleanDomain = domain.replace(/\/$/, '');
                        const cleanPath = path.startsWith('/') ? path : '/' + path;
                        finalUrl = cleanDomain + cleanPath;
                        break;
                    }
                }
            }
            
            if (!finalUrl && movieData) {
                finalUrl = generateDownloadLink(path, serverName, movieData);
            }
            
            return finalUrl || path;
        }
        
        // Generate Download Link using patterns
        function generateDownloadLink(path, serverName, movieData) {
            const t = translations[currentLanguage];
            
            for (const pattern of linkPatterns) {
                try {
                    let generatedPath = pattern.pattern;
                    
                    if (movieData.id) {
                        generatedPath = generatedPath.replace(/{id}/g, movieData.id);
                    }
                    if (movieData.title) {
                        const safeTitle = movieData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
                        generatedPath = generatedPath.replace(/{title}/g, safeTitle);
                    }
                    if (path) {
                        generatedPath = generatedPath.replace(/{path}/g, path);
                    }
                    if (serverName) {
                        generatedPath = generatedPath.replace(/{server}/g, serverName.toLowerCase());
                    }
                    
                    const domains = [...globalDomains];
                    if (serverName && downloadServers) {
                        const server = downloadServers.find(s => s && s.name === serverName);
                        if (server && server.domains) {
                            domains.unshift(...server.domains.map(d => typeof d === 'string' ? d : d.url));
                        }
                    }
                    
                    for (const domain of domains) {
                        if (domain && domain.trim()) {
                            const cleanDomain = domain.replace(/\/$/, '');
                            const cleanPath = generatedPath.startsWith('/') ? generatedPath : '/' + generatedPath;
                            return cleanDomain + cleanPath;
                        }
                    }
                } catch (error) {
                    console.error("Error generating link:", error);
                }
            }
            
            return '';
        }
        
        // Get File Extension from path
        function getFileExtension(path) {
            if (!path) return '';
            const parts = path.split('.');
            return parts.length > 1 ? '.' + parts.pop().toLowerCase() : '';
        }
        
        // Get Download Type
        function getDownloadType(path) {
            const ext = getFileExtension(path);
            if (ext === '.mpd' || ext === '.m3u8') {
                return 'streaming';
            }
            return 'direct';
        }
        
        // Load Timer Settings from JSON
        async function loadTimerSettings() {
            try {
                const response = await fetch('config/config.json');
                const data = await response.json();
                
                if (data.settings) {
                    timerDuration = data.settings.timerDuration || 10;
                    requiredAds = data.settings.requiredAds || 3;
                }
            } catch (error) {
                console.error("Could not fetch timer settings, using defaults.", error);
            }
        }
        
        // Check Monetag SDK
        function checkMonetagSDK() {
            monetagSDKLoaded = false;
            console.log("Monetag SDK check bypassed for JSON version");
        }
        
        // Load Site Config from JSON
        async function loadSiteConfig() {
            try {
                const response = await fetch('config/config.json');
                const data = await response.json();
                
                if (data.siteConfig) {
                    siteConfig.siteName = data.siteConfig.siteName || "Dub Fusion Hub";
                    siteConfig.siteLogoUrl = data.siteConfig.siteLogoUrl || "";
                    siteConfig.showLogo = data.siteConfig.showLogo || false;
                    siteConfig.placeholderImage = data.siteConfig.placeholderImage || "https://via.placeholder.com/300x450/1a1a2e/ffffff?text=No+Image";
                    siteConfig.enablePosterBlur = data.siteConfig.enablePosterBlur || false;
                    siteConfig.blurPercentage = data.siteConfig.blurPercentage || 10;
                    siteConfig.showInfo5Views = data.siteConfig.showInfo5Views !== undefined ? data.siteConfig.showInfo5Views : true;
                    
                    updateSiteLogo();
                    updateFooter();
                }
            } catch (error) {
                console.error("Error loading site config:", error);
            }
        }
        
        // Update Site Logo
        function updateSiteLogo() {
            try {
                const logoElement = document.getElementById('siteLogo');
                const appTitleElement = document.getElementById('appTitle');
                
                if (!logoElement) return;
                
                logoElement.innerHTML = '';
                
                if (siteConfig.showLogo && siteConfig.siteLogoUrl) {
                    const logoImg = document.createElement('img');
                    logoImg.src = siteConfig.siteLogoUrl;
                    logoImg.alt = siteConfig.siteName;
                    logoImg.style.height = '40px';
                    logoImg.style.width = 'auto';
                    logoImg.style.objectFit = 'contain';
                    logoElement.appendChild(logoImg);
                } else {
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-film';
                    icon.style.color = 'var(--highlight)';
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = siteConfig.siteName;
                    nameSpan.id = 'appTitle';
                    
                    logoElement.appendChild(icon);
                    logoElement.appendChild(nameSpan);
                }
                
                if (appTitleElement) {
                    appTitleElement.textContent = siteConfig.siteName;
                }
            } catch (error) {
                console.error("Error updating site logo:", error);
            }
        }
        
        // Load Ads Config from JSON
        async function loadAdsConfig() {
            try {
                const response = await fetch('config/adsConfig.json');
                const data = await response.json();
                
                adsConfig = {
                    ads1: data.ads1 || { enabled: true, code: '' },
                    ads2: data.ads2 || { enabled: true, code: '' },
                    ads3: data.ads3 || { enabled: true, code: '' },
                    ads4: data.ads4 || { enabled: true, code: '' },
                    ads5: data.ads5 || { enabled: true, code: '' },
                    ads6: data.ads6 || { enabled: true, code: '' }
                };
                
                loadAds();
            } catch (error) {
                console.error("Error loading ads config:", error);
                loadAds();
            }
        }
        
        // Load Ads
        function loadAds() {
            try {
                for (let i = 1; i <= 6; i++) {
                    if (i === 4) continue;
                    
                    const container = document.getElementById(`ads${i}-container`);
                    const adElement = document.getElementById(`ads${i}`);
                    
                    if (container && adElement) {
                        const adConfig = adsConfig[`ads${i}`];
                        if (adConfig && adConfig.enabled && adConfig.code) {
                            container.style.display = 'block';
                            adElement.innerHTML = adConfig.code;
                        } else {
                            container.style.display = 'none';
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading ads:", error);
            }
        }
        
        // Show Unlock Ad
        async function showUnlockAd() {
            if (!monetagSDKLoaded) {
                throw new Error("SDK not loaded");
            }
            
            return new Promise((resolve, reject) => {
                try {
                    // Mock ad show for JSON version
                    setTimeout(() => {
                        resolve();
                    }, 1000);
                } catch (error) {
                    reject(error);
                }
            });
        }
        
        // Load Movies
        async function loadMovies(loadMore = false) {
            const moviesGrid = document.getElementById('moviesGrid');
            if (!moviesGrid) return;
            
            const t = translations[currentLanguage];
            
            if (!loadMore) {
                moviesGrid.innerHTML = `
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>${t.loadingMovies}</p>
                    </div>
                `;
            }
            
            if (!isOnline && !loadMore) {
                const cachedMovies = localStorage.getItem('cachedMovies');
                if (cachedMovies) {
                    try {
                        const movies = JSON.parse(cachedMovies);
                        moviesGrid.innerHTML = '';
                        
                        movies.forEach((movie, index) => {
                            createMovieCard(movie, index);
                        });
                        
                        showNotification("You are offline. Showing cached content.", true);
                        return;
                    } catch (error) {
                        console.error("Error loading cached movies:", error);
                    }
                }
            }
            
            try {
                const response = await fetch('data/movies.json');
                const allMovies = await response.json();
                
                // Sort by creation date
                const sortedMovies = [...allMovies].sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);
                    return dateB - dateA;
                });
                
                // Load more logic
                let moviesToShow = [];
                if (loadMore && lastVisible !== null) {
                    // Find the index of lastVisible movie
                    const lastVisibleIndex = sortedMovies.findIndex(movie => movie.id === lastVisible.id);
                    if (lastVisibleIndex !== -1) {
                        moviesToShow = sortedMovies.slice(lastVisibleIndex + 1, lastVisibleIndex + 11);
                    } else {
                        moviesToShow = sortedMovies.slice(0, 10);
                    }
                } else {
                    moviesToShow = sortedMovies.slice(0, 10);
                }
                
                if (moviesToShow.length === 0) {
                    if (!loadMore) {
                        moviesGrid.innerHTML = `
                            <div class="no-movies">
                                <i class="fas fa-film"></i>
                                <h3>${t.noMovies}</h3>
                                <p>Check back later for new movies</p>
                            </div>
                        `;
                    }
                    const loadMoreBtn = document.getElementById('loadMoreBtn');
                    if (loadMoreBtn) loadMoreBtn.disabled = true;
                    return;
                }
                
                if (!loadMore) {
                    moviesGrid.innerHTML = '';
                }
                
                let movieCount = 0;
                
                moviesToShow.forEach(movie => {
                    createMovieCard(movie, movieCount);
                    movieCount++;
                });
                
                if (!loadMore) {
                    saveToStorage('cachedMovies', sortedMovies.slice(0, 20));
                }
                
                if (moviesToShow.length > 0) {
                    lastVisible = moviesToShow[moviesToShow.length - 1];
                }
                
                const loadMoreBtn = document.getElementById('loadMoreBtn');
                if (loadMoreBtn) {
                    loadMoreBtn.disabled = moviesToShow.length < 10;
                }
                
                const loadMoreContainer = document.getElementById('loadMoreContainer');
                if (loadMoreContainer) {
                    loadMoreContainer.style.display = 'block';
                }
                
            } catch (error) {
                console.error("Error loading movies:", error);
                
                if (isOnline) {
                    showNotification(t.notificationNetworkError, true);
                }
                
                if (!loadMore) {
                    const cachedMovies = localStorage.getItem('cachedMovies');
                    if (cachedMovies) {
                        try {
                            const movies = JSON.parse(cachedMovies);
                            const moviesGrid = document.getElementById('moviesGrid');
                            if (moviesGrid) {
                                moviesGrid.innerHTML = '';
                                
                                movies.forEach((movie, index) => {
                                    createMovieCard(movie, index);
                                });
                            }
                        } catch (cacheError) {
                            console.error("Error loading cached movies:", cacheError);
                        }
                    }
                }
            }
        }
        
        // Create Movie Card
        function createMovieCard(movie, index) {
            const moviesGrid = document.getElementById('moviesGrid');
            if (!moviesGrid) return;
            
            const t = translations[currentLanguage];
            
            if (index > 0 && index % 5 === 0 && adsConfig.ads3.enabled && adsConfig.ads3.code) {
                const adContainer = document.createElement('div');
                adContainer.className = 'ads-section';
                adContainer.style.gridColumn = '1 / -1';
                adContainer.innerHTML = `
                    <div class="ads-container ads-square">
                        ${adsConfig.ads3.code}
                    </div>
                `;
                moviesGrid.appendChild(adContainer);
            }
            
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.dataset.id = movie.id;
            card.id = `movie-${movie.id}`;
            
            const posterUrl = movie.imageUrl || siteConfig.placeholderImage;
            
            const totalViews = Number(movie.total_views) || 0;
            const info5Views = Number(movie.info5_views) || 0;
            const serverViews = totalViews + info5Views;
            
            let customBadgeText = '';
            if (movie.info1_custom) {
                customBadgeText = movie.info1_custom;
            } else if (movie.isNewPost && isWithinDays(movie.createdAt, 7)) {
                customBadgeText = 'NEW';
            } else if (movie.lastUpdated && isWithinDays(movie.lastUpdated, 7)) {
                customBadgeText = 'UPDATED';
            }
            
            const shouldApplyBlur = (movie.enablePosterBlur !== undefined ? movie.enablePosterBlur : siteConfig.enablePosterBlur);
            const blurValue = (movie.enablePosterBlur !== undefined ? movie.blurPercentage : siteConfig.blurPercentage) || 10;
            
            // Determine movie type
            const movieType = (movie.info4_type && movie.info4_type.toLowerCase().includes('series')) ? 'series' : 'movie';
            const typeText = movieType === 'series' ? t.seriesType : t.movieType;
            const shareText = t.shareText.replace('{type}', typeText);
            
            card.innerHTML = `
                <div class="movie-poster">
                    <img src="${escapeHtml(posterUrl)}" alt="${escapeHtml(movie.title || 'Movie')}" loading="lazy" 
                         style="${shouldApplyBlur ? `filter: blur(${blurValue}px);` : ''}"
                         onerror="this.onerror=null; this.src='${escapeHtml(siteConfig.placeholderImage)}'; this.style.filter='none'">
                    
                    ${shouldApplyBlur ? `
                        <div class="blur-overlay">
                            <div class="blur-text">🔞 18+ Adult</div>
                        </div>
                    ` : ''}
                    
                    <div class="movie-info-overlay">
                        ${customBadgeText ? `
                            <span class="info-badge info-custom">
                                ${escapeHtml(customBadgeText)}
                            </span>
                        ` : ''}
                        <span class="info-badge info-quality">
                            ${escapeHtml(movie.info2_quality || 'HD')}
                        </span>
                    </div>
                    ${hasNewServerWithinDays(movie, 7) ? `
                        <span class="info-badge info-new-server">
                            ${escapeHtml(t.newServer)}
                        </span>
                    ` : ''}
                    <div class="movie-info-bottom">
                        <span class="info-badge info-language">
                            ${escapeHtml(movie.info3_language || t.languageText)}
                        </span>
                        <span class="info-badge info-type">
                            ${escapeHtml(movie.info4_type || t.type)}
                        </span>
                    </div>
                </div>
                <div class="movie-details">
                    <h3 class="movie-title">${escapeHtml(movie.title || 'Untitled Movie')}</h3>
                    <div class="movie-meta">
                        <div class="views-count">
                            <i class="fas fa-eye"></i>
                            <span>${formatViewCount(serverViews)} ${t.views}</span>
                        </div>
                        <div class="status">
                            <i class="fas fa-circle"></i>
                            <span>${escapeHtml(movie.info6_status || 'Online')}</span>
                        </div>
                    </div>
                    <!-- Share/Copy Link Button -->
                    <div class="movie-card-actions">
                        <button class="card-action-btn copy-link-btn" 
                                data-id="${movie.id}" 
                                data-title="${escapeHtml(movie.title || 'Untitled Movie')}" 
                                data-type="${movieType}"
                                onclick="copyMovieLink('${movie.id}', '${escapeHtml(movie.title || 'Untitled Movie')}', '${movieType}')">
                            <i class="fas fa-share-alt share-icon"></i>
                            <span>${escapeHtml(shareText)}</span>
                        </button>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.copy-link-btn')) {
                    incrementViewCount(movie.id);
                    openMovieModal(movie);
                }
            });
            
            moviesGrid.appendChild(card);
        }
        
        // Format view count
        function formatViewCount(count) {
            count = Number(count) || 0;
            if (count >= 1000000) {
                return (count / 1000000).toFixed(1) + 'M';
            }
            if (count >= 1000) {
                return (count / 1000).toFixed(1) + 'K';
            }
            return count.toString();
        }
        
        // Check if within specific days
        function isWithinDays(timestamp, days) {
            if (!timestamp) return false;
            let date;
            try {
                date = new Date(timestamp);
                if (isNaN(date.getTime())) return false;
            } catch (e) {
                return false;
            }
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= days;
        }
        
        // Check if has new server within days
        function hasNewServerWithinDays(movie, days) {
            if (!movie.downloadOptions || !movie.serverAddedDate) return false;
            
            const serverDate = movie.serverAddedDate;
            if (Array.isArray(serverDate)) {
                for (const date of serverDate) {
                    if (isWithinDays(date, days)) {
                        return true;
                    }
                }
            } else if (isWithinDays(serverDate, days)) {
                return true;
            }
            
            return false;
        }
        
        // Increment View Count
        async function incrementViewCount(movieId) {
            const today = new Date().toDateString();
            
            if (!dailyViews[today]) {
                dailyViews[today] = {};
            }
            
            if (!dailyViews[today][movieId]) {
                movieViews[movieId] = (movieViews[movieId] || 0) + 1;
                dailyViews[today][movieId] = true;
                
                saveToStorage('movieViews', movieViews);
                saveToStorage('dailyViews', dailyViews);
                
                if (isOnline) {
                    try {
                        console.log(`View incremented for movie: ${movieId}`);
                    } catch (error) {
                        console.error("Error updating view count:", error);
                        const pendingUpdates = loadFromStorage('pendingViewUpdates', []);
                        pendingUpdates.push({
                            movieId: movieId,
                            timestamp: Date.now()
                        });
                        saveToStorage('pendingViewUpdates', pendingUpdates);
                    }
                } else {
                    const pendingUpdates = loadFromStorage('pendingViewUpdates', []);
                    pendingUpdates.push({
                        movieId: movieId,
                        timestamp: Date.now()
                    });
                    saveToStorage('pendingViewUpdates', pendingUpdates);
                }
            }
        }
        
        // Open Movie Modal
        async function openMovieModal(movie) {
            currentMovieId = movie.id;
            const t = translations[currentLanguage];
            
            const modalMovieTitle = document.getElementById('modalMovieTitle');
            const modalMovieSubtitle = document.getElementById('modalMovieSubtitle');
            const modalTypeValue = document.getElementById('modalTypeValue');
            const modalLanguageValue = document.getElementById('modalLanguageValue');
            const modalQualityValue = document.getElementById('modalQualityValue');
            
            if (modalMovieTitle) modalMovieTitle.textContent = movie.title || 'Untitled Movie';
            
            let subtitle = '';
            if (movie.info_subtitle && movie.info_subtitle.trim() !== '') {
                subtitle = movie.info_subtitle;
            } else {
                subtitle = (movie.info2_quality || 'WEB-DL') + ' | ' + (movie.info4_type || 'Movie');
            }
            if (modalMovieSubtitle) modalMovieSubtitle.textContent = subtitle;
            
            if (modalTypeValue) modalTypeValue.textContent = movie.info4_type || 'Movie';
            if (modalLanguageValue) modalLanguageValue.textContent = movie.info3_language || 'Dual [Hindi–Tamil]';
            if (modalQualityValue) modalQualityValue.textContent = movie.info2_quality || 'WEB-DL';
            
            const details = {
                'modalIMDb': movie.imdb || 'N/A',
                'modalGenre': movie.genre || 'N/A',
                'modalLanguageDetail': movie.info3_language || 'N/A',
                'modalQualityDetail': movie.info2_quality || 'N/A',
                'modalResolution': movie.resolution || 'N/A',
                'modalReleased': movie.released || 'N/A',
                'modalCast': movie.cast || 'N/A',
                'modalStoryline': movie.storyline || 'No storyline available.'
            };
            
            Object.keys(details).forEach(key => {
                const element = document.getElementById(key);
                if (element) element.textContent = details[key];
            });
            
            const screenshotsSection = document.getElementById('screenshotsSection');
            const screenshotsWrapper = document.getElementById('screenshotsWrapper');
            if (screenshotsSection && screenshotsWrapper) {
                screenshotsWrapper.innerHTML = '';
                
                if (movie.screenshotLinks && movie.screenshotLinks.length > 0) {
                    screenshotsSection.style.display = 'block';
                    movie.screenshotLinks.forEach(link => {
                        const slide = document.createElement('div');
                        slide.className = 'swiper-slide';
                        slide.innerHTML = `<img src="${escapeHtml(link)}" alt="Screenshot" loading="lazy" onerror="this.style.display='none'">`;
                        screenshotsWrapper.appendChild(slide);
                    });
                    
                    if (currentSwiper) {
                        currentSwiper.destroy();
                        currentSwiper = null;
                    }
                    
                    setTimeout(() => {
                        try {
                            currentSwiper = new Swiper('#screenshotsSwiper', {
                                navigation: {
                                    nextEl: '.swiper-button-next',
                                    prevEl: '.swiper-button-prev',
                                },
                                loop: true,
                                autoplay: {
                                    delay: 3000,
                                    disableOnInteraction: false,
                                },
                            });
                        } catch (error) {
                            console.error("Swiper initialization error:", error);
                        }
                    }, 100);
                } else {
                    screenshotsSection.style.display = 'none';
                }
            }
            
            const ads2Container = document.getElementById('ads2-container');
            const ads2Element = document.getElementById('ads2');
            if (ads2Container && ads2Element) {
                if (adsConfig.ads2 && adsConfig.ads2.enabled && adsConfig.ads2.code) {
                    ads2Container.style.display = 'block';
                    ads2Element.innerHTML = adsConfig.ads2.code;
                } else {
                    ads2Container.style.display = 'none';
                }
            }
            
            loadDownloadOptions(movie);
            
            const modal = document.getElementById('movieModal');
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }
        
        // Load Download Options
        async function loadDownloadOptions(movie) {
            const downloadOptionsContainer = document.getElementById('downloadOptions');
            if (!downloadOptionsContainer) return;
            
            const t = translations[currentLanguage];
            
            // Check if movie unlock has expired
            const isExpired = isMovieUnlockExpired(movie.id);
            
            // Reset progress if expired
            if (isExpired) {
                adCounts[movie.id] = 0;
                delete unlockedMovies[movie.id];
                delete movieUnlockTimestamps[movie.id];
                
                saveToStorage('adCounts', adCounts);
                saveToStorage('unlockedMovies', unlockedMovies);
                saveToStorage('movieUnlockTimestamps', movieUnlockTimestamps);
            }
            
            const adCount = adCounts[movie.id] || 0;
            const isUnlocked = unlockedMovies[movie.id] && !isExpired;
            
            if (!movie.downloadOptions || movie.downloadOptions.length === 0) {
                downloadOptionsContainer.innerHTML = `
                    <div class="no-movies">
                        <i class="fas fa-download"></i>
                        <h3>${t.noDownloadOptions}</h3>
                        <p>Download options will be available soon</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            
            for (const [serverIndex, server] of movie.downloadOptions.entries()) {
                const isNewServer = checkIfNewServer(movie, serverIndex);
                const serverName = server.server || 'Server';
                
                html += `
                    <div class="download-server">
                        <div class="server-title">
                            <i class="fas fa-server"></i>
                            <span>${escapeHtml(serverName)}</span>
                            ${isNewServer ? `<span class="new-server-badge">${t.newServer}</span>` : ''}
                        </div>
                        <div class="quality-options">
                `;
                
                if (server.qualities && server.qualities.length > 0) {
                    for (const [qualityIndex, quality] of server.qualities.entries()) {
                        const optionId = `option_${movie.id}_${serverIndex}_${qualityIndex}`;
                        const downloadType = getDownloadType(quality.path);
                        const downloadTypeText = downloadType === 'streaming' ? t.streaming : t.direct_download;
                        
                        const fileSize = quality.file_size ? quality.file_size : 
                                        await getFileSize(movie.id, serverName, quality.quality_text, quality.path, movie);
                        
                        if (isUnlocked) {
                            const downloadUrl = getDownloadUrl(quality.path, serverName, movie);
                            
                            html += `
                                <div class="quality-option unlocked" id="${optionId}">
                                    <div class="quality-text">${escapeHtml(quality.quality_text || 'Quality')}</div>
                                    <div class="download-link-details">
                                        <div class="file-size">
                                            <i class="fas fa-hdd"></i>
                                            <span>${t.file_size}: ${escapeHtml(fileSize)}</span>
                                        </div>
                                        <span class="download-type">${downloadTypeText}</span>
                                    </div>
                                    <a href="javascript:void(0)" 
                                        class="download-btn" 
                                        data-download-url="${escapeHtml(downloadUrl)}"
                                        onclick="startDownload('${movie.id}', '${escapeHtml(serverName)}', '${escapeHtml(quality.quality_text || 'Quality')}', this, event)"
                                        oncontextmenu="return false;">
                                        <i class="fas fa-download"></i> ${t.download_now_button}
                                    </a>
                                    <div class="download-progress" id="progress_${optionId}">
                                        <div class="download-progress-bar"></div>
                                    </div>
                                    
                                    <div class="link-generated" id="link_generated_${optionId}">
                                        <i class="fas fa-check-circle"></i> ${t.link_generated}
                                    </div>
                                </div>
                            `;
                        } else {
                            html += `
                                <div class="quality-option locked" id="${optionId}">
                                    <div class="quality-text">${escapeHtml(quality.quality_text || 'Quality')}</div>
                                    <div class="download-link-details">
                                        <div class="file-size">
                                            <i class="fas fa-hdd"></i>
                                            <span>${t.file_size}: ${escapeHtml(fileSize)}</span>
                                        </div>
                                        <span class="download-type">${downloadTypeText}</span>
                                    </div>
                                    <button class="unlock-btn" 
                                            onclick="processAdUnlock('${movie.id}', ${requiredAds}, this)"
                                            data-movie-id="${movie.id}"
                                            data-required-ads="${requiredAds}">
                                        <i class="fas fa-lock"></i> 
                                        <span class="unlock-text">
                                            ${t.unlock_button.replace('{adCount}', adCount).replace('{requiredCount}', requiredAds)}
                                        </span>
                                    </button>
                                    <div class="download-progress" id="progress_${optionId}" style="display: none;">
                                        <div class="download-progress-bar"></div>
                                    </div>
                                    ${adCount > 0 ? `<div class="timer-progress">${t.toast_progress.replace('{adCount}', adCount).replace('{requiredCount}', requiredAds)}</div>` : ''}
                                </div>
                            `;
                        }
                    }
                }
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            downloadOptionsContainer.innerHTML = html;
        }
        
        // Start Download with Affiliate Redirect + Dialog Box
        function startDownload(movieId, serverName, quality, button, event) {
            const t = translations[currentLanguage];
            
            if (event && event.type === 'contextmenu') {
                event.preventDefault();
                return false;
            }
            
            const downloadUrl = button.getAttribute('data-download-url');
            
            if (!downloadUrl) {
                showNotification("Download URL not found", true);
                return false;
            }
            
            const isTelegramMiniApp = detectTelegramMiniApp();
            
            const affiliateLink = getRandomAffiliateLink();
            
            dialogDownloadUrl = downloadUrl;
            dialogMovieId = movieId;
            dialogServerName = serverName;
            dialogQuality = quality;
            dialogButton = button;
            
            if (affiliateLink && affiliateConfig.enabled) {
                trackAffiliateClick(affiliateLink.name, movieId);
                
                if (isTelegramMiniApp) {
                    handleTelegramRedirect(affiliateLink.url);
                } else {
                    window.open(affiliateLink.url, '_blank', 'noopener,noreferrer');
                }
                
                setTimeout(() => {
                    initiateActualDownload(downloadUrl, movieId, serverName, quality, button);
                    showDownloadDialog();
                }, affiliateConfig.redirectDelay);
                
                showNotification("Redirecting to partner site...");
                
            } else {
                initiateActualDownload(downloadUrl, movieId, serverName, quality, button);
                showDownloadDialog();
            }
            
            return true;
        }
        
        // Initiate Actual Download with Telegram compatibility
        function initiateActualDownload(downloadUrl, movieId, serverName, quality, button) {
            const t = translations[currentLanguage];
            
            showNotification(t.toast_download_starting);
            
            const isTelegramMiniApp = detectTelegramMiniApp();
            
            if (isTelegramMiniApp && downloadUrl.startsWith('http')) {
                handleTelegramRedirect(downloadUrl);
            } else {
                try {
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = downloadUrl;
                    document.body.appendChild(iframe);
                    
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe);
                        }
                    }, 10000);
                } catch (error) {
                    console.error("Download iframe error:", error);
                }
            }
            
            try {
                const progressId = `progress_option_${movieId}_${serverName}_${quality}`.replace(/\s+/g, '_');
                const progressBar = document.getElementById(`progress_${progressId}`);
                const progressBarInner = progressBar ? progressBar.querySelector('.download-progress-bar') : null;
                
                if (progressBar && progressBarInner) {
                    progressBar.style.display = 'block';
                    
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += Math.random() * 15;
                        if (progress > 100) progress = 100;
                        progressBarInner.style.width = progress + '%';
                        
                        if (progress >= 100) {
                            clearInterval(interval);
                            setTimeout(() => {
                                progressBar.style.display = 'none';
                                progressBarInner.style.width = '0%';
                            }, 500);
                        }
                    }, 200);
                }
            } catch (error) {
                console.error("Progress bar error:", error);
            }
            
            downloadQueue.push({
                movieId: movieId,
                serverName: serverName,
                quality: quality,
                url: downloadUrl,
                timestamp: Date.now()
            });
            
            processDownloadQueue();
            
            return true;
        }
        
        // Process Download Queue
        function processDownloadQueue() {
            if (!isOnline || activeDownloads >= maxParallelDownloads) return;
            
            while (downloadQueue.length > 0 && activeDownloads < maxParallelDownloads) {
                const download = downloadQueue.shift();
                activeDownloads++;
                
                setTimeout(() => {
                    activeDownloads--;
                    processDownloadQueue();
                }, 3000);
            }
        }
        
        // Process pending downloads when online
        function processPendingDownloads() {
            if (!isOnline) return;
            
            const pendingDownloads = loadFromStorage('pendingDownloads', []);
            
            if (pendingDownloads.length > 0) {
                pendingDownloads.forEach(download => {
                    downloadQueue.push(download);
                });
                
                localStorage.removeItem('pendingDownloads');
                processDownloadQueue();
            }
        }
        
        // Process Ad Unlock
        async function processAdUnlock(movieId, requiredCount, button) {
            if (button.disabled) return;
            
            const t = translations[currentLanguage];
            
            if (!isOnline) {
                showNotification("You are offline. Please connect to the internet to unlock.", true);
                return;
            }
            
            button.disabled = true;
            
            const originalHtml = button.innerHTML;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.loading_ad}`;
            
            try {
                await showUnlockAd();
                
                adCounts[movieId] = (adCounts[movieId] || 0) + 1;
                saveToStorage('adCounts', adCounts);
                
                const newAdCount = adCounts[movieId];
                
                if (newAdCount >= requiredCount) {
                    unlockedMovies[movieId] = true;
                    updateUnlockTimestamp(movieId);
                    
                    saveToStorage('unlockedMovies', unlockedMovies);
                    
                    showNotification(t.toast_unlocked);
                    loadDownloadOptionsForCurrentMovie();
                } else {
                    showNotification(t.toast_progress.replace('{adCount}', newAdCount).replace('{requiredCount}', requiredCount));
                    
                    let countdown = timerDuration;
                    button.innerHTML = `<i class="fas fa-clock"></i> ${t.verifying_button.replace('{countdown}', countdown)}`;
                    
                    const timerInterval = setInterval(() => {
                        countdown--;
                        if (countdown > 0) {
                            button.innerHTML = `<i class="fas fa-clock"></i> ${t.verifying_button.replace('{countdown}', countdown)}`;
                        } else {
                            clearInterval(timerInterval);
                            button.disabled = false;
                            button.innerHTML = originalHtml;
                            const unlockText = button.querySelector('.unlock-text');
                            if (unlockText) {
                                unlockText.textContent = t.unlock_button.replace('{adCount}', newAdCount).replace('{requiredCount}', requiredCount);
                            }
                            const timerProgress = button.parentElement.querySelector('.timer-progress');
                            if (timerProgress) {
                                timerProgress.textContent = t.toast_progress.replace('{adCount}', newAdCount).replace('{requiredCount}', requiredCount);
                            }
                        }
                    }, 1000);
                }
                
            } catch (error) {
                console.error("Ad error:", error);
                showNotification(t.toast_ad_error, true);
                button.disabled = false;
                button.innerHTML = originalHtml;
            }
        }
        
        // Load download options for current movie
        async function loadDownloadOptionsForCurrentMovie() {
            if (!currentMovieId) return;
            
            try {
                const response = await fetch('data/movies.json');
                const movies = await response.json();
                const movie = movies.find(m => m.id === currentMovieId);
                
                if (movie) {
                    loadDownloadOptions(movie);
                }
            } catch (error) {
                console.error("Error loading movie:", error);
            }
        }
        
        // Check if server is new
        function checkIfNewServer(movie, serverIndex) {
            if (!movie.serverAddedDate) return false;
            
            if (Array.isArray(movie.serverAddedDate)) {
                return movie.serverAddedDate[serverIndex] && isWithinDays(movie.serverAddedDate[serverIndex], 7);
            } else {
                return serverIndex === 0 && isWithinDays(movie.serverAddedDate, 7);
            }
        }
        
        // Show Notification
        function showNotification(message, isError = false) {
            const notification = document.getElementById('notification');
            const notificationText = document.getElementById('notificationText');
            
            if (!notification || !notificationText) return;
            
            notificationText.textContent = message;
            notification.className = 'notification' + (isError ? ' error' : '');
            
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        // Search Movies
        function searchMovies(query) {
            const moviesGrid = document.getElementById('moviesGrid');
            if (!moviesGrid) return;
            
            const t = translations[currentLanguage];
            
            const searchLoading = document.getElementById('searchLoading');
            if (searchLoading) searchLoading.style.display = 'block';
            
            moviesGrid.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>${t.loadingMovies}</p>
                </div>
            `;
            
            const normalizedQuery = normalizeText(query.toLowerCase());
            currentSearchQuery = query;
            
            updateSectionTitle();
            
            if (isOnline) {
                fetch('data/movies.json')
                    .then(response => response.json())
                    .then(allMovies => {
                        moviesGrid.innerHTML = '';
                        
                        if (allMovies.length === 0) {
                            moviesGrid.innerHTML = `
                                <div class="no-movies">
                                    <i class="fas fa-search"></i>
                                    <h3>${t.noMovies}</h3>
                                    <p>Try a different search term</p>
                                </div>
                            `;
                            showSearchResultsInfo(0, query);
                            if (searchLoading) searchLoading.style.display = 'none';
                            return;
                        }
                        
                        let movieCount = 0;
                        let foundMovies = 0;
                        
                        allMovies.forEach(movie => {
                            const title = movie.title || '';
                            const normalizedTitle = normalizeText(title.toLowerCase());
                            
                            if (normalizedTitle.includes(normalizedQuery)) {
                                createMovieCard(movie, movieCount);
                                foundMovies++;
                                movieCount++;
                            }
                        });
                        
                        if (foundMovies === 0) {
                            moviesGrid.innerHTML = `
                                <div class="no-movies">
                                    <i class="fas fa-search"></i>
                                    <h3>${t.noMovies}</h3>
                                    <p>Try a different search term</p>
                                </div>
                            `;
                            showSearchResultsInfo(0, query);
                        } else {
                            showSearchResultsInfo(foundMovies, query);
                        }
                        
                        const loadMoreContainer = document.getElementById('loadMoreContainer');
                        if (loadMoreContainer) {
                            loadMoreContainer.style.display = 'none';
                        }
                        
                        if (searchLoading) searchLoading.style.display = 'none';
                    })
                    .catch(error => {
                        console.error("Search error:", error);
                        searchMoviesOffline(query);
                        if (searchLoading) searchLoading.style.display = 'none';
                    });
            } else {
                searchMoviesOffline(query);
                if (searchLoading) searchLoading.style.display = 'none';
            }
        }
        
        // Search Movies Offline
        function searchMoviesOffline(query) {
            const moviesGrid = document.getElementById('moviesGrid');
            if (!moviesGrid) return;
            
            const t = translations[currentLanguage];
            const normalizedQuery = normalizeText(query.toLowerCase());
            
            const cachedMovies = localStorage.getItem('cachedMovies');
            if (!cachedMovies) {
                moviesGrid.innerHTML = `
                    <div class="no-movies">
                        <i class="fas fa-wifi-slash"></i>
                        <h3>${t.noMovies} (Offline)</h3>
                        <p>Connect to the internet to search</p>
                    </div>
                `;
                showSearchResultsInfo(0, query);
                return;
            }
            
            try {
                const movies = JSON.parse(cachedMovies);
                moviesGrid.innerHTML = '';
                
                let movieCount = 0;
                let foundMovies = 0;
                
                movies.forEach(movie => {
                    const title = movie.title || '';
                    const normalizedTitle = normalizeText(title.toLowerCase());
                    
                    if (normalizedTitle.includes(normalizedQuery)) {
                        createMovieCard(movie, movieCount);
                        foundMovies++;
                        movieCount++;
                    }
                });
                
                if (foundMovies === 0) {
                    moviesGrid.innerHTML = `
                        <div class="no-movies">
                            <i class="fas fa-search"></i>
                            <h3>${t.noMovies}</h3>
                            <p>Try a different search term</p>
                        </div>
                    `;
                    showSearchResultsInfo(0, query);
                } else {
                    showSearchResultsInfo(foundMovies, query);
                }
                
                const loadMoreContainer = document.getElementById('loadMoreContainer');
                if (loadMoreContainer) {
                    loadMoreContainer.style.display = 'none';
                }
                
            } catch (error) {
                console.error("Offline search error:", error);
                moviesGrid.innerHTML = `
                    <div class="no-movies">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>${t.noMovies}</h3>
                        <p>Error searching movies</p>
                    </div>
                `;
                showSearchResultsInfo(0, query);
            }
        }
        
        // Setup Event Listeners
        function setupEventListeners() {
            const langToggle = document.getElementById('langToggle');
            if (langToggle) {
                langToggle.addEventListener('click', toggleLanguage);
            }
            
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    clearTimeout(searchTimeout);
                    const query = this.value.trim();
                    
                    if (query.length === 0) {
                        currentFilter = 'all';
                        currentFilterType = 'home';
                        currentSearchQuery = '';
                        updateActiveSidebarItem('all', 'home');
                        updateSectionTitle();
                        lastVisible = null;
                        loadMovies();
                        const loadMoreContainer = document.getElementById('loadMoreContainer');
                        if (loadMoreContainer) {
                            loadMoreContainer.style.display = 'block';
                        }
                        hideSearchResultsInfo();
                        return;
                    }
                    
                    if (query.length < 2) return;
                    
                    searchTimeout = setTimeout(() => {
                        searchMovies(query);
                    }, 500);
                });
            }
            
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', function() {
                    loadMovies(true);
                });
            }
            
            const closeModal = document.getElementById('closeModal');
            if (closeModal) {
                closeModal.addEventListener('click', function() {
                    const modal = document.getElementById('movieModal');
                    if (modal) {
                        modal.style.display = 'none';
                        document.body.style.overflow = '';
                        cleanupSlider();
                    }
                });
            }
            
            const movieModal = document.getElementById('movieModal');
            if (movieModal) {
                movieModal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.style.display = 'none';
                        document.body.style.overflow = '';
                        cleanupSlider();
                    }
                });
            }
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    const modal = document.getElementById('movieModal');
                    if (modal && modal.style.display === 'flex') {
                        modal.style.display = 'none';
                        document.body.style.overflow = '';
                        cleanupSlider();
                    }
                    
                    const dialog = document.getElementById('downloadDialog');
                    if (dialog && dialog.style.display === 'flex') {
                        dialog.style.display = 'none';
                        document.body.style.overflow = '';
                    }
                }
            });
        }
        
        // Call setupEventListeners on window load
        window.addEventListener('load', setupEventListeners);
