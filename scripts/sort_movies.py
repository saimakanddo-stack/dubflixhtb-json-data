#!/usr/bin/env python3
# scripts/sort_movies.py

import json
import os
import sys
from datetime import datetime

def normalize_to_iso(date_str):
    """
    Convert date to ISO format if it's in normal format (YYYY-MM-DD)
    If already in ISO format, return as is
    """
    if not date_str:
        return date_str
    
    # If already has 'T' (ISO format), return as is
    if 'T' in date_str:
        return date_str
    
    # If it's normal format (YYYY-MM-DD), convert to ISO
    try:
        # Check if it's in YYYY-MM-DD format
        datetime.strptime(date_str, '%Y-%m-%d')
        # Convert to ISO format (add time component)
        return f"{date_str}T00:00:00Z"
    except ValueError:
        # If not in expected format, return as is
        return date_str

def parse_iso_date(date_str):
    """
    Parse ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)
    """
    # Normalize to ISO first
    iso_date = normalize_to_iso(date_str)
    
    # Extract date part
    if 'T' in iso_date:
        date_part = iso_date.split('T')[0]
    else:
        date_part = iso_date
    
    # Remove timezone info if exists
    if '+' in date_part:
        date_part = date_part.split('+')[0]
    
    return datetime.strptime(date_part, '%Y-%m-%d')

def sort_movies():
    json_path = 'data/movies.json'
    
    print(f"🔄 Starting movie sorting process...")
    print(f"📁 Processing file: {json_path}")
    
    # Check if file exists
    if not os.path.exists(json_path):
        print(f"❌ ERROR: File not found at {json_path}")
        sys.exit(1)
    
    # Read JSON file
    try:
        with open(json_path, 'r', encoding='utf-8') as file:
            movies = json.load(file)
    except Exception as e:
        print(f"❌ ERROR reading JSON file: {e}")
        sys.exit(1)
    
    print(f"📊 Total movies found: {len(movies)}")
    
    # Track changes for normalization
    normalization_changes = 0
    date_updates = []
    
    # First pass: Normalize dates to ISO format if needed
    for movie in movies:
        movie_id = movie.get('id', 'unknown')
        
        original_created = movie['createdAt']
        original_updated = movie['lastUpdated']
        
        # Normalize dates
        normalized_created = normalize_to_iso(original_created)
        normalized_updated = normalize_to_iso(original_updated)
        
        # Update if changed
        if original_created != normalized_created:
            movie['createdAt'] = normalized_created
            normalization_changes += 1
            date_updates.append(f"  • {movie_id}: createdAt {original_created} → {normalized_created}")
        
        if original_updated != normalized_updated:
            movie['lastUpdated'] = normalized_updated
            normalization_changes += 1
            date_updates.append(f"  • {movie_id}: lastUpdated {original_updated} → {normalized_updated}")
    
    # Report normalization
    if normalization_changes > 0:
        print(f"🔄 Normalized {normalization_changes} date(s) to ISO format:")
        for update in date_updates:
            print(update)
    else:
        print("✅ All dates are already in ISO format")
    
    # Sort by most recent (newest first)
    try:
        movies_sorted = sorted(
            movies,
            key=lambda x: parse_iso_date(x['lastUpdated']),
            reverse=True  # newest first
        )
        sort_method = "lastUpdated (newest first)"
    except Exception as e:
        print(f"⚠️  Error sorting by lastUpdated: {e}")
        print("🔄 Trying sort by createdAt...")
        
        try:
            movies_sorted = sorted(
                movies,
                key=lambda x: parse_iso_date(x['createdAt']),
                reverse=True
            )
            sort_method = "createdAt (newest first)"
        except Exception as e2:
            print(f"❌ ERROR sorting by createdAt: {e2}")
            sys.exit(1)
    
    # Check if sorting actually changed the order
    order_changed = False
    for i, (old, new) in enumerate(zip(movies, movies_sorted)):
        if old['id'] != new['id']:
            order_changed = True
            break
    
    # Save if there were any changes (normalization or sorting)
    if normalization_changes > 0 or order_changed:
        try:
            with open(json_path, 'w', encoding='utf-8') as file:
                json.dump(movies_sorted, file, indent=2, ensure_ascii=False)
            
            # Summary report
            print(f"\n✅ Successfully processed {len(movies)} movies")
            
            if normalization_changes > 0:
                print(f"   • Normalized {normalization_changes} date(s) to ISO format")
            
            if order_changed:
                print(f"   • Sorted by {sort_method}")
            else:
                print(f"   • Order unchanged (already sorted by {sort_method})")
            
            print(f"\n📋 First 5 movies after processing:")
            for i, movie in enumerate(movies_sorted[:5], 1):
                print(f"   {i:2}. {movie.get('title', 'No Title')}")
                print(f"       ID: {movie['id']}")
                print(f"       Created: {movie['createdAt']}")
                print(f"       Updated: {movie['lastUpdated']}")
            
            if len(movies_sorted) > 5:
                print(f"   ... and {len(movies_sorted) - 5} more")
            
            return True
            
        except Exception as e:
            print(f"❌ ERROR saving file: {e}")
            sys.exit(1)
    else:
        print("✅ No changes needed - dates already ISO format and movies already sorted")
        return False

if __name__ == "__main__":
    sort_movies()
