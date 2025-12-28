#!/usr/bin/env python3
# update_status.py - মুভি স্ট্যাটাস আপডেট

import json
import os
from datetime import datetime

def update_status():
    print("🔄 মুভি স্ট্যাটাস আপডেট শুরু...")
    
    # 1. ফাইল পড়ুন
    with open('data/movies.json', 'r', encoding='utf-8') as f:
        movies = json.load(f)
    
    today = datetime.now()
    changes = 0
    
    # 2. প্রতিটি মুভি চেক করুন
    for movie in movies:
        created_str = movie.get('createdAt', '')
        updated_str = movie.get('lastUpdated', '')
        
        # তারিখ পার্স করুন
        try:
            if 'T' in created_str:
                created_date = datetime.strptime(created_str.split('T')[0], '%Y-%m-%d')
            else:
                created_date = datetime.strptime(created_str, '%Y-%m-%d')
                
            if 'T' in updated_str:
                updated_date = datetime.strptime(updated_str.split('T')[0], '%Y-%m-%d')
            else:
                updated_date = datetime.strptime(updated_str, '%Y-%m-%d')
            
            # দিনের পার্থক্য বের করুন
            days_since_created = (today - created_date).days
            days_since_updated = (today - updated_date).days
            
            # স্ট্যাটাস নির্ধারণ করুন
            old_status = movie.get('info1_custom', '')
            new_status = ''
            
            if created_date.date() == updated_date.date():
                # একই তারিখে তৈরি এবং আপডেট
                if days_since_created <= 7:
                    new_status = 'NEW'
            else:
                # ভিন্ন তারিখ
                if days_since_created <= 7:
                    new_status = 'NEW'
                elif days_since_updated <= 10:
                    new_status = 'UPDATED'
            
            # স্ট্যাটাস আপডেট করুন
            if old_status != new_status:
                movie['info1_custom'] = new_status
                changes += 1
                print(f"🔄 {movie.get('id')}: {old_status} → {new_status}")
                
        except Exception as e:
            continue
    
    # 3. পরিবর্তন থাকলে সংরক্ষণ করুন
    if changes > 0:
        with open('data/movies.json', 'w', encoding='utf-8') as f:
            json.dump(movies, f, indent=2, ensure_ascii=False)
        print(f"\n✅ {changes} টি মুভি আপডেট করা হয়েছে")
    else:
        print("\nℹ️ কোনো পরিবর্তনের প্রয়োজন নেই")
    
    return changes > 0

if __name__ == "__main__":
    update_status()