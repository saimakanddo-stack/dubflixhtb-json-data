const fs = require('fs');
const path = require('path');

// তারিখ পার্সিং ইউটিলিটি ফাংশন
function parseDate(dateString) {
  if (!dateString) return null;
  
  // ইতিমধ্যে ISO ফরমেট হলে
  if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)) {
    return new Date(dateString);
  }
  
  let date = null;
  
  // ফরমেট 1: '2024-12-22'
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    date = new Date(dateString + 'T00:00:00Z');
  }
  // ফরমেট 2: '22-12-2024'
  else if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const parts = dateString.split('-');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  }
  // ফরমেট 3: 'December 22, 2024'
  else if (dateString.match(/^[a-zA-Z]+\s+\d{1,2},\s*\d{4}$/)) {
    date = new Date(dateString + ' 00:00:00 UTC');
  }
  // অন্য কোনো ফরমেট
  else {
    date = new Date(dateString);
  }
  
  return isNaN(date.getTime()) ? null : date;
}

// ISO 8601 ফরমেটে রূপান্তর
function formatToISO(date) {
  if (!date) return null;
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// মূল প্রসেসিং ফাংশন
function processMovies() {
  const filePath = path.join(__dirname, '../../data/movies.json');
  
  // ফাইল পড়া
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error('Error reading movies.json:', error);
    process.exit(1);
  }
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  
  // প্রতিটি মুভি প্রসেস করা
  data.forEach(movie => {
    // তারিখ পার্স ও ফরমেটিং
    if (movie.createdAt) {
      const parsedDate = parseDate(movie.createdAt);
      if (parsedDate) {
        movie.createdAt = formatToISO(parsedDate);
      }
    }
    
    if (movie.lastUpdated) {
      const parsedDate = parseDate(movie.lastUpdated);
      if (parsedDate) {
        movie.lastUpdated = formatToISO(parsedDate);
      }
    }
    
    // createdAt ডেট নির্ধারণ
    const createdAt = movie.createdAt ? new Date(movie.createdAt) : null;
    const lastUpdated = movie.lastUpdated ? new Date(movie.lastUpdated) : null;
    const mostRecentDate = lastUpdated || createdAt;
    
    // info1_custom সেট করা
    movie.info1_custom = '';
    
    if (createdAt && createdAt >= sevenDaysAgo) {
      movie.info1_custom = 'NEW';
    } else if (lastUpdated && lastUpdated >= tenDaysAgo) {
      movie.info1_custom = 'UPDATED';
    }
    
    // সাজানোর জন্য টেম্পোরারি ফিল্ড
    movie._sortDate = mostRecentDate ? mostRecentDate.getTime() : 0;
  });
  
  // সাজানো: সর্বশেষ তারিখ অনুযায়ী (অবরোহী)
  data.sort((a, b) => b._sortDate - a._sortDate);
  
  // টেম্পোরারি ফিল্ড রিমুভ করা
  data.forEach(movie => {
    delete movie._sortDate;
  });
  
  // ফাইলে লিখা
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Successfully processed', data.length, 'movies');
  } catch (error) {
    console.error('Error writing movies.json:', error);
    process.exit(1);
  }
}

// রান করা
processMovies();
