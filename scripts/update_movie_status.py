#!/usr/bin/env python3

import json
import os
import sys
from datetime import datetime

def parse_date(date_str):
    """Parse date from ISO format or simple date format"""
    # Remove time part if exists (format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)
    date_only = date_str.split('T')[0] if 'T' in date_str else date_str
    # Remove timezone info if exists
    date_only = date_only.split('+')[0] if '+' in date_str else date_only
    return datetime.strptime(date_only, '%Y-%m-%d')

def update_movie_status():
    current_date = datetime.now()
    json_path = 'data/movies.json'
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} file not found!")
        sys.exit(1)
    
    print(f"Processing file: {json_path}")
    
    try:
        # Read with UTF-8 encoding
        with open(json_path, 'r', encoding='utf-8') as file:
            movies = json.load(file)
    except Exception as e:
        print(f"Error reading JSON file: {e}")
        sys.exit(1)
    
    changes_made = 0
    
    for movie in movies:
        try:
            movie_id = movie.get('id', 'unknown')
            created_at = parse_date(movie['createdAt'])
            last_updated = parse_date(movie['lastUpdated'])
            
            days_since_created = (current_date - created_at).days
            days_since_updated = (current_date - last_updated).days
            
            old_value = movie.get('info1_custom', '')
            
            # Apply your business rules
            if created_at.date() == last_updated.date():
                new_value = 'NEW' if days_since_created <= 7 else ''
            else:
                if days_since_created <= 7:
                    new_value = 'NEW'
                elif days_since_updated <= 10:
                    new_value = 'UPDATED'
                else:
                    new_value = ''
            
            # Update if value changed
            if old_value != new_value:
                movie['info1_custom'] = new_value
                changes_made += 1
                print(f"Updated {movie_id}: {old_value} → {new_value} "
                      f"(created: {days_since_created}d ago, updated: {days_since_updated}d ago)")
                
        except Exception as e:
            print(f"Error with movie {movie.get('id', 'unknown')}: {e}")
            continue
    
    if changes_made > 0:
        try:
            # Write with UTF-8 encoding
            with open(json_path, 'w', encoding='utf-8') as file:
                json.dump(movies, file, indent=2, ensure_ascii=False)
            print(f"\n✅ Successfully updated {changes_made} movie(s)")
        except Exception as e:
            print(f"Error writing JSON file: {e}")
            sys.exit(1)
    else:
        print("\n✅ No updates needed")
    
    return changes_made > 0

if __name__ == "__main__":
    update_movie_status()
