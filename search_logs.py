import os
import json
brain_path = r'C:\Users\MR\.gemini\antigravity\brain'
search_terms = ['الصوره رقم', 'رقم 1', 'الصورة رقم', 'التعديل', 'تعديل', 'سوده']

def search_logs():
    for root, dirs, files in os.walk(brain_path):
        if 'overview.txt' in files:
            path = os.path.join(root, 'overview.txt')
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for line_num, line in enumerate(f):
                        for term in search_terms:
                            if term in line:
                                print(f"Found in {path} (Line {line_num}): {term}")
                                # Print snippet
                                try:
                                    d = json.loads(line)
                                    print("Content:", d.get('content', '')[:300])
                                except Exception:
                                    pass
            except Exception as e:
                pass
search_logs()
