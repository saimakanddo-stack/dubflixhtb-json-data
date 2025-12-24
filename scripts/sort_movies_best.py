#!/usr/bin/env python3
# scripts/sort_movies_best.py - Fixed version

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class MovieSorter:
    def __init__(self, json_path: str = 'data/movies.json'):
        self.json_path = json_path
        self.movies: List[Dict] = []
        self.stats = {
            'total_movies': 0,
            'dates_normalized': 0,
            'order_changed': False,
            'recent_source_counts': {'createdAt': 0, 'lastUpdated': 0, 'unknown': 0}
        }
    
    def load_movies(self) -> bool:
        """Load movies from JSON file"""
        if not os.path.exists(self.json_path):
            print(f"❌ ERROR: File not found at {self.json_path}")
            print(f"Current directory: {os.getcwd()}")
            return False
        
        try:
            with open(self.json_path, 'r', encoding='utf-8') as file:
                self.movies = json.load(file)
            self.stats['total_movies'] = len(self.movies)
            print(f"✅ Loaded {self.stats['total_movies']} movies")
            return True
        except Exception as e:
            print(f"❌ ERROR reading JSON: {e}")
            return False
    
    def normalize_date(self, date_str: str) -> str:
        """
        Convert any date format to ISO 8601
        Input formats: YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, YYYY-MM-DDTHH:MM:SSZ
        Output: YYYY-MM-DDTHH:MM:SSZ
        """
        if not isinstance(date_str, str):
            return date_str
        
        # If already in ISO format with timezone
        if date_str.endswith('Z') and 'T' in date_str:
            return date_str
        
        # If has 'T' but no timezone
        if 'T' in date_str and not date_str.endswith('Z'):
            # Check if it already has seconds
            time_part = date_str.split('T')[1]
            if ':' in time_part:
                time_parts = time_part.split(':')
                if len(time_parts) == 2:
                    # Has only hours and minutes, add seconds
                    return f"{date_str}:00Z"
                elif len(time_parts) == 3:
                    # Has hours, minutes, seconds
                    return f"{date_str}Z"
        
        # If simple date format (YYYY-MM-DD)
        try:
            # Try parsing as date
            datetime.strptime(date_str, '%Y-%m-%d')
            return f"{date_str}T00:00:00Z"
        except ValueError:
            # Not a simple date, return as is
            return date_str
    
    def normalize_all_dates(self):
        """Normalize all createdAt and lastUpdated dates to ISO format"""
        print("🔄 Normalizing dates to ISO format...")
        
        for movie in self.movies:
            movie_id = movie.get('id', 'unknown')
            
            for field in ['createdAt', 'lastUpdated']:
                if field in movie:
                    original = movie[field]
                    normalized = self.normalize_date(original)
                    
                    if original != normalized:
                        movie[field] = normalized
                        self.stats['dates_normalized'] += 1
                        
                        # Show first few changes
                        if self.stats['dates_normalized'] <= 3:
                            print(f"  • {movie_id}: {field} '{original}' → '{normalized}'")
        
        if self.stats['dates_normalized'] > 0:
            if self.stats['dates_normalized'] > 3:
                print(f"  ... and {self.stats['dates_normalized'] - 3} more")
            print(f"✅ Normalized {self.stats['dates_normalized']} date(s)")
        else:
            print("✅ All dates already in proper ISO format")
    
    def safe_parse_date(self, date_str: str) -> Optional[datetime]:
        """Safely parse date string with multiple format attempts"""
        if not date_str:
            return None
        
        # Try multiple date formats
        formats_to_try = [
            '%Y-%m-%dT%H:%M:%SZ',      # 2024-01-15T12:45:00Z
            '%Y-%m-%dT%H:%M:%S',       # 2024-01-15T12:45:00
            '%Y-%m-%dT%H:%MZ',         # 2024-01-15T12:45Z
            '%Y-%m-%dT%H:%M',          # 2024-01-15T12:45
            '%Y-%m-%d %H:%M:%S',       # 2024-01-15 12:45:00
            '%Y-%m-%d',                # 2024-01-15
        ]
        
        for fmt in formats_to_try:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        # If all formats fail, try to extract just the date part
        try:
            # Extract date part (before 'T' or space)
            if 'T' in date_str:
                date_part = date_str.split('T')[0]
            elif ' ' in date_str:
                date_part = date_str.split(' ')[0]
            else:
                date_part = date_str
            
            return datetime.strptime(date_part, '%Y-%m-%d')
        except:
            return None
    
    def get_recent_activity_date(self, movie: Dict) -> Tuple[datetime, str]:
        """
        Get the most recent activity date and its source
        Returns: (datetime_object, 'createdAt' or 'lastUpdated')
        """
        movie_id = movie.get('id', 'unknown')
        
        try:
            created_str = movie.get('createdAt', '')
            updated_str = movie.get('lastUpdated', '')
            
            # Parse dates safely
            created = self.safe_parse_date(created_str)
            updated = self.safe_parse_date(updated_str)
            
            if not created and not updated:
                print(f"⚠️  Could not parse any date for movie {movie_id}")
                return datetime.now(), 'unknown'
            
            if not created:
                print(f"⚠️  Could not parse createdAt for movie {movie_id}: {created_str}")
                return updated, 'lastUpdated'
            
            if not updated:
                print(f"⚠️  Could not parse lastUpdated for movie {movie_id}: {updated_str}")
                return created, 'createdAt'
            
            # Determine which is more recent
            if updated >= created:
                return updated, 'lastUpdated'
            else:
                return created, 'createdAt'
                
        except Exception as e:
            print(f"⚠️  Error getting recent date for movie {movie_id}: {e}")
            # Fallback to current time
            return datetime.now(), 'unknown'
    
    def sort_by_recent_activity(self):
        """Sort movies by most recent activity (created or updated)"""
        print("📊 Sorting by most recent activity...")
        
        # Add temporary fields for sorting
        for movie in self.movies:
            recent_date, source = self.get_recent_activity_date(movie)
            movie['_sort_date'] = recent_date
            movie['_sort_source'] = source
            
            # Track which date was used (ensure key exists)
            if source in self.stats['recent_source_counts']:
                self.stats['recent_source_counts'][source] += 1
            else:
                self.stats['recent_source_counts'][source] = 1
        
        # Sort by recent date (newest first)
        self.movies.sort(key=lambda x: x['_sort_date'], reverse=True)
        
        # Remove temporary fields
        for movie in self.movies:
            movie.pop('_sort_date', None)
            movie.pop('_sort_source', None)
    
    def check_order_changed(self, original_order: List[str]) -> bool:
        """Check if the order changed after sorting"""
        current_order = [m.get('id', '') for m in self.movies]
        return original_order != current_order
    
    def save_movies(self) -> bool:
        """Save sorted movies back to JSON file"""
        try:
            # Create backup copy (optional)
            backup_path = f"{self.json_path}.backup"
            if os.path.exists(self.json_path):
                import shutil
                shutil.copy2(self.json_path, backup_path)
                print(f"📁 Backup created: {backup_path}")
            
            # Save sorted movies
            with open(self.json_path, 'w', encoding='utf-8') as file:
                json.dump(self.movies, file, indent=2, ensure_ascii=False)
            
            print(f"✅ Saved sorted movies to {self.json_path}")
            return True
            
        except Exception as e:
            print(f"❌ ERROR saving file: {e}")
            return False
    
    def print_summary(self, original_order: List[str]):
        """Print detailed summary of changes"""
        print("\n" + "="*60)
        print("🎬 MOVIE SORTING SUMMARY")
        print("="*60)
        
        print(f"📊 Statistics:")
        print(f"   • Total movies processed: {self.stats['total_movies']}")
        print(f"   • Dates normalized: {self.stats['dates_normalized']}")
        print(f"   • Order changed: {'Yes' if self.stats['order_changed'] else 'No'}")
        
        print(f"\n📅 Recent activity source:")
        for source, count in self.stats['recent_source_counts'].items():
            if count > 0:
                print(f"   • Sorted by {source}: {count}")
        
        print(f"\n🏆 Top 5 Most Recent Movies:")
        for i, movie in enumerate(self.movies[:5], 1):
            recent_date, source = self.get_recent_activity_date(movie)
            days_ago = (datetime.now() - recent_date).days
            
            # Safely extract date part for display
            created_display = movie.get('createdAt', 'N/A').split('T')[0] if 'T' in movie.get('createdAt', '') else movie.get('createdAt', 'N/A')
            updated_display = movie.get('lastUpdated', 'N/A').split('T')[0] if 'T' in movie.get('lastUpdated', '') else movie.get('lastUpdated', 'N/A')
            
            print(f"\n   {i}. {movie.get('title', 'Untitled')[:40]}...")
            print(f"      ID: {movie['id']}")
            print(f"      Recent activity: {recent_date.strftime('%Y-%m-%d %H:%M')}")
            print(f"      ({days_ago} days ago, based on {source})")
            print(f"      Created: {created_display}")
            print(f"      Updated: {updated_display}")
        
        if self.stats['total_movies'] > 5:
            print(f"\n   ... and {self.stats['total_movies'] - 5} more movies")
        
        print("\n" + "="*60)
    
    def run(self) -> bool:
        """Main execution method"""
        print("🚀 Starting movie sorting process...")
        print(f"📁 Processing: {self.json_path}")
        
        # Step 1: Load movies
        if not self.load_movies():
            return False
        
        # Store original order for comparison
        original_order = [m.get('id', '') for m in self.movies]
        
        # Step 2: Normalize dates
        self.normalize_all_dates()
        
        # Step 3: Sort by recent activity
        self.sort_by_recent_activity()
        
        # Step 4: Check if order changed
        self.stats['order_changed'] = self.check_order_changed(original_order)
        
        # Step 5: Save if changes were made
        if self.stats['dates_normalized'] > 0 or self.stats['order_changed']:
            if not self.save_movies():
                return False
            
            # Print summary
            self.print_summary(original_order)
            return True
        else:
            print("\n✅ No changes needed - movies already sorted and dates normalized")
            return False

def main():
    """Main function"""
    # You can change the path here if needed
    json_path = 'data/movies.json'
    
    # Create sorter instance
    sorter = MovieSorter(json_path)
    
    # Run the sorting process
    success = sorter.run()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
