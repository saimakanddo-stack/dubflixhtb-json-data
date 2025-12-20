#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://saimakanddo-stack.github.io/dubflixhtb-json-data';

// Data structure
const dataStructure = {
  'config/adsConfig.json': {},
  'config/settings.json': {},
  'config/downloadServers.json': {},
  'config/siteConfig.json': {},
  'config/affiliateLinks.json': {},
  'data/movies.json': { movies: [] },
  'data/sliders.json': { sliders: [] },
  'logs/downloadLogs.json': { downloads: [] },
  'logs/affiliateStats.json': { stats: [] }
};

function updateData() {
  console.log('Updating JSON data...');
  
  // Create directories if they don't exist
  Object.keys(dataStructure).forEach(filePath => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write initial data if file doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(dataStructure[filePath], null, 2));
      console.log(`Created: ${filePath}`);
    }
  });
  
  console.log('Data update complete!');
  console.log(`JSON files are accessible at: ${BASE_URL}`);
}

// Check for command line arguments
if (process.argv.length > 2) {
  const command = process.argv[2];
  
  if (command === 'validate') {
    console.log('Validating JSON structure...');
    Object.keys(dataStructure).forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          console.log(`✓ ${filePath} is valid JSON`);
        } catch (error) {
          console.log(`✗ ${filePath} has invalid JSON: ${error.message}`);
        }
      } else {
        console.log(`⚠ ${filePath} does not exist`);
      }
    });
  } else if (command === 'init') {
    updateData();
  } else if (command === 'add-movie') {
    const movieData = {
      id: `movie_${Date.now()}`,
      title: "New Movie",
      imageUrl: "https://via.placeholder.com/300x450",
      createdAt: new Date().toISOString(),
      // ... add other required fields
    };
    
    const moviesPath = 'data/movies.json';
    if (fs.existsSync(moviesPath)) {
      const moviesData = JSON.parse(fs.readFileSync(moviesPath, 'utf8'));
      moviesData.movies.push(movieData);
      fs.writeFileSync(moviesPath, JSON.stringify(moviesData, null, 2));
      console.log(`Added new movie: ${movieData.id}`);
    }
  }
} else {
  updateData();
}
