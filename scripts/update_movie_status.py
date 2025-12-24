#!/usr/bin/env python3

import json
import os
import sys
from datetime import datetime

def update_movie_status():
    current_date = datetime.now()
    
    # শুধু আপনার প্রকৃত পাথ দিন
    json_path = 'data/movies.json'
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} file not found!")
        sys.exit(1)
    
    print(f"Processing file: {json_path}")
    
    with open(json_path, 'r', encoding='utf-8') as file:
        movies = json.load(file)
    
    changes_made = False
    for movie in movies:
        created_at = datetime.strptime(movie['createdAt'], '%Y-%m-%d')
        last_updated = datetime.strptime(movie['lastUpdated'], '%Y-%m-%d')
        
        days_since_created = (current_date - created_at).days
        days_since_updated = (current_date - last_updated).days
        
        old_value = movie.get('info1_custom', '')
        new_value = ''
        
        # লজিক: createdAt এবং lastUpdated একই হলে
        if created_at == last_updated:
            new_value = 'NEW' if days_since_created <= 7 else ''
        else:
            if days_since_created <= 7:
                new_value = 'NEW'
            elif days_since_updated <= 10:
                new_value = 'UPDATED'
            else:
                new_value = ''
        
        movie['info1_custom'] = new_value
        
        if old_value != new_value:
            changes_made = True
            print(f"Updated movie {movie['id']}: {old_value} -> {new_value}")
    
    if changes_made:
        with open(json_path, 'w', encoding='utf-8') as file:
            json.dump(movies, file, indent=2, ensure_ascii=False)
        print('Changes saved to file.')
    else:
        print('No changes needed.')
    
    return changes_made

if __name__ == "__main__":
    update_movie_status()
