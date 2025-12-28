#!/usr/bin/env python3
# scripts/sort_movies_fixed.py
# ✅ UTF-8 ফিক্স সহ সঠিকভাবে সর্টিং করার কোড

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
        """JSON ফাইল থেকে মুভি লোড করুন (UTF-8 সাপোর্ট সহ)"""
        if not os.path.exists(self.json_path):
            print(f"❌ ফাইল পাওয়া যায়নি: {self.json_path}")
            print(f"বর্তমান ডিরেক্টরি: {os.getcwd()}")
            return False
        
        try:
            # UTF-8 এনকোডিং স্পষ্টভাবে উল্লেখ করুন
            with open(self.json_path, 'r', encoding='utf-8') as file:
                content = file.read()
                
            # JSON পার্স করুন
            self.movies = json.loads(content)
            self.stats['total_movies'] = len(self.movies)
            print(f"✅ {self.stats['total_movies']} টি মুভি লোড হয়েছে")
            return True
            
        except UnicodeDecodeError:
            # যদি UTF-8 এ সমস্যা হয়, তাহলে utf-8-sig দিয়ে চেষ্টা করুন
            try:
                with open(self.json_path, 'r', encoding='utf-8-sig') as file:
                    content = file.read()
                self.movies = json.loads(content)
                self.stats['total_movies'] = len(self.movies)
                print(f"✅ {self.stats['total_movies']} টি মুভি লোড হয়েছে (utf-8-sig ব্যবহার করে)")
                return True
            except Exception as e:
                print(f"❌ JSON পড়ার সময় ত্রুটি: {e}")
                return False
                
        except Exception as e:
            print(f"❌ JSON পড়ার সময় ত্রুটি: {e}")
            return False
    
    def normalize_date(self, date_str: str) -> str:
        """যেকোনো তারিখ ফরম্যাটকে ISO 8601 ফরম্যাটে রূপান্তর করুন"""
        if not isinstance(date_str, str):
            return date_str
        
        # যদি ইতিমধ্যেই ISO ফরম্যাটে থাকে (timezone সহ)
        if date_str.endswith('Z') and 'T' in date_str:
            return date_str
        
        # যদি 'T' থাকে কিন্তু timezone না থাকে
        if 'T' in date_str and not date_str.endswith('Z'):
            time_part = date_str.split('T')[1]
            if ':' in time_part:
                time_parts = time_part.split(':')
                if len(time_parts) == 2:
                    # শুধু ঘন্টা এবং মিনিট আছে, সেকেন্ড যোগ করুন
                    return f"{date_str}:00Z"
                elif len(time_parts) == 3:
                    # ঘন্টা, মিনিট, সেকেন্ড আছে
                    return f"{date_str}Z"
        
        # যদি সাধারণ তারিখ ফরম্যাট হয় (YYYY-MM-DD)
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            return f"{date_str}T00:00:00Z"
        except ValueError:
            # সাধারণ তারিখ না হলে, যেমনটা আছে তেমন রেখে দিন
            return date_str
    
    def normalize_all_dates(self):
        """সমস্ত createdAt এবং lastUpdated তারিখগুলিকে ISO ফরম্যাটে নরমালাইজ করুন"""
        print("🔄 তারিখগুলো ISO ফরম্যাটে নরমালাইজ করা হচ্ছে...")
        
        for movie in self.movies:
            movie_id = movie.get('id', 'অজানা')
            
            for field in ['createdAt', 'lastUpdated']:
                if field in movie:
                    original = movie[field]
                    normalized = self.normalize_date(original)
                    
                    if original != normalized:
                        movie[field] = normalized
                        self.stats['dates_normalized'] += 1
                        
                        # প্রথম কয়েকটি পরিবর্তন দেখান
                        if self.stats['dates_normalized'] <= 3:
                            print(f"  • {movie_id}: {field} '{original}' → '{normalized}'")
        
        if self.stats['dates_normalized'] > 0:
            if self.stats['dates_normalized'] > 3:
                print(f"  ... এবং আরও {self.stats['dates_normalized'] - 3} টি")
            print(f"✅ {self.stats['dates_normalized']} টি তারিখ নরমালাইজ করা হয়েছে")
        else:
            print("✅ সমস্ত তারিখ ইতিমধ্যেই সঠিক ISO ফরম্যাটে আছে")
    
    def safe_parse_date(self, date_str: str) -> Optional[datetime]:
        """বিভিন্ন ফরম্যাট চেষ্টা করে নিরাপদে তারিখ পার্স করুন"""
        if not date_str:
            return None
        
        # বিভিন্ন তারিখ ফরম্যাট চেষ্টা করুন
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
        
        # যদি সব ফরম্যাট ব্যর্থ হয়, শুধু তারিখের অংশটা নিন
        try:
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
        সবচেয়ে সাম্প্রতিক এক্টিভিটি তারিখ এবং এর উৎস পান
        রিটার্ন: (datetime_object, 'createdAt' বা 'lastUpdated')
        """
        movie_id = movie.get('id', 'অজানা')
        
        try:
            created_str = movie.get('createdAt', '')
            updated_str = movie.get('lastUpdated', '')
            
            # নিরাপদে তারিখ পার্স করুন
            created = self.safe_parse_date(created_str)
            updated = self.safe_parse_date(updated_str)
            
            if not created and not updated:
                print(f"⚠️  মুভি {movie_id} এর জন্য কোনো তারিখ পার্স করা যায়নি")
                return datetime.now(), 'unknown'
            
            if not created:
                print(f"⚠️  মুভি {movie_id} এর createdAt পার্স করা যায়নি: {created_str}")
                return updated, 'lastUpdated'
            
            if not updated:
                print(f"⚠️  মুভি {movie_id} এর lastUpdated পার্স করা যায়নি: {updated_str}")
                return created, 'createdAt'
            
            # কোনটি বেশি সাম্প্রতিক তা নির্ধারণ করুন
            if updated >= created:
                return updated, 'lastUpdated'
            else:
                return created, 'createdAt'
                
        except Exception as e:
            print(f"⚠️  মুভি {movie_id} এর সাম্প্রতিক তারিখ পাওয়ার সময় ত্রুটি: {e}")
            # ফলব্যাক হিসেবে বর্তমান সময় ব্যবহার করুন
            return datetime.now(), 'unknown'
    
    def sort_by_recent_activity(self):
        """সবচেয়ে সাম্প্রতিক এক্টিভিটি অনুসারে মুভি সর্ট করুন"""
        print("📊 সাম্প্রতিক এক্টিভিটি অনুসারে সর্ট করা হচ্ছে...")
        
        # সর্ট করার জন্য সাময়িক ফিল্ড যোগ করুন
        for movie in self.movies:
            recent_date, source = self.get_recent_activity_date(movie)
            movie['_sort_date'] = recent_date
            movie['_sort_source'] = source
            
            # কোন তারিখ ব্যবহার করা হয়েছে তা ট্র্যাক করুন
            if source in self.stats['recent_source_counts']:
                self.stats['recent_source_counts'][source] += 1
            else:
                self.stats['recent_source_counts'][source] = 1
        
        # সাম্প্রতিক তারিখ অনুসারে সর্ট করুন (নতুন থেকে পুরানো)
        self.movies.sort(key=lambda x: x['_sort_date'], reverse=True)
        
        # সাময়িক ফিল্ড সরান
        for movie in self.movies:
            movie.pop('_sort_date', None)
            movie.pop('_sort_source', None)
    
    def check_order_changed(self, original_order: List[str]) -> bool:
        """সর্ট করার পর অর্ডার পরিবর্তন হয়েছে কিনা চেক করুন"""
        current_order = [m.get('id', '') for m in self.movies]
        return original_order != current_order
    
    def save_movies(self) -> bool:
        """সর্টেড মুভিগুলো JSON ফাইলে UTF-8 এনকোডিং সহ সংরক্ষণ করুন"""
        try:
            # ব্যাকআপ কপি তৈরি করুন (ঐচ্ছিক)
            backup_path = f"{self.json_path}.backup"
            if os.path.exists(self.json_path):
                import shutil
                shutil.copy2(self.json_path, backup_path)
                print(f"📁 ব্যাকআপ তৈরি হয়েছে: {backup_path}")
            
            # সর্টেড মুভিগুলো UTF-8 এনকোডিং সহ সংরক্ষণ করুন
            with open(self.json_path, 'w', encoding='utf-8') as file:
                # ensure_ascii=False গুরুত্বপূর্ণ: বাংলা টেক্সট ঠিকভাবে সংরক্ষণ করবে
                json.dump(self.movies, file, indent=2, ensure_ascii=False)
            
            print(f"✅ সর্টেড মুভিগুলো {self.json_path} তে সংরক্ষণ করা হয়েছে")
            
            # ফাইলটি সঠিকভাবে সংরক্ষণ হয়েছে কিনা যাচাই করুন
            self.verify_encoding()
            
            return True
            
        except Exception as e:
            print(f"❌ ফাইল সংরক্ষণ করতে ত্রুটি: {e}")
            return False
    
    def verify_encoding(self):
        """ফাইলের এনকোডিং যাচাই করুন"""
        try:
            with open(self.json_path, 'r', encoding='utf-8') as file:
                content = file.read(1000)  # প্রথম ১০০০ ক্যারেক্টার পড়ুন
                
                # সাধারণ এনকোডিং সমস্যা চেক করুন
                if 'Ã' in content or 'Â' in content:
                    print("⚠️  সতর্কতা: এনকোডিং সমস্যা সনাক্ত করা হয়েছে")
                    print("   ফাইলে ভুল এনকোডেড ক্যারেক্টার পাওয়া গেছে")
                else:
                    print("✅ এনকোডিং সঠিকভাবে যাচাই করা হয়েছে")
                    
        except Exception as e:
            print(f"⚠️  এনকোডিং যাচাই করতে ত্রুটি: {e}")
    
    def print_summary(self, original_order: List[str]):
        """পরিবর্তনের বিস্তারিত সারাংশ প্রিন্ট করুন"""
        print("\n" + "="*60)
        print("🎬 মুভি সর্টিং সারাংশ")
        print("="*60)
        
        print(f"📊 পরিসংখ্যান:")
        print(f"   • মোট প্রক্রিয়াকৃত মুভি: {self.stats['total_movies']}")
        print(f"   • নরমালাইজড তারিখ: {self.stats['dates_normalized']}")
        print(f"   • অর্ডার পরিবর্তন: {'হ্যাঁ' if self.stats['order_changed'] else 'না'}")
        
        print(f"\n📅 সাম্প্রতিক এক্টিভিটি উৎস:")
        for source, count in self.stats['recent_source_counts'].items():
            if count > 0:
                print(f"   • {source} দ্বারা সর্ট করা হয়েছে: {count}")
        
        print(f"\n🏆 শীর্ষ ৫টি সাম্প্রতিক মুভি:")
        for i, movie in enumerate(self.movies[:5], 1):
            recent_date, source = self.get_recent_activity_date(movie)
            days_ago = (datetime.now() - recent_date).days
            
            # প্রদর্শনের জন্য নিরাপদে তারিখের অংশ নিন
            created_display = movie.get('createdAt', 'N/A').split('T')[0] if 'T' in movie.get('createdAt', '') else movie.get('createdAt', 'N/A')
            updated_display = movie.get('lastUpdated', 'N/A').split('T')[0] if 'T' in movie.get('lastUpdated', '') else movie.get('lastUpdated', 'N/A')
            
            print(f"\n   {i}. {movie.get('title', 'শিরোনামহীন')[:40]}...")
            print(f"      আইডি: {movie['id']}")
            print(f"      সাম্প্রতিক এক্টিভিটি: {recent_date.strftime('%Y-%m-%d %H:%M')}")
            print(f"      ({days_ago} দিন আগে, {source} ভিত্তিক)")
            print(f"      তৈরি হয়েছে: {created_display}")
            print(f"      আপডেট হয়েছে: {updated_display}")
        
        if self.stats['total_movies'] > 5:
            print(f"\n   ... এবং আরও {self.stats['total_movies'] - 5} টি মুভি")
        
        print("\n" + "="*60)
    
    def run(self) -> bool:
        """মূল এক্সিকিউশন মেথড"""
        print("🚀 মুভি সর্টিং প্রক্রিয়া শুরু হচ্ছে...")
        print(f"📁 প্রক্রিয়াকরণ: {self.json_path}")
        
        # ধাপ 1: মুভি লোড করুন
        if not self.load_movies():
            return False
        
        # তুলনার জন্য মূল অর্ডার সংরক্ষণ করুন
        original_order = [m.get('id', '') for m in self.movies]
        
        # ধাপ 2: তারিখ নরমালাইজ করুন
        self.normalize_all_dates()
        
        # ধাপ 3: সাম্প্রতিক এক্টিভিটি অনুসারে সর্ট করুন
        self.sort_by_recent_activity()
        
        # ধাপ 4: অর্ডার পরিবর্তন হয়েছে কিনা চেক করুন
        self.stats['order_changed'] = self.check_order_changed(original_order)
        
        # ধাপ 5: পরিবর্তন হলে সংরক্ষণ করুন
        if self.stats['dates_normalized'] > 0 or self.stats['order_changed']:
            if not self.save_movies():
                return False
            
            # সারাংশ প্রিন্ট করুন
            self.print_summary(original_order)
            return True
        else:
            print("\n✅ কোনো পরিবর্তনের প্রয়োজন নেই - মুভিগুলো ইতিমধ্যেই সর্টেড এবং তারিখ নরমালাইজড")
            return False

def main():
    """মূল ফাংশন"""
    json_path = 'data/movies.json'
    
    # সর্টার ইন্সট্যান্স তৈরি করুন
    sorter = MovieSorter(json_path)
    
    # সর্টিং প্রক্রিয়া চালান
    success = sorter.run()
    
    # উপযুক্ত কোড দিয়ে প্রস্থান করুন
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
