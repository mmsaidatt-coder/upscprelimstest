import re
import json

def extract_visionias_answers():
    with open('data/visionias-key.txt', 'r') as f:
        text = f.read()
    
    # We are looking for the pattern of question options ending with (d) followed by the answer letter
    # For example: (d) I, II and III A The government...
    # Or (d) Neither I nor II C "The Rashtriya...
    # Let's match: \(d\).*?([A-D])\s+[A-Z]
    
    # We will split the text by question numbers.
    # The questions start with "1 S&T", "2 Current Affairs", "3 S&T", etc.
    # We can split on "\n[1-100] "
    
    answers = {}
    
    lines = text.split('\n')
    current_q = None
    
    for line in lines:
        # Match "1 S&T", "24 Ancient History", etc. at the start of a line
        m = re.match(r'^(\d{1,3})\s+[A-Za-z]', line.strip())
        if m:
            num = int(m.group(1))
            if 1 <= num <= 100:
                current_q = num
                continue
                
        # If we are in a question, look for the answer
        if current_q and current_q not in answers:
            # The answer is usually a single capital letter A, B, C, or D sitting alone 
            # or right after the options. Let's look for the options block.
            # Usually the line looks like: "(d) ... A " or "(d) ... B "
            # Let's find a line containing "(a)", "(b)", "(c)", and "(d)", and the letter after it.
            # Actually, the text might have "(a) ... (b) ... (c) ... (d) ... [A-D] "
            
            # Let's check if the line contains "(d)" and then an A, B, C, or D
            m2 = re.search(r'\(d\).*?\s+([A-D])\s+', line)
            if m2:
                answers[current_q] = m2.group(1)
            elif "(d)" in line:
                # the answer might be on the next line or at the very end
                # let's just grab the next isolated A, B, C, D
                pass
                
    # A more robust way: Find all occurrences of "(d)...... [A-D] "
    # or just use regex over the whole text for the Question Number pattern.
    
    # Let's try to find all: Q_number ... (a) ... (b) ... (c) ... (d) ... Answer_Letter
    matches = []
    
    # Let's manually parse by blocks
    blocks = re.split(r'\n(?=\d{1,3}\s+[A-Z])', text)
    print(f"Found {len(blocks)} blocks")
    for b in blocks:
        m = re.match(r'^(\d{1,3})\s+', b)
        if m:
            q_num = int(m.group(1))
            if 1 <= q_num <= 100:
                # find the answer in this block
                # The answer is usually the first standalone capital letter A, B, C, or D after "(d)" 
                ans_match = re.search(r'\(d\)[^\n]*?\s([A-D])\s+[A-Z]', b)
                if ans_match:
                    answers[q_num] = ans_match.group(1)
                else:
                    # just look for the first isolated A, B, C, or D after the last option
                    d_idx = b.find('(d)')
                    if d_idx != -1:
                        ans_match2 = re.search(r'\s([A-D])\s+[A-Z]', b[d_idx:d_idx+200])
                        if ans_match2:
                            answers[q_num] = ans_match2.group(1)
                        else:
                            # It might be in the form of "Answer:(c)"
                            ans_match3 = re.search(r'Answer\s*:\s*\(([a-d])\)', b, re.IGNORECASE)
                            if ans_match3:
                                answers[q_num] = ans_match3.group(1).upper()
                                
    print(f"Extracted {len(answers)} answers.")
    missing = [i for i in range(1, 101) if i not in answers]
    print(f"Missing answers for: {missing}")
    
    # Write to a JSON file
    with open('data/visionias-key.json', 'w') as f:
        json.dump(answers, f, indent=2)

if __name__ == "__main__":
    extract_visionias_answers()
