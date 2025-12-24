const fs = require('fs');
const path = require('path');
// আপনার প্রোজেক্ট স্ট্রাকচার অনুযায়ী পাথ ঠিক করা হয়েছে
const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'movies.json');
function processMovies() {
try {
console.log('Checking for data directory...');
if (!fs.existsSync(dataDir)) {
console.log('Data directory not found. Creating it...');
fs.mkdirSync(dataDir, { recursive: true });
}
    console.log('Checking for movies.json at:', filePath);
    if (!fs.existsSync(filePath)) {
        console.log('movies.json not found. Creating an empty one...');
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        return;
    }

    const rawData = fs.readFileSync(filePath, 'utf8');
    let movies;
    
    try {
        movies = JSON.parse(rawData);
    } catch (e) {
        console.error('JSON Parse Error: movies.json is corrupted.');
        process.exit(1);
    }

    if (!Array.isArray(movies)) {
        console.error('Data inside movies.json is not an array.');
        process.exit(1);
    }

    const now = new Date();

    function parseDate(dateStr) {
        if (!dateStr) return null;
        
        // বিভিন্ন কমন ফরম্যাট হ্যান্ডেল করার চেষ্টা (যেমন: 22-12-2024)
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 2 && parts[2].length === 4) {
                // converts DD-MM-YYYY to YYYY-MM-DD for standard parsing
                dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    }

    movies = movies.map(movie => {
        let createdDate = parseDate(movie.createdAt);
        let updatedDate = parseDate(movie.lastUpdated);

        if (createdDate) movie.createdAt = createdDate.toISOString();
        if (updatedDate) movie.lastUpdated = updatedDate.toISOString();

        let status = "";
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));

        if (createdDate && createdDate >= sevenDaysAgo) {
            status = "NEW";
        } else if (updatedDate && updatedDate >= tenDaysAgo) {
            status = "UPDATED";
        }

        movie.info1_custom = status;
        return movie;
    });

    // সর্টিং: সর্বশেষ আপডেট বা ক্রিয়েশন ডেট অনুযায়ী
    movies.sort((a, b) => {
        const dateA = new Date(a.lastUpdated || a.createdAt || 0);
        const dateB = new Date(b.lastUpdated || b.createdAt || 0);
        return dateB - dateA;
    });

    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2), 'utf8');
    console.log('Success: Processed ' + movies.length + ' movies.');

} catch (error) {
    console.error('Fatal Error:', error.message);
    process.exit(1);
}

}
processMovies();
