import json
import re

log_path = r"C:\Users\MR\.gemini\antigravity\brain\c9511d42-77f5-4b42-be83-732e6744d7ac\.system_generated\logs\overview.txt"

def run():
    lines = open(log_path, 'r', encoding='utf-8').readlines()
    views = {}
    for line in lines:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE' and 'tool_calls' in data:
                for tc in data['tool_calls']:
                    if tc['name'] == 'view_file':
                        # record the viewed file
                        views[data['step_index']] = tc['args']['AbsolutePath']
            elif data.get('type') == 'TOOL_RESPONSE' and data.get('tool_name') == 'view_file':
                # find the corresponding view
                # Actually, TOOL_RESPONSE doesn't have step_index of the caller directly, we can just parse the output text
                content = data.get('content', '')
                match = re.search(r"File Path: `file:///([^`]+)`", content)
                if match:
                    path = match.group(1).replace('%20', ' ')
                    # The content has line numbers like "1: import React..."
                    code_match = re.search(r"The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>\. Please note that any changes targeting the original code should remove the line number, colon, and leading space\.\n(.*?)(?:\nThe above content|$)", content, re.DOTALL)
                    if code_match:
                        code_lines = code_match.group(1).split('\n')
                        clean_code = []
                        for cl in code_lines:
                            if cl.strip() == "":
                                continue
                            parts = cl.split(': ', 1)
                            if len(parts) >= 2 and parts[0].isdigit():
                                clean_code.append(parts[1])
                            else:
                                clean_code.append(cl)
                        
                        out_path = path.replace('/', '\\')
                        import os
                        print(f"Extracted {out_path}")
                        with open(out_path + ".bak", "w", encoding='utf-8') as f:
                            f.write("\n".join(clean_code))
        except Exception as e:
            pass

run()
