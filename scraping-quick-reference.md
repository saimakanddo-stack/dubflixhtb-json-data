# Target Site Scraping Quick Reference

## Scraping Flow (কোথায় কি করতে হয়)

### Step 1: Listing Page এ যান
**URL Format**: `https://example.com/movies` বা `https://example.com/movies/page/2`

**কোন Element খুঁজবেন**:
- Movie cards: `.movie-card`, `.post`, `article`, `.item-list`

**প্রতিটি Card থেকে নিন**:
1. **Link** → `.image-container a[href]` → Click করার জন্য URL
2. **Image** → `img[src]` → Poster URL
3. **Title** → Link text, heading, বা image alt
4. **Adult Badge** → `.badge.adult18plus-badge` → আছে কি নেই check

### Step 2: Detail Page এ Click করুন
**Action**: Card এর link এ click/navigate করুন

**কোন Elements Scrape করবেন**:

#### 📸 Images
- **Main Poster**: `.image-container-view img[src]`
- **Screenshots**: `.screenshot-wrapper [data-src]` (সব গুলো)

#### 📝 Text Content
- **Title**: `h1`, `.mb-2.font-bold.text-center.text-xl`
- **Storyline**: `.storyline-box.mt-2 .story-text`

#### 🏷️ Badges
- **Type**: `<b class="text-orange">Movie</b>` বা `<b>Type:</b> Movie`
- **Status**: `.badge.ep-badge.added` বা `.badge.ep-badge`
- **Adult**: `.badge.adult18plus-badge`

#### ℹ️ Info Section (Pattern: `<b>Label:</b> Value`)
- **IMDb**: `<b>IMDb:</b> 8.5/10`
- **Genre**: `<b>Genre:</b> Action, Thriller`
- **Language**: `<b>Language:</b> Hindi – English`
- **Quality**: `<b>Quality:</b> BluRay`
- **Resolution**: `<b>Resolution:</b> 1080p`
- **Released**: `<b>Released:</b> 2024`
- **Cast**: `<b>Cast:</b> Actor names`

#### ⏰ Time
- **Upload Time**: `.upload-time` → "2 hours ago" format

#### 💾 Download Links
- **Selector**: `a[href*="/getLink/"]`
- **Text Pattern**: `Download [1080p • 2.5 GB]`
- **Extract**: Quality, Size, URL

---

## Element → JSON Field Mapping

| Target Site Element | Selector/Pattern | JSON Field | Notes |
|---------------------|------------------|------------|-------|
| **Listing Page** ||||
| Movie card link | `.image-container a[href]` | `post_url` | Detail page URL |
| Card image | `img[src]` | `imageUrl` | Initial poster |
| Card title | Link text, `h2`, `h3` | `title`, `check_title` | Longest = check_title |
| Adult badge | `.badge.adult18plus-badge` | `enablePosterBlur` | true/false |
| **Detail Page** ||||
| Main poster | `.image-container-view img[src]` | `imageUrl` | Replaces card image |
| Detail title | `h1`, `.post-title` | `title`, `check_title` | Refined |
| Screenshots | `.screenshot-wrapper [data-src]` | `screenshotLinks[]` | Array |
| Storyline | `.storyline-box.mt-2 .story-text` | `storyline` | Plot text |
| Type badge | `<b class="text-orange">` | `info4_type` | Movie/Series |
| Status badge | `.badge.ep-badge.added` | `info6_status` | Online/S01 Ep 1-9 |
| Upload time | `.upload-time` | `createdAt`, `lastUpdated` | Parse "X ago" |
| IMDb | `<b>IMDb:</b> {value}` | `imdb` | Rating |
| Genre | `<b>Genre:</b> {value}` | `genre` | Comma-separated |
| Language | `<b>Language:</b> {value}` | `language_info`, `info3_language` | Raw + normalized |
| Quality | `<b>Quality:</b> {value}` | `info2_quality` | BluRay, WEB-DL |
| Resolution | `<b>Resolution:</b> {value}` | `resolution` | 1080p, 720p |
| Released | `<b>Released:</b> {value}` | `released` | Year |
| Cast | `<b>Cast:</b> {value}` | `cast` | Actor names |
| Download links | `a[href*="/getLink/"]` | `downloadOptions[].qualities[]` | Array of objects |

