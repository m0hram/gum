import json
import re

log_paths = [
    r"C:\Users\MR\.gemini\antigravity\brain\67d7b3d5-6f2b-4b13-af03-5dc5e2e937d7\.system_generated\logs\overview.txt",
    r"C:\Users\MR\.gemini\antigravity\brain\edde95c6-1651-4fcb-a032-0f9284d6e90d\.system_generated\logs\overview.txt",
    r"C:\Users\MR\.gemini\antigravity\brain\77f7d10c-e8c5-4767-a696-6270226409dd\.system_generated\logs\overview.txt"
]

files_to_restore = [
    "App.jsx", "App.css",
    "CinematicLayer.jsx", "CinematicLayer.css",
    "DarkSequence.jsx", "DarkSequence.css",
    "IntroSequence.jsx", "IntroSequence.css",
    "HeroSequence.jsx", "HeroSequence.css",
    "HeroQ92Sequence.jsx", "HeroQ92Sequence.css",
    "ProgressionSequence.jsx", "ProgressionSequence.css",
    "LogoSplash.jsx", "LogoSplash.css"
]

restored = set()

def clean_and_write(path_str, content):
    fname = path_str.split('/')[-1]
    if fname in restored or fname not in files_to_restore:
        return
    
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
        
        out_path = r"f:\New folder (24)\New folder (3)\موقع جيب\src\components"
        if fname == "App.jsx" or fname == "App.css":
            out_path = r"f:\New folder (24)\New folder (3)\موقع جيب\src"
            
        import os
        with open(os.path.join(out_path, fname), 'w', encoding='utf-8') as f:
            f.write("\n".join(clean_code))
        restored.add(fname)

for lp in log_paths:
    try:
        with open(lp, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    d = json.loads(line)
                    if d.get('type') == 'TOOL_RESPONSE' and d.get('content'):
                        c = d['content']
                        match = re.search(r"File Path: `file:///([^`]+)`", c)
                        if match:
                            clean_and_write(match.group(1), c)
                except Exception: pass
    except Exception: pass

with open('restore_status.txt', 'w') as f:
    f.write("Restored:\n" + "\n".join(restored))
