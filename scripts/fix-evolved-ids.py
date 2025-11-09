#!/usr/bin/env python3
"""
Fix ID collisions in automaton.metverse.jsonl by generating unique IDs for evolved entries.

This script:
- Preserves original entries (non-evolved) with their original IDs
- Generates unique IDs for evolved entries with duplicate IDs
- Format: {baseId}-evolved-{counter}
"""

import json
import sys
from pathlib import Path


def fix_evolved_ids(input_file, output_file):
    """
    Fix ID collisions by generating unique IDs for evolved entries.
    
    Args:
        input_file: Path to input JSONL file
        output_file: Path to output JSONL file
    """
    seen_ids = set()
    evolved_counters = {}  # Track counters per base ID
    changes = []
    
    input_path = Path(input_file)
    output_path = Path(output_file)
    
    if not input_path.exists():
        print(f"Error: Input file not found: {input_file}", file=sys.stderr)
        sys.exit(1)
    
    with open(input_path, 'r', encoding='utf-8') as f_in, \
         open(output_path, 'w', encoding='utf-8') as f_out:
        
        for line_num, line in enumerate(f_in, 1):
            line = line.strip()
            if not line:
                f_out.write('\n')
                continue
            
            try:
                obj = json.loads(line)
                original_id = obj.get('id')
                
                # Check if this is an evolved entry
                is_evolved = obj.get('currentState') == 'evolved'
                
                if original_id:
                    if original_id in seen_ids and is_evolved:
                        # Generate unique ID for evolved entry
                        base_id = original_id
                        if base_id not in evolved_counters:
                            evolved_counters[base_id] = 0
                        evolved_counters[base_id] += 1
                        new_id = f"{base_id}-evolved-{evolved_counters[base_id]}"
                        obj['id'] = new_id
                        changes.append({
                            'line': line_num,
                            'old_id': original_id,
                            'new_id': new_id
                        })
                        print(f"Line {line_num}: Changed '{original_id}' -> '{new_id}'")
                    else:
                        # First occurrence - keep original ID
                        seen_ids.add(original_id)
                
                # Write updated line
                f_out.write(json.dumps(obj, ensure_ascii=False) + '\n')
                
            except json.JSONDecodeError as e:
                print(f"Warning: Line {line_num} is not valid JSON: {e}", file=sys.stderr)
                f_out.write(line + '\n')
    
    return changes


if __name__ == '__main__':
    input_file = '/home/main/automaton/automaton.metverse.jsonl'
    output_file = '/home/main/automaton/automaton.metverse.jsonl.fixed'
    
    print(f"Reading from: {input_file}")
    print(f"Writing to: {output_file}\n")
    
    changes = fix_evolved_ids(input_file, output_file)
    
    print(f"\n✅ Fixed {len(changes)} ID collisions")
    print(f"✅ Fixed file written to: {output_file}")
    print("\nSummary of changes:")
    for change in changes:
        print(f"  Line {change['line']}: {change['old_id']} -> {change['new_id']}")
    
    print("\n📝 Next steps:")
    print("  1. Review the fixed file: automaton.metverse.jsonl.fixed")
    print("  2. Verify all evolved entries have unique IDs")
    print("  3. Replace original: mv automaton.metverse.jsonl.fixed automaton.metverse.jsonl")