---

## Scraping Process (Step by Step)

### 1️⃣ **Listing Page Scrape**
```
1. Load page: https://example.com/movies/page/1
2. Find all: .movie-card
3. For each card:
   → Extract: link, image, title, adult badge
   → Store: href for next step
```

### 2️⃣ **Detail Page Scrape** (প্রতিটি card এর জন্য)
```
1. Navigate to: card.href
2. Wait for page load
3. Extract all fields:
   ✓ Main poster (.image-container-view img)
   ✓ Title (h1)
   ✓ Screenshots (.screenshot-wrapper [data-src])
   ✓ Storyline (.storyline-box .story-text)
   ✓ Type (<b class="text-orange">)
   ✓ Status (.badge.ep-badge.added)
   ✓ Info fields (<b>Label:</b> pattern)
   ✓ Upload time (.upload-time)
   ✓ Download links (a[href*="/getLink/"])
4. Build JSON object
5. Check duplicate
6. Save to array
```

### 3️⃣ **Repeat**
```
1. Go back to listing page
2. Next card
3. Repeat step 2
4. After all cards, go to next page
5. Repeat from step 1
```

---

## Click/Navigation Flow

```
User Input (URL + Pages)
    ↓
[Listing Page 1] → Load HTML
    ↓
Find all .movie-card
    ↓
Card 1 → Click .image-container a[href]
    ↓
[Detail Page 1] → Load HTML → Scrape all fields
    ↓
Back to listing
    ↓
Card 2 → Click link
    ↓
[Detail Page 2] → Scrape
    ↓
... repeat for all cards ...
    ↓
[Listing Page 2] → Load HTML
    ↓
Repeat process
```

---

## Important Notes

### ✅ কি করতে হবে:
- প্রতিটি card এর link এ navigate করতে হবে
- Detail page এ সব fields scrape করতে হবে
- URL গুলো absolute করতে হবে (`resolveUrl()`)
- Whitespace normalize করতে হবে
- Duplicate check করতে হবে

### ❌ কি করতে হবে না:
- Listing page থেকে সব data নেওয়া যায় না
- Detail page ছাড়া complete data পাওয়া যায় না
- Direct download link পাওয়া যায় না (getLink URL থাকে)

### 🔄 Processing Required:
- **Language**: `[Hindi – English]` → `Hindi, English`
- **Upload Time**: `"2 hours ago"` → ISO timestamp
- **Download Text**: `"Download [1080p • 2.5 GB]"` → Extract quality + size
- **Title**: Multiple sources থেকে longest নিতে হবে

---

## Auto-Generated Fields

এই fields scrape করতে হয় না, automatically generate হয়:

| Field | Generation Logic |
|-------|------------------|
| `id` | `{type}{serial}` (e.g., movie1, series2) |
| `visibility` | Always `"published"` |
| `total_views` | Always `0` |
| `server` | Always `true` |
| `info5_views` | Always `0` |
| `blurPercentage` | Always `10` |
| `info1_custom` | Always `""` |
| `info_subtitle` | Always `""` |
| `server_info` | Always `""` |
| `runtime` | Always `""` (not scraped) |
| `director` | Always `""` (not scraped) |
| `writer` | Always `""` (not scraped) |
| `rated` | Always `""` (not scraped) |
| `trailer` | Always `""` (not scraped) |

---

## Quick Selector Reference

### Must-Have Selectors:
```css
/* Listing Page */
.movie-card, .post, article, .item-list
.image-container a[href]
img[src]

/* Detail Page */
.image-container-view img[src]
h1, .post-title
.storyline-box.mt-2 .story-text
.badge.ep-badge.added
.screenshot-wrapper [data-src]
a[href*="/getLink/"]
.upload-time
```

### Info Pattern:
```html
<b>IMDb:</b> 8.5/10
<b>Genre:</b> Action, Thriller
<b>Language:</b> Hindi – English
<b>Quality:</b> BluRay
<b>Resolution:</b> 1080p
<b>Released:</b> 2024
<b>Cast:</b> Actor names
```

---

এই quick reference দিয়ে আপনি জানতে পারবেন:
- কোন page এ কি scrape করতে হবে
- কোন element এ click করতে হবে
- কোন selector use করতে হবে
- কোন field কোথায় যাবে
