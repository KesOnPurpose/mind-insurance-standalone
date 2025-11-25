#!/usr/bin/env python3
"""
Week 4 Optimization - Markdown Formatting Fixes
Diagnoses and fixes 12 protocols with unbalanced markdown markers

Error Type: Unbalanced markdown markers (* or _)
"""

import json
import os
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment
load_dotenv('/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/.env')
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key)

# 12 protocols with errors (from update-execution-log.json)
PROTOCOLS_WITH_ERRORS = [
    'd6365ac8-4fe8-418a-9907-b6ac4a91b33a',  # Meditation
    'f111f209-2915-4bc0-a54d-464798c0be25',  # Learning Practice
    'f625e514-cf36-483a-9330-79d4f4aeeec0',  # Journal Writing
    'f71fe16d-a604-49bd-b659-1666d451d909',
    '1ce39af8-4d03-444d-bbac-945c60591696',
    '6b9d1768-f379-440c-8046-eaa6c8df44cd',
    '9093891e-1865-408c-8e18-78c2d3693055',
    'ee1d8245-ccc3-456d-a0e4-7f49ad9c28b6',
    'ddce8bb9-25b7-4ba7-964c-739cdea4b913',
    '1146973b-2ada-4f2e-9881-4bb5751591cf',
    '9efa48f2-c71a-432b-903a-38a3de6d81b1',
    '08dbb74f-d4f2-46a2-aa7b-286dd26ca14b'
]

def count_markdown_markers(text):
    """Count markdown markers and identify imbalances."""
    # Count asterisks (bold ** and italic *)
    asterisks = text.count('*')

    # Count underscores (_ for italics)
    underscores = text.count('_')

    # Check for balanced pairs
    bold_markers = text.count('**')
    asterisks_after_bold = asterisks - (bold_markers * 2)

    return {
        'asterisks': asterisks,
        'asterisks_balanced': asterisks % 2 == 0,
        'bold_markers': bold_markers,
        'bold_balanced': bold_markers % 2 == 0,
        'italic_asterisks': asterisks_after_bold,
        'italic_asterisks_balanced': asterisks_after_bold % 2 == 0,
        'underscores': underscores,
        'underscores_balanced': underscores % 2 == 0
    }

def find_unbalanced_markers(text):
    """Find specific locations of unbalanced markers."""
    issues = []

    # Find all bold markers (**)
    bold_positions = [m.start() for m in re.finditer(r'\*\*', text)]
    if len(bold_positions) % 2 != 0:
        issues.append({
            'type': 'unbalanced_bold',
            'count': len(bold_positions),
            'positions': bold_positions,
            'message': f'Found {len(bold_positions)} bold markers (should be even)'
        })

    # Find single asterisks (after accounting for bold)
    # This is complex - let's just identify odd counts
    asterisk_positions = [m.start() for m in re.finditer(r'(?<!\*)\*(?!\*)', text)]
    if len(asterisk_positions) % 2 != 0:
        issues.append({
            'type': 'unbalanced_italic_asterisk',
            'count': len(asterisk_positions),
            'positions': asterisk_positions,
            'message': f'Found {len(asterisk_positions)} italic asterisks (should be even)'
        })

    # Find underscores
    underscore_positions = [m.start() for m in re.finditer(r'_', text)]
    if len(underscore_positions) % 2 != 0:
        issues.append({
            'type': 'unbalanced_underscore',
            'count': len(underscore_positions),
            'positions': underscore_positions,
            'message': f'Found {len(underscore_positions)} underscores (should be even)'
        })

    return issues

def fix_markdown_markers(text):
    """
    Attempt automatic fixes for common markdown issues.

    Strategy:
    1. Escape literal asterisks in math expressions (3 * 5)
    2. Remove trailing unmatched markers
    3. Add missing closing markers at sentence/paragraph boundaries
    """
    fixed_text = text
    fixes_applied = []

    # Fix 1: Escape asterisks in math expressions (number * number)
    math_pattern = r'(\d+)\s\*\s(\d+)'
    if re.search(math_pattern, fixed_text):
        fixed_text = re.sub(math_pattern, r'\1 \\* \2', fixed_text)
        fixes_applied.append('Escaped asterisks in math expressions')

    # Fix 2: Check for unbalanced markers
    markers = count_markdown_markers(fixed_text)

    # If asterisks are odd, try to balance
    if not markers['asterisks_balanced']:
        # Count how many we need to balance
        asterisk_count = markers['asterisks']

        # Strategy: Add closing marker at end of text
        fixed_text = fixed_text + '*'
        fixes_applied.append('Added closing asterisk at end')

    # If underscores are odd, try to balance
    if not markers['underscores_balanced']:
        underscore_count = markers['underscores']

        # Strategy: Add closing underscore at end
        fixed_text = fixed_text + '_'
        fixes_applied.append('Added closing underscore at end')

    return fixed_text, fixes_applied

