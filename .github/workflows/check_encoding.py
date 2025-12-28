#!/usr/bin/env python3
# scripts/check_encoding.py
# মুভি JSON ফাইলের এনকোডিং চেক এবং ফিক্স করার টুল

import json
import os
import sys
import chardet  # pip install chardet

def detect_encoding(file_path):
    """ফাইলের এনকোডিং ডিটেক্ট করুন"""
    with open(file_path, 'rb') as file:
        raw_data = file.read()
        result = chardet.detect(raw_data)
        
        encoding = result['encoding']
        confidence = result['confidence']
        
        print(f"ফাইল: {file_path}")
        print(f"ডিটেক্টেড এনকোডিং: {encoding} ({confidence*100:.1f}% কনফিডেন্স)")
        print(f"ফাইলের সাইজ: {len(raw_data)} বাইট")
        
        return encoding, raw_data

def fix_encoding_issues(file_path):
    """এনকোডিং সমস্যা ফিক্স করুন"""
    print(f"\n🔧 এনকোডিং সমস্যা ফিক্স করার চেষ্টা করছি: {file_path}")
    
    # ব্যাকআপ তৈরি করুন
    backup_path = f"{file_path}.backup"
    import shutil
    shutil.copy2(file_path, backup_path)
    print(f"📁 ব্যাকআপ তৈরি হয়েছে: {backup_path}")
    
    try:
        # প্রথমে বর্তমান এনকোডিং ডিটেক্ট করুন
        encoding, raw_data = detect_encoding(file_path)
        
        # ফাইল পড়ার চেষ্টা করুন
        content = None
        
        # বিভিন্ন এনকোডিং চেষ্টা করুন
        encodings_to_try = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'ascii']
        
        for enc in encodings_to_try:
            try:
                content = raw_data.decode(enc)
                print(f"✅ {enc} দিয়ে সফলভাবে পড়া গেছে")
                
                # JSON পার্স করার চেষ্টা করুন
                data = json.loads(content)
                
                # UTF-8 এ সঠিকভাবে সংরক্ষণ করুন
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(data, file, indent=2, ensure_ascii=False)
                
                print(f"✅ ফাইল UTF-8 এ সঠিকভাবে সংরক্ষণ করা হয়েছে")
                
                # যাচাই করুন
                verify_fix(file_path)
                return True
                
            except (UnicodeDecodeError, json.JSONDecodeError) as e:
                print(f"❌ {enc} দিয়ে পড়তে ব্যর্থ: {str(e)[:50]}")
                continue
        
        print("❌ কোনো এনকোডিং কাজ করেনি")
        return False
        
    except Exception as e:
        print(f"❌ ফিক্স করতে ত্রুটি: {e}")
        
        # ব্যাকআপ থেকে রিস্টোর করুন
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, file_path)
            print("↩️ ব্যাকআপ থেকে রিস্টোর করা হয়েছে")
        
        return False

def verify_fix(file_path):
    """ফিক্সটি সঠিকভাবে কাজ করেছে কিনা যাচাই করুন"""
    print("\n🔍 ফিক্স যাচাই করা হচ্ছে...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read(1000)  # প্রথম ১০০০ ক্যারেক্টার
            
            # সমস্যাজনক প্যাটার্ন চেক করুন
            problematic_patterns = ['Ã', 'Â', '\\u00']
            
            issues_found = []
            for pattern in problematic_patterns:
                if pattern in content:
                    issues_found.append(pattern)
            
            if issues_found:
                print(f"⚠️  এখনও সমস্যা পাওয়া গেছে: {', '.join(issues_found)}")
                
                # সমস্যাযুক্ত অংশ দেখান
                lines = content.split('\n')
                for i, line in enumerate(lines[:5]):
                    for pattern in issues_found:
                        if pattern in line:
                            print(f"   লাইন {i+1}: {line[:80]}...")
                            break
            else:
                print("✅ কোনো এনকো
