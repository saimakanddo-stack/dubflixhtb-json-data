#!/usr/bin/env python3
# scripts/update_movie_status_fixed.py
# ✅ UTF-8 ফিক্স সহ মুভি স্ট্যাটাস আপডেট করার কোড

import json
import os
import sys
from datetime import datetime

def parse_date(date_str):
    """ISO ফরম্যাট বা সাধারণ তারিখ ফরম্যাট থেকে তারিখ পার্স করুন"""
    if not date_str:
        return datetime.now()
    
    try:
        # টাইম পার্ট থাকলে সরিয়ে দিন (ফরম্যাট: YYYY-MM-DD বা YYYY-MM-DDTHH:MM:SSZ)
        date_only = date_str.split('T')[0] if 'T' in date_str else date_str
        # টাইমজোন তথ্য থাকলে সরিয়ে দিন
        date_only = date_only.split('+')[0] if '+' in date_str else date_only
        return datetime.strptime(date_only, '%Y-%m-%d')
    except ValueError:
        # পার্স করতে ব্যর্থ হলে বর্তমান তারিখ রিটার্ন করুন
        print(f"⚠️ সতর্কতা: তারিখ '{date_str}' পার্স করা যায়নি, বর্তমান তারিখ ব্যবহার করা হচ্ছে")
        return datetime.now()

def update_movie_status():
    current_date = datetime.now()
    json_path = 'data/movies.json'
    
    if not os.path.exists(json_path):
        print(f"❌ ত্রুটি: {json_path} ফাইল পাওয়া যায়নি!")
        sys.exit(1)
    
    print(f"📁 ফাইল প্রক্রিয়াকরণ: {json_path}")
    
    # UTF-8 এনকোডিং দিয়ে ফাইল পড়ুন
    try:
        with open(json_path, 'r', encoding='utf-8') as file:
            content = file.read()
            movies = json.loads(content)
            
    except UnicodeDecodeError:
        # যদি UTF-8 এ সমস্যা হয়, utf-8-sig দিয়ে চেষ্টা করুন
        try:
            with open(json_path, 'r', encoding='utf-8-sig') as file:
                content = file.read()
                # BOM সরিয়ে দিন (যদি থাকে)
                if content.startswith('\ufeff'):
                    content = content[1:]
                movies = json.loads(content)
            print("✅ utf-8-sig এনকোডিং ব্যবহার করে ফাইল পড়া হয়েছে")
        except Exception as e:
            print(f"❌ ফাইল পড়তে ত্রুটি: {e}")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ ফাইল পড়তে ত্রুটি: {e}")
        sys.exit(1)
    
    changes_made = 0
    
    for movie in movies:
        try:
            movie_id = movie.get('id', 'অজানা')
            
            # নিরাপদে তারিখ পান
            created_at_str = movie.get('createdAt', '')
            last_updated_str = movie.get('lastUpdated', '')
            
            created_at = parse_date(created_at_str)
            last_updated = parse_date(last_updated_str)
            
            days_since_created = (current_date - created_at).days
            days_since_updated = (current_date - last_updated).days
            
            old_value = movie.get('info1_custom', '')
            
            # ব্যবসায়িক নিয়ম প্রয়োগ করুন
            if created_at.date() == last_updated.date():
                # যদি একই তারিখে তৈরি এবং আপডেট করা হয়
                new_value = 'NEW' if days_since_created <= 7 else ''
            else:
                # যদি আলাদা তারিখে তৈরি এবং আপডেট করা হয়
                if days_since_created <= 7:
                    new_value = 'NEW'
                elif days_since_updated <= 10:
                    new_value = 'UPDATED'
                else:
                    new_value = ''
            
            # মান পরিবর্তন হলে আপডেট করুন
            if old_value != new_value:
                movie['info1_custom'] = new_value
                changes_made += 1
                print(f"🔄 আপডেট করা হয়েছে {movie_id}: {old_value} → {new_value}")
                print(f"   তৈরি হয়েছে: {days_since_created} দিন আগে, আপডেট হয়েছে: {days_since_updated} দিন আগে")
                
        except Exception as e:
            print(f"⚠️ মুভি {movie.get('id', 'অজানা')} এর সাথে ত্রুটি: {e}")
            continue
    
    if changes_made > 0:
        # UTF-8 এনকোডিং দিয়ে সংরক্ষণ করুন
        try:
            with open(json_path, 'w', encoding='utf-8') as file:
                # ensure_ascii=False গুরুত্বপূর্ণ: বাংলা টেক্সট ঠিকভাবে সংরক্ষণ করবে
                json.dump(movies, file, indent=2, ensure_ascii=False)
            
            # যাচাই করুন যে ফাইল সঠিকভাবে সংরক্ষণ হয়েছে
            verify_encoding(json_path)
            
            print(f"\n✅ সফলভাবে {changes_made} টি মুভি আপডেট করা হয়েছে")
        except Exception as e:
            print(f"❌ ফাইল সংরক্ষণ করতে ত্রুটি: {e}")
            return False
    else:
        print("\n✅ কোনো আপডেটের প্রয়োজন নেই")
    
    return changes_made > 0

def verify_encoding(file_path):
    """ফাইলের এনকোডিং যাচাই করুন"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read(500)  # প্রথম ৫০০ ক্যারেক্টার পড়ুন
            
            # সাধারণ এনকোডিং সমস্যা চেক করুন
            if 'Ã' in content or 'Â' in content:
                print("⚠️ সতর্কতা: এনকোডিং সমস্যা সনাক্ত করা হয়েছে")
            else:
                print("✅ এনকোডিং সঠিকভাবে যাচাই করা হয়েছে")
                
    except Exception as e:
        print(f"⚠️ এনকোডিং যাচাই করতে ত্রুটি: {e}")

def main():
    """মূল ফাংশন"""
    print("🔄 মুভি স্ট্যাটাস আপডেট প্রক্রিয়া শুরু হচ্ছে...")
    
    success = update_movie_status()
    
    if success:
        print("\n🎉 প্রক্রিয়া সফলভাবে সম্পন্ন হয়েছে!")
    else:
        print("\n⚠️ প্রক্রিয়া সম্পন্ন হয়েছে তবে কোনো পরিবর্তন করা হয়নি")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
