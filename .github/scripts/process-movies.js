const fs = require('fs');
const path = require('path');
// ফাইল পাথ
const filePath = path.join(__dirname, '../data/movies.json');
function processMovies() {
try {
if (!fs.existsSync(filePath)) {
console.error('movies.json ফাইলটি পাওয়া যায়নি!');
return;
}
    const rawData = fs.readFileSync(filePath, 'utf8');
    let movies = JSON.parse(rawData);
    const now = new Date();

    // তারিখ পার্স করার ফাংশন (বিভিন্ন ফরম্যাট হ্যান্ডেল করার জন্য)
    function parseDate(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    }

    movies = movies.map(movie => {
        // ১. তারিখ রূপান্তর (ISO 8601)
        let createdDate = parseDate(movie.createdAt);
        let updatedDate = parseDate(movie.lastUpdated);

        if (createdDate) movie.createdAt = createdDate.toISOString();
        if (updatedDate) movie.lastUpdated = updatedDate.toISOString();

        // ২. স্ট্যাটাস আপডেট লজিক
        let status = ""; // ডিফল্ট ব্ল্যাঙ্ক
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));

        // গত ৭ দিনের মধ্যে যোগ হলে NEW
        if (createdDate && createdDate >= sevenDaysAgo) {
            status = "NEW";
        } 
        // গত ১০ দিনের মধ্যে আপডেট হলে UPDATED (যদি অলরেডি NEW না থাকে)
        else if (updatedDate && updatedDate >= tenDaysAgo) {
            status = "UPDATED";
        }

        movie.info1_custom = status;
        return movie;
    });

    // ৩. সর্টিং লজিক (সর্বশেষ তারিখ অনুযায়ী)
    movies.sort((a, b) => {
        const dateA = new Date(a.lastUpdated || a.createdAt || 0);
        const dateB = new Date(b.lastUpdated || b.createdAt || 0);
        return dateB - dateA;
    });

    // ফাইল সেভ করা
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2), 'utf8');
    console.log('Movie database successfully updated and sorted!');

} catch (error) {
    console.error('Error processing movies:', error);
    process.exit(1);
}

}
processMovies();
