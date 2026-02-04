# Complete Web Scraping System Implementation Prompt

## System Overview

Create a **HTML-controlled web scraping system** that scrapes movie/series data from target websites and exports to JSON format with the following capabilities:

- Multi-mode scraping (page range, custom links, single page)
- Intelligent duplicate detection with season/episode awareness
- CORS proxy for cross-origin requests
- Real-time JSON viewer with live updates
- LocalStorage persistence for crash recovery
- Export to clipboard or downloadable JSON file
- Dark mode premium UI with animations

---

## Technology Stack Requirements

### Backend
- **Node.js** with Express framework
- **CORS** middleware for cross-origin support
- **node-fetch** for HTTP requests
- Port: 3000

### Frontend
- **Pure HTML/CSS/JavaScript** (no frameworks)
- Modern ES6+ JavaScript
- DOMParser for HTML parsing
- LocalStorage API
- Clipboard API
- Wake Lock API (prevent sleep during scraping)

### Design
- Dark theme with glassmorphism effects
- Gradient colors (primary: #6366f1, secondary: #ec4899)
- Google Fonts: Inter
- Responsive design (mobile-first)
- Smooth animations and transitions

---

## File Structure

```
project/
├── server.js           # CORS proxy server
├── index.html          # Main scraper interface
├── package.json        # Dependencies
└── my date structure.json  # JSON schema reference
```

---

## Part 1: Backend Implementation (server.js)

### Requirements

Create an Express server with:

1. **Static File Serving**
   - Serve files from current directory
   - Handle favicon requests (204 response)

2. **CORS Proxy Endpoint**
   - Route: `POST /api/proxy`
   - Accept: `{ url: "target_url" }`
   - Return: `{ success, html, url, status, statusText, headers }`

3. **Proxy Features**
   - Custom User-Agent header (Chrome)
   - Accept headers for HTML/XML
   - Follow redirects (up to 50)
   - 30-second timeout
   - Handle 404 responses gracefully
   - Error handling with descriptive messages

4. **Server Logging**
   - Log proxied URLs
   - Display startup message with endpoints
   - Show port and access URLs

### Implementation Specifications

```javascript
// Headers to send
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': url
}

// Fetch options
{
  follow: 50,
  redirect: 'follow',
  timeout: 30000
}
```

---

## Part 2: JSON Data Structure

### Schema Definition

Each movie/series object must contain exactly these fields:

```json
{
  "id": "string",                    // Auto-generated: {type}{serial}
  "post_url": "string",              // Full URL to detail page
  "title": "string",                 // Clean display title
  "check_title": "string",           // Detailed title for duplicate detection
  "imageUrl": "string",              // Poster image URL
  "info1_custom": "string",          // Custom field (empty default)
  "info2_quality": "string",         // BluRay, WEB-DL, etc.
  "info3_language": "string",        // Normalized language
  "info4_type": "string",            // Movie, Series, Web Series
  "language_info": "string",         // Original language value
  "info_subtitle": "string",         // Subtitle info (empty default)
  "info6_status": "string",          // Online, HD, S01 | Ep 1-9 Added
  "enablePosterBlur": boolean,       // Adult content flag
  "blurPercentage": number,          // Blur intensity (default: 10)
  "imdb": "string",                  // IMDb rating
  "genre": "string",                 // Comma-separated genres
  "resolution": "string",            // 1080p, 720p, etc.
  "released": "string",              // Release year
  "cast": "string",                  // Comma-separated cast
  "storyline": "string",             // Plot description
  "visibility": "string",            // "published" (default)
  "total_views": number,             // View counter (default: 0)
  "createdAt": "string",             // ISO 8601 timestamp
  "lastUpdated": "string",           // ISO 8601 timestamp
  "server": boolean,                 // true (default)
  "server_info": "string",           // Server details (empty default)
  "runtime": "string",               // Runtime (empty default)
  "director": "string",              // Director (empty default)
  "writer": "string",                // Writer (empty default)
  "rated": "string",                 // Rating (empty default)
  "trailer": "string",               // Trailer URL (empty default)
  "info5_views": number,             // Alternative view counter (default: 0)
  "screenshotLinks": ["string"],     // Array of screenshot URLs
  "downloadOptions": [               // Array of download servers
    {
      "server": "string",            // Server name (default: "G-Drive")
      "server_info": "string",       // Server info (empty default)
      "qualities": [                 // Array of quality options
        {
          "quality_text": "string",  // 1080p, 720p, etc.
          "path": "string",          // Download URL
          "file_size": "string"      // File size (e.g., "2.5 GB")
        }
      ],
      "labels": ["string"]           // Additional labels (empty default)
    }
  ]
}
```

---

## Part 3: Frontend UI Design

### Layout Structure

Create a responsive grid layout with:

1. **Header Section**
   - Gradient title: "🚀 Advanced Web Scraper"
   - Subtitle: "HTML-Controlled Input/Output with JavaScript Automation"

2. **Main Grid** (2 columns on desktop, 1 on mobile)
   - Left: Control Panel
   - Right: JSON Viewer & Duplicate Tracker

3. **Control Panel Components**
   - Scraping mode selector (3 modes)
   - URL inputs with datalist suggestions
   - Page range controls
   - Custom links textarea
   - Merge position selectors
   - Duplicate check mode selector
   - Start/Stop buttons with loading states
   - Status panel (5 metrics)
   - Progress bar
   - Log container (last 10 messages)

4. **JSON Viewer Components**
   - View mode buttons (Full/New Only)
   - Action buttons (Copy Full, Copy Content, Save, Clear, Fix Schema)
   - Scrollable JSON display with syntax highlighting

5. **Duplicate Tracker**
   - Hidden by default
   - Shows when duplicates detected
   - Clickable items for inspection modal

6. **Inspection Modal**
   - Side-by-side comparison
   - New scraped vs. existing item
   - Shows: title, status, URL, ID

### Color Scheme

```css
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --secondary: #ec4899;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --bg-dark: #0f172a;
  --bg-card: #1e293b;
  --bg-input: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #475569;
}
```

### Animation Requirements

- Fade-in animations on page load
- Hover effects on cards (translateY -5px)
- Button hover with shadow glow
- Progress bar shimmer animation
- Slide-in animation for log messages
- Spinner animation for loading states
- Modal fade and slide transitions

---

## Part 4: Scraping Logic Implementation

### 4.1 Target Website Element Selectors

#### Listing Page Elements

**Movie Card Container**:
- Selectors: `.movie-card`, `.post`, `article`, `.item-list`

**Adult Content Badge**:
- Selector: `.badge.adult18plus-badge`
- Maps to: `enablePosterBlur` (boolean)

**Movie Link**:
- Selector: `.image-container a[href]`
- Maps to: `post_url`

**Title Sources** (priority order):
1. Link text: `a[href]` textContent
2. Link title attribute: `a[href][title]`
3. Heading: `.mb-2.font-bold`, `.card-title`, `.title`, `h3`, `h2`
4. Image alt: `img[alt]`
5. Image title: `img[title]`

**Poster Image**:
- Selector: `img[src]`
- Maps to: `imageUrl`

#### Detail Page Elements

**Main Poster**:
- Selector: `.image-container-view img[src]`
- Maps to: `imageUrl` (higher quality)

**Detail Title**:
- Selectors: `.mb-2.font-bold.text-center.text-xl`, `h1`, `.post-title`, `.md\\:text-3xl`, `.lg\\:text-4xl`, `.entry-title`

**Screenshots**:
- Selector: `.screenshot-wrapper [data-src]`
- Attribute: `data-src`
- Maps to: `screenshotLinks` array

**Storyline**:
- Selector: `.storyline-box.mt-2 .story-text`
- Maps to: `storyline`

**Type Badge**:
- Pattern 1: `<b class="text-orange">{value}</b>`
- Pattern 2: `<b>Type:</b> {value}`
- Default: `"Movie"`
- Maps to: `info4_type`

**Info Fields** (Pattern: `<b>{Label}:</b> {Value}`):
- IMDb: `<b>IMDb:</b>`
- Genre: `<b>Genre:</b>`
- Language: `<b>Language:</b>`
- Quality: `<b>Quality:</b>`
- Resolution: `<b>Resolution:</b>`
- Released: `<b>Released:</b>`
- Cast: `<b>Cast:</b>`

**Status Badge**:
- Scope: `.data`, `.sheader`, `.extra`, `.mvic-desc`, or `body`
- Selectors (priority):
  1. `.badge.ep-badge.added`
  2. `.badge.ep-badge`
  3. `.badge.status`
- Default: `"Online"`
- Maps to: `info6_status`

**Upload Time**:
- Selector: `.upload-time`
- Maps to: `createdAt`, `lastUpdated`

**Download Links**:
- Selectors:
  1. `.d-flex.justify-content-center.align-items-center.my-2 .d-flex.flex-wrap.justify-content-center.align-items-center.gap-2.gap-md-3.my-2 a[href*="/getLink/"]`
  2. `.card.h-100.border-left-success.shadow-sm.position-relative .mb-2.d-flex.justify-content-center a[href*="/getLink/"]`
- Pattern: `Download [{quality} • {size}]`
- Regex: `/Download\s*\[(.*)\s*•\s*(.*)\]/i`

### 4.2 Processing Functions

#### cleanMovieTitle(title)
```javascript
// Remove extra whitespace, normalize spaces
return title.replace(/\s+/g, ' ').trim();
```

#### normalizeLanguage(language)
```javascript
// Replace "Dual" with "Dual Audio"
// Convert [] and – to commas
// Clean multiple commas
language = language.replace(/\bDual\b/gi, 'Dual Audio');
language = language.replace(/[\[\]–]/g, ',');
language = language.replace(/,+/g, ',').replace(/^,|,$/g, '');
return language.trim();
```

#### parseUploadTime(uploadTimeText)
```javascript
// Parse patterns: "X seconds/minutes/hours/days/weeks/months/years ago"
// Convert to ISO 8601 timestamp
// Patterns to support:
const patterns = [
  { regex: /(\d+)\s*second[s]?\s*ago/i, unit: 'seconds' },
  { regex: /(\d+)\s*minute[s]?\s*ago/i, unit: 'minutes' },
  { regex: /(\d+)\s*hour[s]?\s*ago/i, unit: 'hours' },
  { regex: /(\d+)\s*day[s]?\s*ago/i, unit: 'days' },
  { regex: /(\d+)\s*week[s]?\s*ago/i, unit: 'weeks' },
  { regex: /(\d+)\s*month[s]?\s*ago/i, unit: 'months' },
  { regex: /(\d+)\s*year[s]?\s*ago/i, unit: 'years' }
];
// Return ISO timestamp
```

#### extractInfoValue(html, label)
```javascript
// Support both <b> and <strong> tags
const regex = new RegExp(`<(b|strong)\\s*${label}\\s*:?\\s*</\\1>\\s*([^<]+)`, 'i');
const match = html.match(regex);
return match ? match[2].trim().replace(/\s+/g, ' ') : '';
```

#### resolveUrl(baseUrl, relativeUrl)
```javascript
// Convert relative URLs to absolute
if (!relativeUrl) return '';
if (relativeUrl.startsWith('http')) return relativeUrl;
return new URL(relativeUrl, baseUrl).href;
```

#### generateNextId(type)
```javascript
// Format: {cleanType}{serial}
// Examples: movie1, series2, webseries3
// Auto-increment per type
// Check for duplicates and skip used IDs
// Track in state.nextSerials object
```

### 4.3 Duplicate Detection Logic

#### findExistingMovie(movie)

**Comparison Fields**:
1. Title (based on mode: detailed/standard/both)
2. Image URL (exact match)
3. Quality (normalized comparison)
4. Type (normalized comparison)
5. Genre (normalized comparison)
6. Resolution (normalized comparison)
7. Released (normalized comparison)
8. Cast (normalized comparison)
9. Storyline (normalized comparison)
10. Language info (normalized comparison)

**Season/Episode Awareness**:
```javascript
// Extract season number from status
const extractSeason = (status) => {
  const match = status.match(/S(\d+)/i);
  return match ? match[1] : null;
};

// If both have seasons:
if (itemSeason && movieSeason) {
  if (itemSeason !== movieSeason) {
    return false; // Different seasons = not duplicate
  }
  // Same season, check episodes
  if (cleanStatus(item.info6_status) !== cleanStatus(movie.info6_status)) {
    return false; // Different episodes = not duplicate
  }
}

// For series without season info, compare cleaned status
// For movies, status difference is ignored
```

**Title Matching Modes**:
- **Detailed**: Compare `check_title` only
- **Standard**: Compare `title` only
- **Both**: Match if either `check_title` OR `title` matches

**Update Detection**:
```javascript
if (duplicate found) {
  // Check if check_title missing in existing
  if (!existingMovie.check_title && check_title) {
    existingMovie.check_title = check_title;
    isUpdated = true;
  }
  
  // Check if status changed
  if (existingMovie.info6_status !== info6_status) {
    existingMovie.info6_status = info6_status;
    isUpdated = true;
  }
  
  // Add to duplicate tracker UI
  // Return null (skip adding)
}
```

### 4.4 Scraping Workflow

#### Phase 1: Initialization
1. Validate user inputs
2. Reset session state (preserve global data)
3. Update UI (disable start, enable stop)
4. Start running timer
5. Request wake lock
6. Load existing JSON if URL provided

#### Phase 2: Page Scraping
```javascript
async function scrapePage(pageUrl, pageNumber) {
  1. Fetch page HTML via proxy
  2. Parse with DOMParser
  3. Find movie cards (.movie-card, .post, article, .item-list)
  4. For each card:
     a. Parse card data (parseMovieCard)
     b. Scrape detail page (scrapeMovieDetails)
     c. Check duplicate (findExistingMovie)
     d. Generate ID if new (generateNextId)
     e. Add to data store
     f. Update UI
     g. Save to LocalStorage
     h. Delay 200ms
  5. Return card count
}
```

#### Phase 3: Detail Scraping
```javascript
async function scrapeMovieDetails(href, enablePosterBlur, ...) {
  1. Fetch detail page HTML
  2. Parse with DOMParser
  3. Extract all fields:
     - Image (high quality)
     - Title (refined)
     - Screenshots
     - Storyline
     - Type
     - Info fields (IMDb, Genre, Language, etc.)
     - Status badge
     - Upload time
     - Download links
  4. Build movie object
  5. Check duplicate
  6. If duplicate: update or skip
  7. If new: generate ID and return
}
```

#### Phase 4: Data Management
```javascript
// Add to data store
if (movieData) {
  if (mergeLivePos === 'prepend') {
    newScrapedData.unshift(movieData);
    scrapedData.unshift(movieData);
  } else {
    newScrapedData.push(movieData);
    scrapedData.push(movieData);
  }
  
  cardsScraped++;
  updateJsonViewer();
  saveToLocalStorage();
}
```

---

## Part 5: State Management

### Global State Object

```javascript
const state = {
  isRunning: false,              // Scraping active flag
  shouldStop: false,             // Stop requested flag
  isNetworkOffline: false,       // Network status
  scrapedData: [],               // All data (existing + new)
  newScrapedData: [],            // Only new scraped items
  detectedDuplicates: [],        // Duplicate tracking
  currentPage: 0,                // Current page number
  cardsScraped: 0,               // Total cards scraped
  duplicatesSkipped: 0,          // Duplicate count
  existingData: [],              // Loaded from JSON URL
  currentViewMode: 'full',       // 'full' or 'new'
  duplicateCheckMode: 'detailed', // 'detailed', 'standard', 'both'
  startTime: null,               // Scraping start timestamp
  runningTimeInterval: null,     // Timer interval ID
  avgTimePerCard: 0,             // Average time per card
  wakeLock: null,                // Wake lock object
  nextSerials: {}                // Auto-increment per type
};
```

### LocalStorage Persistence

**Save Structure**:
```javascript
{
  scrapedData: [],
  newScrapedData: [],
  detectedDuplicates: [],
  nextSerials: {},
  duplicateCheckMode: 'detailed',
  timestamp: Date.now()
}
```

**Save Trigger**: After each successful scrape

**Load Trigger**: On page load

---

## Part 6: Error Handling & Recovery

### Network Error Handling

```javascript
async function waitForNetwork() {
  if (!navigator.onLine) {
    log('Network connection lost. Pausing...');
    updateStatus('Waiting for network...', 'stopped');
    
    return new Promise(resolve => {
      const onlineHandler = () => {
        log('Network restored. Resuming...');
        updateStatus('Running...', 'active');
        window.removeEventListener('online', onlineHandler);
        resolve();
      };
      window.addEventListener('online', onlineHandler);
    });
  }
}
```

### Retry Logic

**Proxy Errors**: Up to 3 retries with 2-second delay
**Network Errors**: Up to 5 retries with network wait

### Wake Lock

```javascript
// Request on scraping start
await navigator.wakeLock.request('screen');

// Release on scraping stop
wakeLock.release();

// Re-acquire on tab visibility change
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible' && isRunning) {
    await requestWakeLock();
  }
});
```

---

## Part 7: UI Features

### Scraping Modes

1. **Page Range**
   - Input: Website URL, Start Page, End Page
   - Direction: Start→End or End→Start
   - URL format: `{baseUrl}/page/{pageNumber}`
   - Page 1: Use base URL without `/page/1`

2. **Custom Links**
   - Input: Textarea with one URL per line
   - Direct detail page scraping
   - No pagination

3. **Single Page**
   - Input: Single page URL
   - Scrapes all cards on that page
   - Hides page range and direction controls

### View Modes

1. **View Full JSON**
   - Shows all data (existing + new)
   - Button highlighted when active

2. **View New Only**
   - Shows only current session scraped data
   - Button highlighted when active

### Export Options

1. **Copy Full JSON**
   - Copies entire JSON array with formatting

2. **Copy Content Only**
   - Copies array contents without outer `[]`
   - Ready to paste into existing array

3. **Save JSON**
   - Downloads as file
   - Filename: `scraped-data-YYYY-MM-DD.json`

4. **Clear All Data**
   - Clears LocalStorage
   - Resets all counters
   - Confirmation required

5. **Fix Old JSON**
   - Adds missing `check_title` to old records
   - Updates LocalStorage
   - Shows count of fixed records

### Duplicate Tracker

- Hidden by default
- Shows when first duplicate detected
- Displays: Title + Tag (Duplicate/Updated)
- Clickable items open inspection modal
- Modal shows side-by-side comparison

### Status Panel Metrics

1. **Status**: Ready/Running/Completed/Error
2. **Current Page**: Page number being scraped
3. **Cards Scraped**: Total count
4. **Duplicates Skipped**: Duplicate count
5. **Running Time**: HH:MM:SS format

### Log Container

- Shows last 10 log messages
- Types: info (blue), success (green), warning (yellow), error (red)
- Auto-scrolls to newest
- Timestamp on each message

---

## Part 8: Performance Optimizations

1. **Request Delay**: 200ms between each card scrape
2. **Auto-save**: Save to LocalStorage after each scrape
3. **View Toggle**: Reduce JSON viewer load with new-only mode
4. **Progress Bar**: Visual feedback without blocking
5. **Wake Lock**: Prevent device sleep during long scrapes
6. **Retry Logic**: Handle temporary network issues
7. **LocalStorage**: Crash recovery and session persistence

---

## Part 9: Implementation Checklist

### Backend (server.js)
- [ ] Express server setup
- [ ] CORS middleware
- [ ] Static file serving
- [ ] Proxy endpoint with error handling
- [ ] Custom headers for scraping
- [ ] Redirect following
- [ ] Timeout handling
- [ ] Logging

### Frontend HTML Structure
- [ ] Responsive grid layout
- [ ] Control panel with all inputs
- [ ] Status panel with 5 metrics
- [ ] JSON viewer with syntax highlighting
- [ ] Duplicate tracker (hidden by default)
- [ ] Inspection modal
- [ ] Progress bar
- [ ] Log container

### Frontend CSS
- [ ] Dark theme with CSS variables
- [ ] Glassmorphism effects
- [ ] Gradient backgrounds
- [ ] Hover animations
- [ ] Loading states
- [ ] Responsive breakpoints
- [ ] Modal transitions
- [ ] Progress bar shimmer

### Frontend JavaScript - State
- [ ] Global state object
- [ ] DOM element references
- [ ] LocalStorage save/load
- [ ] State initialization

### Frontend JavaScript - Scraping
- [ ] fetchPageContent with retry
- [ ] scrapePage function
- [ ] parseMovieCard function
- [ ] scrapeMovieDetails function
- [ ] extractInfoValue function
- [ ] All processing functions

### Frontend JavaScript - Duplicate Detection
- [ ] findExistingMovie function
- [ ] Season/episode extraction
- [ ] Title matching modes
- [ ] Update detection
- [ ] Duplicate UI tracking

### Frontend JavaScript - ID Generation
- [ ] generateNextId function
- [ ] Serial tracking per type
- [ ] Duplicate ID checking

### Frontend JavaScript - UI Updates
- [ ] updateJsonViewer
- [ ] updateStatus
- [ ] updateProgress
- [ ] log function
- [ ] addDuplicateToUI
- [ ] Modal open/close

### Frontend JavaScript - Export
- [ ] Copy full JSON
- [ ] Copy content only
- [ ] Save JSON file
- [ ] Clear data with confirmation
- [ ] Fix old JSON schema

### Frontend JavaScript - Error Handling
- [ ] Network wait function
- [ ] Retry logic
- [ ] Wake lock request/release
- [ ] Error logging

### Frontend JavaScript - Event Listeners
- [ ] Start button
- [ ] Stop button
- [ ] Mode change
- [ ] View toggle
- [ ] Export buttons
- [ ] Clear button
- [ ] Fix schema button

---

## Part 10: Testing Scenarios

1. **Page Range Scraping**
   - Test forward direction (1→5)
   - Test backward direction (5→1)
   - Test single page (1→1)

2. **Custom Links**
   - Test with 3-5 URLs
   - Test with invalid URLs
   - Test with empty textarea

3. **Single Page**
   - Test category page
   - Test with no cards found

4. **Duplicate Detection**
   - Test with existing JSON loaded
   - Test same movie twice
   - Test series with different episodes
   - Test series with same episodes
   - Test status update

5. **Network Handling**
   - Test with network disconnect
   - Test with slow connection
   - Test proxy errors

6. **UI Features**
   - Test view mode toggle
   - Test all export options
   - Test duplicate inspection modal
   - Test clear data
   - Test fix old JSON

7. **Error Cases**
   - Test invalid URL
   - Test missing selectors
   - Test empty pages
   - Test timeout

---

## Part 11: Expected Behavior

### Successful Scraping Flow
1. User enters URL and page range
2. Clicks "Start Scraping"
3. Status changes to "Running"
4. Progress bar animates
5. Log shows page scraping messages
6. Cards scraped counter increments
7. JSON viewer updates in real-time
8. Duplicates appear in tracker (if any)
9. Running time updates every second
10. On completion, status shows "Completed"
11. Data saved to LocalStorage
12. User can export JSON

### Duplicate Handling
1. New item scraped
2. Compared with existing data
3. If match found:
   - Check if status changed → update existing
   - Check if check_title missing → add it
   - Add to duplicate tracker UI
   - Increment duplicate counter
   - Skip adding to data
4. If no match:
   - Generate unique ID
   - Add to data store
   - Increment scraped counter

### Error Recovery
1. Network lost during scraping
2. Pause scraping
3. Show "Waiting for network..." status
4. Wait for network restoration
5. Resume scraping automatically
6. Continue from where it left off

---

## Implementation Notes

- Use `DOMParser` for HTML parsing (no external libraries)
- All URLs must be resolved to absolute using `resolveUrl()`
- Whitespace normalization is critical for duplicate detection
- Season/episode logic prevents false duplicates for series
- LocalStorage prevents data loss on crash
- Wake Lock keeps device awake during long scrapes
- 200ms delay prevents server overload
- Retry logic handles temporary failures
- Modal provides transparency for duplicate decisions

---

## Success Criteria

✅ Scrapes all fields from target website
✅ Generates valid JSON matching schema
✅ Detects duplicates accurately (including series episodes)
✅ Updates existing records when status changes
✅ Handles network errors gracefully
✅ Persists data to LocalStorage
✅ Exports to clipboard and file
✅ Premium dark UI with smooth animations
✅ Responsive on all devices
✅ No data loss on crash (LocalStorage recovery)

---

This prompt contains all specifications needed to recreate the entire web scraping system from scratch.