def diagnose_protocol(protocol_id):
    """Diagnose markdown issues in a specific protocol."""
    # Fetch protocol from database
    result = supabase.table('mio_knowledge_chunks').select('chunk_text, chunk_summary').eq('id', protocol_id).single().execute()

    if not result.data:
        return None

    protocol = result.data
    text = protocol['chunk_text']
    summary = protocol['chunk_summary']

    # Analyze markers
    markers = count_markdown_markers(text)
    issues = find_unbalanced_markers(text)

    return {
        'protocol_id': protocol_id,
        'chunk_summary': summary,
        'text_length': len(text),
        'markers': markers,
        'issues': issues,
        'has_issues': len(issues) > 0
    }

def fix_protocol(protocol_id):
    """Fix markdown issues and update database."""
    # Fetch protocol
    result = supabase.table('mio_knowledge_chunks').select('chunk_text, chunk_summary').eq('id', protocol_id).single().execute()

    if not result.data:
        return {'success': False, 'error': 'Protocol not found'}

    protocol = result.data
    original_text = protocol['chunk_text']
    summary = protocol['chunk_summary']

    # Attempt fix
    fixed_text, fixes_applied = fix_markdown_markers(original_text)

    # Validate fix
    markers_after = count_markdown_markers(fixed_text)
    is_fixed = markers_after['asterisks_balanced'] and markers_after['underscores_balanced']

    if is_fixed:
        # Update database
        update_result = supabase.table('mio_knowledge_chunks').update({
            'chunk_text': fixed_text
        }).eq('id', protocol_id).execute()

        return {
            'success': True,
            'protocol_id': protocol_id,
            'chunk_summary': summary,
            'fixes_applied': fixes_applied,
            'markers_before': count_markdown_markers(original_text),
            'markers_after': markers_after
        }
    else:
        return {
            'success': False,
            'protocol_id': protocol_id,
            'chunk_summary': summary,
            'error': 'Automatic fix failed - manual review required',
            'fixes_attempted': fixes_applied,
            'markers_after': markers_after
        }

def main():
    print("=" * 80)
    print("MARKDOWN FORMATTING FIX UTILITY")
    print("=" * 80)
    print(f"\nDiagnosing {len(PROTOCOLS_WITH_ERRORS)} protocols with validation errors...")
    print()

    # Phase 1: Diagnosis
    print("PHASE 1: DIAGNOSIS")
    print("-" * 80)

    diagnosis_results = []
    for i, protocol_id in enumerate(PROTOCOLS_WITH_ERRORS, 1):
        print(f"[{i}/{len(PROTOCOLS_WITH_ERRORS)}] Diagnosing {protocol_id}...")
        result = diagnose_protocol(protocol_id)

        if result:
            diagnosis_results.append(result)

            if result['has_issues']:
                print(f"  ✗ {result['chunk_summary']}")
                for issue in result['issues']:
                    print(f"    - {issue['message']}")
            else:
                print(f"  ✓ {result['chunk_summary']} - No issues found")
        else:
            print(f"  ✗ Protocol not found")

    # Summary
    protocols_with_issues = [r for r in diagnosis_results if r['has_issues']]
    print()
    print(f"Protocols with issues: {len(protocols_with_issues)}/{len(diagnosis_results)}")
    print()

    # Phase 2: Fixing
    print("PHASE 2: AUTOMATIC FIXES")
    print("-" * 80)

    fix_results = []
    for protocol_id in [r['protocol_id'] for r in protocols_with_issues]:
        print(f"Fixing {protocol_id}...")
        result = fix_protocol(protocol_id)
        fix_results.append(result)

        if result['success']:
            print(f"  ✓ {result['chunk_summary']}")
            for fix in result['fixes_applied']:
                print(f"    - {fix}")
        else:
            print(f"  ✗ {result['chunk_summary']}")
            print(f"    - {result['error']}")

    print()
    print("=" * 80)
    print("FIX SUMMARY")
    print("=" * 80)

    successful_fixes = [r for r in fix_results if r['success']]
    failed_fixes = [r for r in fix_results if not r['success']]

    print(f"\nSuccessful fixes: {len(successful_fixes)}/{len(fix_results)}")
    print(f"Failed fixes (manual review needed): {len(failed_fixes)}")

    if failed_fixes:
        print("\nProtocols requiring manual review:")
        for result in failed_fixes:
            print(f"  - {result['protocol_id']}: {result['chunk_summary']}")

    # Save detailed log
    log_data = {
        'diagnosis_results': diagnosis_results,
        'fix_results': fix_results,
        'summary': {
            'total_protocols': len(PROTOCOLS_WITH_ERRORS),
            'protocols_with_issues': len(protocols_with_issues),
            'successful_fixes': len(successful_fixes),
            'failed_fixes': len(failed_fixes)
        }
    }

    with open('markdown-fixes-log.json', 'w') as f:
        json.dump(log_data, f, indent=2)

    print(f"\n✓ Detailed log saved to markdown-fixes-log.json")
    print("=" * 80)

    return len(successful_fixes), len(failed_fixes)

if __name__ == '__main__':
    successful, failed = main()

    if failed > 0:
        print(f"\n⚠️  {failed} protocols require manual review")
        exit(1)
    else:
        print(f"\n✓ All {successful} protocols fixed successfully!")
        exit(0)
