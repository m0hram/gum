import json
import re
import sys

log_path = r"C:\Users\MR\.gemini\antigravity\brain\c9511d42-77f5-4b42-be83-732e6744d7ac\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

views = {}
for line in lines:
    try:
        data = json.loads(line)
        if data.get('type') == 'TOOL_RESPONSE' and 'view_file' in str(data.get('tool_name', '')):
            content = data.get('content', '')
            match = re.search(r"File Path: `file:///([^`]+)`", content)
            if match:
                path = match.group(1).replace('%20', ' ')
                
                # Extract code with line numbers
                code_match = re.search(r"The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>\. Please note that any changes targeting the original code should remove the line number, colon, and leading space\.\n(.*?)(?:\nThe above content|$)", content, re.DOTALL)
                if code_match:
                    code_lines = code_match.group(1).split('\n')
                    clean_code = []
                    for cl in code_lines:
                        if cl.strip() == "": continue
                        parts = cl.split(': ', 1)
                        if len(parts) >= 2 and parts[0].isdigit():
                            clean_code.append(parts[1])
                        else:
                            clean_code.append(cl)
                    
                    out_path = path.replace('/', '\\')
                    # Keep only the FIRST view of the file (which is the original state)
                    if out_path not in views:
                        views[out_path] = "\n".join(clean_code)
                        print(f"Captured original state of: {out_path}")
    except Exception as e:
        pass

for p, c in views.items():
    # Write to the new folder
    target_p = p.replace("f:\\New folder (24)\\موقع جيب", "f:\\New folder (24)\\New folder (3)\\موقع جيب")
    with open(target_p, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f"Restored {target_p}")
