#!/usr/bin/env python3
"""
Glossary De-duplication Script
Remove case-insensitive duplicate terms from neuroscience glossary.

Strategy:
1. Load glossary
2. Group terms by lowercase version
3. For duplicates, keep the best entry based on quality metrics
4. Save de-duplicated glossary
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict

def calculate_entry_quality(entry: Dict[str, Any]) -> float:
    """
    Calculate quality score for a glossary entry.

    Factors:
    - Has user_friendly definition: +10
    - Has clinical_definition: +8
    - Has analogy: +7
    - Has why_it_matters: +6
    - Has example_sentence: +5
    - Definition length (longer is better): +length/100
    - Reading level (lower is better): -reading_level
    """
    score = 0.0

    # Presence of key fields
    if entry.get('user_friendly'):
        score += 10
    if entry.get('clinical_definition'):
        score += 8
    if entry.get('analogy'):
        score += 7
    if entry.get('why_it_matters'):
        score += 6
    if entry.get('example_sentence'):
        score += 5

    # Definition quality
    user_friendly = entry.get('user_friendly', '')
    if user_friendly:
        score += len(user_friendly) / 100

    # Reading level (lower is better)
    reading_level = entry.get('reading_level', 10.0)
    score -= reading_level * 0.5

    return score

def deduplicate_glossary(glossary: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Remove case-insensitive duplicates from glossary.

    Returns:
        (deduplicated_glossary, report)
    """
    # Group by lowercase term
    term_groups = defaultdict(list)

    for entry in glossary:
        term_lower = entry['term'].lower()
        term_groups[term_lower].append(entry)

    # Find duplicates
    duplicates_found = []
    deduplicated = []

    for term_lower, entries in term_groups.items():
        if len(entries) == 1:
            # No duplicate
            deduplicated.append(entries[0])
        else:
            # Multiple entries - pick the best one
            scored_entries = [
                (calculate_entry_quality(e), e) for e in entries
            ]
            scored_entries.sort(key=lambda x: x[0], reverse=True)

            best_entry = scored_entries[0][1]
            deduplicated.append(best_entry)

            # Log duplicates
            duplicates_found.append({
                'term': term_lower,
                'count': len(entries),
                'kept': best_entry['term'],
                'kept_score': scored_entries[0][0],
                'removed': [
                    {
                        'term': e['term'],
                        'score': score,
                        'user_friendly': e.get('user_friendly', '')[:50]
                    }
                    for score, e in scored_entries[1:]
                ]
            })

    report = {
        'original_count': len(glossary),
        'deduplicated_count': len(deduplicated),
        'duplicates_removed': len(glossary) - len(deduplicated),
        'duplicate_sets': len(duplicates_found),
        'duplicates_details': duplicates_found
    }

    return deduplicated, report

def main():
    """Main execution."""
    base_dir = Path(__file__).parent

    # Load original glossary
    glossary_path = base_dir / 'neuroscience-glossary-expanded.json'

    print("Loading glossary...")
    with open(glossary_path, 'r', encoding='utf-8') as f:
        glossary = json.load(f)

    print(f"✓ Loaded {len(glossary)} terms")
    print()

    # Deduplicate
    print("Deduplicating glossary...")
    deduplicated, report = deduplicate_glossary(glossary)
    print(f"✓ Removed {report['duplicates_removed']} duplicate entries")
    print(f"✓ Final glossary size: {report['deduplicated_count']} terms")
    print()

    # Show duplicates found
    if report['duplicate_sets'] > 0:
        print(f"Duplicates Found ({report['duplicate_sets']} sets):")
        print("-" * 80)
        for dup in report['duplicates_details']:
            print(f"\nTerm: '{dup['term']}'")
            print(f"  Count: {dup['count']}")
            print(f"  Kept: '{dup['kept']}' (score: {dup['kept_score']:.2f})")
            for removed in dup['removed']:
                print(f"  Removed: '{removed['term']}' (score: {removed['score']:.2f})")
                print(f"           Definition: {removed['user_friendly'][:50]}...")
        print()

    # Save deduplicated glossary
    output_path = base_dir / 'neuroscience-glossary-deduplicated.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(deduplicated, f, indent=2, ensure_ascii=False)

    print(f"✓ Saved deduplicated glossary to: {output_path}")

    # Save report
    report_path = base_dir / 'deduplication-report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"✓ Saved deduplication report to: {report_path}")
    print()

    print("=" * 80)
    print("DEDUPLICATION COMPLETE")
    print("=" * 80)
    print(f"Original entries: {report['original_count']}")
    print(f"Deduplicated entries: {report['deduplicated_count']}")
    print(f"Duplicates removed: {report['duplicates_removed']}")
    print()

    return 0

if __name__ == '__main__':
    sys.exit(main())
