#!/usr/bin/env python3
# sort_movies_simple.py - সরল এবং কার্যকরী সর্টিং স্ক্রিপ্ট

import json
import os
from datetime import datetime

def read_movies():
    """মুভি JSON ফাইল পড়ুন"""
    with open('data/movies.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def save_movies(movies):
    """মুভি JSON ফাইলে সংরক্ষণ করুন"""
    with open('data/movies.json', 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2, ensure_ascii=False)
    print("✅ মুভি সংরক্ষণ করা হয়েছে")

def get_date_from_string(date_str):
    """স্ট্রিং থেকে তারিখ বের করুন"""
    if not date_str:
        return datetime.min
    
    try:
        # তারিখের অংশ নিন (T পর্যন্ত)
        if 'T' in date_str:
            date_part = date_str.split('T')[0]
        else:
            date_part = date_str
        
        return datetime.strptime(date_part, '%Y-%m-%d')
    except:
        return datetime.min

def sort_movies():
    """মুভি সর্ট করুন"""
    print("🚀 মুভি সর্টিং শুরু...")
    
    # 1. মুভি পড়ুন
    movies = read_movies()
    print(f"📊 মোট মুভি: {len(movies)}")
    
    # 2. প্রতিটি মুভির জন্য সর্বশেষ তারিখ বের করুন
    for movie in movies:
        created = get_date_from_string(movie.get('createdAt', ''))
        updated = get_date_from_string(movie.get('lastUpdated', ''))
        
        # সবচেয়ে সাম্প্রতিক তারিখ নিন
        latest_date = created if created > updated else updated
        movie['_sort_date'] = latest_date
    
    # 3. তারিখ অনুসারে সর্ট করুন (নতুন থেকে পুরানো)
    movies.sort(key=lambda x: x['_sort_date'], reverse=True)
    
    # 4. অস্থায়ী ফিল্ড সরান
    for movie in movies:
        movie.pop('_sort_date', None)
    
    # 5. সংরক্ষণ করুন
    save_movies(movies)
    
    # 6. ফলাফল দেখান
    print("\n🏆 শীর্ষ ৫ মুভি:")
    print("-" * 50)
    for i, movie in enumerate(movies[:5], 1):
        title = movie.get('title', 'No Title')
        created = movie.get('createdAt', '')[:10]
        updated = movie.get('lastUpdated', '')[:10]
        
        print(f"{i}. {title[:40]}...")
        print(f"   Created: {created} | Updated: {updated}")
        print()
    
    print("🎉 সর্টিং সম্পূর্ণ!")

if __name__ == "__main__":
    sort_movies()