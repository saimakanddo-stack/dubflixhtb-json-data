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
                print("✅ কোনো এনকোডিং সমস্যা পাওয়া যায়নি")
                
            # JSON বৈধতা চেক করুন
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                print(f"✅ JSON বৈধতা পরীক্ষায় উত্তীর্ণ ({len(data)} আইটেম)")
            except json.JSONDecodeError as e:
                print(f"❌ JSON বৈধতা পরীক্ষায় ব্যর্থ: {e}")
                
    except Exception as e:
        print(f"❌ যাচাই করতে ত্রুটি: {e}")

def check_movies_file():
    """movies.json ফাইল চেক করুন"""
    file_path = 'data/movies.json'
    
    if not os.path.exists(file_path):
        print(f"❌ ফাইল পাওয়া যায়নি: {file_path}")
        return False
    
    print("="*60)
    print("🎬 মুভি JSON ফাইল এনকোডিং চেক")
    print("="*60)
    
    # বর্তমান এনকোডিং ডিটেক্ট করুন
    encoding, raw_data = detect_encoding(file_path)
    
    # সামগ্রী পড়ার চেষ্টা করুন
    try:
        # UTF-8 দিয়ে পড়ার চেষ্টা করুন
        content_utf8 = raw_data.decode('utf-8')
        print("✅ UTF-8 দিয়ে সফলভাবে পড়া গেছে")
        
        # JSON পার্স করুন
        data = json.loads(content_utf8)
        print(f"✅ JSON সফলভাবে পার্স করা হয়েছে ({len(data)} টি মুভি)")
        
        # প্রথম কয়েকটি মুভি চেক করুন
        print(f"\n📊 প্রথম ৩টি মুভি:")
        for i, movie in enumerate(data[:3], 1):
            title = movie.get('title', 'শিরোনামহীন')
            movie_id = movie.get('id', 'অজানা')
            
            # নন-ASCII ক্যারেক্টার আছে কিনা চেক করুন
            non_ascii = any(ord(char) > 127 for char in title)
            status = "বাংলা/নন-ASCII" if non_ascii else "ASCII-only"
            
            print(f"  {i}. {movie_id}: {title[:30]}... ({status})")
        
        # এনকোডিং সমস্যা চেক করুন
        if 'Ã' in content_utf8 or 'Â' in content_utf8:
            print(f"\n⚠️  সতর্কতা: এনকোডিং সমস্যা পাওয়া গেছে!")
            print("   ফাইলে 'Ã' বা 'Â' এর মতো ভুল ক্যারেক্টার আছে")
            
            fix_option = input("\nএনকোডিং সমস্যা ফিক্স করতে চান? (y/n): ")
            if fix_option.lower() == 'y':
                return fix_encoding_issues(file_path)
            else:
                print("ফিক্স বাতিল করা হয়েছে")
                return False
        else:
            print(f"\n✅ কোনো এনকোডিং সমস্যা পাওয়া যায়নি")
            return True
            
    except UnicodeDecodeError:
        print("❌ UTF-8 দিয়ে পড়তে ব্যর্থ")
        
        # অন্য এনকোডিং দিয়ে চেষ্টা করুন
        try:
            content_latin1 = raw_data.decode('latin-1')
            print("✅ latin-1 দিয়ে পড়া গেছে, কিন্তু এনকোডিং সমস্যা থাকতে পারে")
            
            fix_option = input("\nএনকোডিং সমস্যা ফিক্স করতে চান? (y/n): ")
            if fix_option.lower() == 'y':
                return fix_encoding_issues(file_path)
            else:
                return False
                
        except Exception as e:
            print(f"❌ কোনো এনকোডিং দিয়ে পড়তে ব্যর্থ: {e}")
            return False
    
    except json.JSONDecodeError as e:
        print(f"❌ JSON পার্স করতে ব্যর্থ: {e}")
        return False
    
    except Exception as e:
        print(f"❌ ত্রুটি: {e}")
        return False

def main():
    """মূল ফাংশন"""
    print("🔍 মুভি JSON ফাইল এনকোডিং টুল")
    print("="*40)
    
    # chardet ইনস্টল আছে কিনা চেক করুন
    try:
        import chardet
    except ImportError:
        print("❌ chardet মডিউল ইনস্টল করা নেই")
        print("ইনস্টল করতে: pip install chardet")
        sys.exit(1)
    
    # movies.json ফাইল চেক করুন
    success = check_movies_file()
    
    print("\n" + "="*60)
    if success:
        print("🎉 টুল সফলভাবে সম্পন্ন হয়েছে!")
    else:
        print("⚠️  টুল সম্পন্ন হয়েছে তবে কিছু সমস্যা থাকতে পারে")
    print("="*60)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
