# Dubflix HTB JSON Data Repository

This repository contains JSON data files for the Dub Fusion Hub movie streaming application.

## Structure
dubflixhtb-json-data/
├── config/ # Configuration files
├── data/ # Main data (movies, sliders)
├── logs/ # Log files (read-only)
├── scripts/ # Update scripts
└── .github/ # GitHub Actions workflows

## Usage

### Accessing Data
All JSON files are accessible via: https://saimakanddo-stack.github.io/dubflixhtb-json-data/[path/to/file.json]


Example:
- Movies: `https://saimakanddo-stack.github.io/dubflixhtb-json-data/data/movies.json`
- Config: `https://saimakanddo-stack.github.io/dubflixhtb-json-data/config/settings.json`

### Updating Data

1. **Manual Update**:
   ```bash
   node scripts/update-script.js
