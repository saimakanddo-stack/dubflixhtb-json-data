#!/usr/bin/env python3
# fix_encoding.py - সরল এনকোডিং ফিক্স স্ক্রিপ্ট

import json
import os

def fix_movies_json():
    input_file = 'data/movies.json'
    output_file = 'data/movies_fixed.json'
    
    if not os.path.exists(input_file):
        print(f"ফাইল পাওয়া যায়নি: {input_file}")
        return False
    
    print("ফাইল পড়ছি...")
    
    # 1. প্রথমে বাইনারি মোডে পড়ুন
    with open(input_file, 'rb') as f:
        raw_bytes = f.read()
    
    # 2. বিভিন্ন এনকোডিং চেষ্টা করুন
    encodings_to_try = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
    
    data = None
    used_encoding = None
    
    for encoding in encodings_to_try:
        try:
            content = raw_bytes.decode(encoding)
            data = json.loads(content)
            used_encoding = encoding
            print(f"✅ সফলভাবে পড়া গেছে: {encoding}")
            break
        except:
            continue
    
    if data is None:
        print("❌ কোনো এনকোডিং কাজ করেনি!")
        return False
    
    print(f"মোট মুভি: {len(data)}")
    print(f"ব্যবহৃত এনকোডিং: {used_encoding}")
    
    # 3. UTF-8 এ সঠিকভাবে সংরক্ষণ করুন
    print("\nফাইল সংরক্ষণ করছি...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    # 4. ব্যাকআপ তৈরি করুন
    backup_file = 'data/movies_backup.json'
    with open(input_file, 'rb') as src, open(backup_file, 'wb') as dst:
        dst.write(src.read())
    
    # 5. ফিক্সড ফাইলটি মূল নামে কপি করুন
    with open(output_file, 'r', encoding='utf-8') as src, open(input_file, 'w', encoding='utf-8') as dst:
        dst.write(src.read())
    
    # 6. টেম্প ফাইল ডিলিট করুন
    os.remove(output_file)
    
    print(f"\n✅ সফলভাবে এনকোডিং ঠিক করা হয়েছে!")
    print(f"✅ ব্যাকআপ: {backup_file}")
    print(f"✅ মূল ফাইল UTF-8 এ সংরক্ষণ করা হয়েছে")
    
    # প্রথম মুভিটির শিরোনাম দেখান
    if data:
        first_movie = data[0]
        print(f"\nপ্রথম মুভির শিরোনাম: {first_movie.get('title', 'N/A')}")
    
    return True

if __name__ == "__main__":
    fix_movies_json()