const fs = require('fs');
const path = require('path');

class MovieProcessor {
  constructor() {
    this.filePath = path.join(__dirname, '../../data/movies.json');
    this.now = new Date();
    this.sevenDaysAgo = new Date(this.now.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.tenDaysAgo = new Date(this.now.getTime() - 10 * 24 * 60 * 60 * 1000);
    this.changesMade = false;
  }

  // তারিখ ডিটেক্ট ও কনভার্ট করার ফাংশন
  detectAndConvertDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    // ইতিমধ্যে ISO ফরমেট হলে
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    if (isoRegex.test(dateString)) {
      return dateString;
    }

    let date = null;
    const trimmedDate = dateString.trim();

    // প্যাটার্ন 1: '2024-01-15'
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      date = new Date(trimmedDate + 'T00:00:00Z');
    }
    // প্যাটার্ন 2: '15-01-2024' বা '15/01/2024'
    else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(trimmedDate)) {
      const separator = trimmedDate.includes('/') ? '/' : '-';
      let [day, month, year] = trimmedDate.split(separator);
      
      // যদি ফরমেট মাস-দিন-বছর হয় (MM-DD-YYYY)
      if (parseInt(month) > 12) {
        [month, day] = [day, month];
      }
      
      day = day.padStart(2, '0');
      month = month.padStart(2, '0');
      date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    }
    // প্যাটার্ন 3: 'January 15, 2024'
    else if (/^[a-zA-Z]+\s+\d{1,2},\s*\d{4}$/.test(trimmedDate)) {
      date = new Date(trimmedDate + ' 00:00:00 UTC');
    }
    // প্যাটার্ন 4: '15 Jan 2024'
    else if (/^\d{1,2}\s+[a-zA-Z]{3}\s+\d{4}$/.test(trimmedDate)) {
      date = new Date(trimmedDate + ' 00:00:00 UTC');
    }
    // অন্যান্য ফরমেট
    else {
      date = new Date(trimmedDate);
    }

    // তারিখ ভ্যালিডেট করা
    if (!date || isNaN(date.getTime())) {
      console.warn(`⚠️ Invalid date format: "${dateString}"`);
      return dateString; // অপরিবর্তিত রিটার্ন
    }

    // ISO 8601 ফরমেটে কনভার্ট
    const isoDate = date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    
    // যদি তারিখ পরিবর্তিত হয়, তাহলে changesMade ট্র্যাক করা
    if (isoDate !== dateString) {
      this.changesMade = true;
    }
    
    return isoDate;
  }

  // স্ট্যাটাস আপডেট করার ফাংশন
  updateStatus(movie) {
    const createdAt = movie.createdAt ? new Date(movie.createdAt) : null;
    const lastUpdated = movie.lastUpdated ? new Date(movie.lastUpdated) : null;
    const mostRecentDate = lastUpdated || createdAt;

    let newStatus = '';
    let oldStatus = movie.info1_custom || '';

    // NEW স্ট্যাটাস (৭ দিনের মধ্যে তৈরি)
    if (createdAt && createdAt >= this.sevenDaysAgo) {
      newStatus = 'NEW';
    }
    // UPDATED স্ট্যাটাস (১০ দিনের মধ্যে আপডেট)
    else if (lastUpdated && lastUpdated >= this.tenDaysAgo) {
      newStatus = 'UPDATED';
    }

    // স্ট্যাটাস পরিবর্তন হলে ট্র্যাক করা
    if (newStatus !== oldStatus) {
      movie.info1_custom = newStatus;
      this.changesMade = true;
      
      if (newStatus) {
        console.log(`🏷️  Status updated for "${movie.title}": ${oldStatus || 'None'} → ${newStatus}`);
      } else if (oldStatus) {
        console.log(`🗑️  Status removed for "${movie.title}": ${oldStatus} → None`);
      }
    }

    return mostRecentDate ? mostRecentDate.getTime() : 0;
  }

  // টাইমস্ট্যাম্প যুক্ত করার ফাংশন
  addTimestamp(movie) {
    if (!movie._timestamp) {
      movie._timestamp = this.now.toISOString();
    }
  }

  // প্রধান প্রসেসিং ফাংশন
  async process() {
    try {
      // ফাইল পড়া
      const rawData = fs.readFileSync(this.filePath, 'utf8');
      let movies = JSON.parse(rawData);

      if (!Array.isArray(movies)) {
        throw new Error('movies.json should contain an array');
      }

      console.log(`📊 Processing ${movies.length} movies...`);
      console.log(`⏰ Current time: ${this.now.toISOString()}`);
      console.log(`📅 7 days ago: ${this.sevenDaysAgo.toISOString()}`);
      console.log(`📅 10 days ago: ${this.tenDaysAgo.toISOString()}`);

      // প্রতিটি মুভি প্রসেস করা
      movies.forEach((movie, index) => {
        console.log(`\n🎬 Processing: ${movie.title || movie.id || `Movie ${index + 1}`}`);
        
        // তারিখ কনভার্ট
        if (movie.createdAt) {
          const oldCreatedAt = movie.createdAt;
          movie.createdAt = this.detectAndConvertDate(movie.createdAt);
          if (movie.createdAt !== oldCreatedAt) {
            console.log(`   📅 createdAt: ${oldCreatedAt} → ${movie.createdAt}`);
          }
        }
        
        if (movie.lastUpdated) {
          const oldLastUpdated = movie.lastUpdated;
          movie.lastUpdated = this.detectAndConvertDate(movie.lastUpdated);
          if (movie.lastUpdated !== oldLastUpdated) {
            console.log(`   📅 lastUpdated: ${oldLastUpdated} → ${movie.lastUpdated}`);
          }
        }

        // টাইমস্ট্যাম্প যুক্ত করা
        this.addTimestamp(movie);
        
        // স্ট্যাটাস আপডেট ও সাজানোর জন্য টেম্পোরারি ফিল্ড
        movie._sortDate = this.updateStatus(movie);
      });

      // তারিখ অনুযায়ী সাজানো (নতুন থেকে পুরাতন)
      const beforeSort = JSON.stringify(movies.map(m => m.id || m.title));
      movies.sort((a, b) => b._sortDate - a._sortDate);
      const afterSort = JSON.stringify(movies.map(m => m.id || m.title));
      
      if (beforeSort !== afterSort) {
        this.changesMade = true;
        console.log('\n🔀 Movies have been reordered by date');
      }

      // টেম্পোরারি ফিল্ড রিমুভ
      movies.forEach(movie => {
        delete movie._sortDate;
        // _timestamp রাখা যেতে পারে বা মুছে ফেলা যেতে পারে
        // delete movie._timestamp;
      });

      // ফাইলে লেখা
      fs.writeFileSync(this.filePath, JSON.stringify(movies, null, 2));
      
      // লগ
      const updatedMovies = movies.filter(m => 
        (m.info1_custom && m.info1_custom !== '') || 
        (m.createdAt && m.createdAt.includes('T')) ||
        (m.lastUpdated && m.lastUpdated.includes('T'))
      ).length;
      
      console.log(`\n✅ Successfully processed ${movies.length} movies`);
      console.log(`📈 ${updatedMovies} movies were updated`);
      console.log(`🔄 Changes made: ${this.changesMade ? 'Yes' : 'No'}`);
      console.log(`📁 Saved to: ${this.filePath}`);

      return { 
        success: true, 
        totalMovies: movies.length, 
        updatedMovies: updatedMovies,
        changesMade: this.changesMade,
        timestamp: this.now.toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error processing movies:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }
}

// মেইন এক্সিকিউশন
if (require.main === module) {
  const processor = new MovieProcessor();
  processor.process()
    .then(result => {
      console.log('\n🎉 Process completed successfully!');
      console.log('Summary:', JSON.stringify(result, null, 2));
      
      // Exit code নির্ধারণ (changes থাকলে 0, না থাকলে 1)
      process.exit(result.changesMade ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = MovieProcessor;
