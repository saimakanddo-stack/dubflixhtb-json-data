/**
 * Download Options Search Functionality
 * Filters download servers based on server-info and quality-options
 */

(function () {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function () {
        const searchInput = document.getElementById('downloadSearchInput');
        const clearBtn = document.getElementById('clearDownloadSearch');
        const downloadOptions = document.getElementById('downloadOptions');

        if (!searchInput || !clearBtn || !downloadOptions) {
            console.warn('[DownloadSearch] Required elements not found');
            return;
        }

        /**
         * Filter download servers based on search query
         */
        function filterDownloadServers(query) {
            const normalizedQuery = query.toLowerCase().trim();
            const servers = downloadOptions.querySelectorAll('.download-server');
            let visibleServersCount = 0;
            const queryLength = normalizedQuery.length;

            servers.forEach(server => {
                const serverInfo = server.querySelector('.server-info');
                const qualityButtons = server.querySelectorAll('.quality-btn');

                let serverHasMatch = false;
                let visibleButtonsCount = 0;

                if (!normalizedQuery) {
                    // Show all if search is empty
                    server.classList.remove('hidden');
                    qualityButtons.forEach(btn => btn.classList.remove('hidden'));
                    visibleServersCount++;
                } else {
                    // Check server-info match
                    const serverInfoText = serverInfo ? serverInfo.textContent.toLowerCase() : '';
                    const serverInfoMatch = serverInfoText.includes(normalizedQuery);


                    // Check each quality button
                    qualityButtons.forEach(btn => {
                        const qualityText = btn.querySelector('.quality-text');
                        const qualityValue = qualityText ? qualityText.textContent.toLowerCase() : '';

                        let shouldShowButton = false;

                        // For ≤2 characters: search only in server-info
                        // For >2 characters: search in both server-info and quality-text
                        if (queryLength <= 2) {
                            shouldShowButton = serverInfoMatch;
                        } else {
                            shouldShowButton = serverInfoMatch || qualityValue.includes(normalizedQuery);
                        }

                        if (shouldShowButton) {
                            btn.classList.remove('hidden');
                            visibleButtonsCount++;
                            serverHasMatch = true;
                        } else {
                            btn.classList.add('hidden');
                        }
                    });

                    // Show/hide entire server based on whether it has any matches
                    if (serverHasMatch) {
                        server.classList.remove('hidden');
                        visibleServersCount++;
                    } else {
                        server.classList.add('hidden');
                    }
                }
            });

            // Show/hide "no results" message
            updateNoResultsMessage(visibleServersCount, normalizedQuery);

            // Log filter results
            console.log(`[DownloadSearch] Filtered: ${visibleServersCount}/${servers.length} servers visible`);
        }

        /**
         * Show/hide no results message
         */
        function updateNoResultsMessage(visibleCount, query) {
            let noResultsMsg = downloadOptions.querySelector('.no-results-message');

            if (visibleCount === 0 && query) {
                if (!noResultsMsg) {
                    noResultsMsg = document.createElement('div');
                    noResultsMsg.className = 'no-results-message';
                    noResultsMsg.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.5);">
                            <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                            <p style="font-size: 1.1rem; margin: 0;">কোনো সার্ভার পাওয়া যায়নি</p>
                            <p style="font-size: 0.9rem; margin-top: 5px;">অন্য কিছু খুঁজে দেখুন</p>
                        </div>
                    `;
                    downloadOptions.appendChild(noResultsMsg);
                } else {
                    noResultsMsg.style.display = 'block';
                }
            } else {
                if (noResultsMsg) {
                    noResultsMsg.style.display = 'none';
                }
            }
        }

        /**
         * Handle search input
         */
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value;

            // Show/hide clear button
            if (query.length > 0) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
            }

            // Filter servers
            filterDownloadServers(query);
        });

        /**
         * Handle clear button click
         */
        clearBtn.addEventListener('click', function () {
            searchInput.value = '';
            clearBtn.classList.add('hidden');
            filterDownloadServers('');
            searchInput.focus();
        });

        /**
         * Reset search when modal is opened
         */
        const movieModal = document.getElementById('movieModal');
        if (movieModal) {
            movieModal.addEventListener('show.bs.modal', function () {
                // Reset search on modal open
                searchInput.value = '';
                clearBtn.classList.add('hidden');
                filterDownloadServers('');
            });
        }

        console.log('[DownloadSearch] Search functionality initialized');
    });

})();
