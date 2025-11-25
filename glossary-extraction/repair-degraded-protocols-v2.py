#!/usr/bin/env python3
"""
Repair Degraded Protocols - Version 2
Fix protocols where reading level INCREASED after tooltip injection.

NEW STRATEGY:
Instead of simplifying tooltips, REMOVE them entirely and revert to original text.
This ensures we don't make things worse.
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Supabase client
from supabase import create_client
from dotenv import load_dotenv

# Import validation framework
import importlib.util
validation_spec = importlib.util.spec_from_file_location(
    "validation_framework",
    Path(__file__).parent / "validation-framework.py"
)
validation_framework = importlib.util.module_from_spec(validation_spec)
validation_spec.loader.exec_module(validation_framework)

calculate_flesch_kincaid_grade = validation_framework.calculate_flesch_kincaid_grade
analyze_text_complexity = validation_framework.analyze_text_complexity

# Load environment variables
load_dotenv()

# Initialize Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: Missing Supabase credentials in .env file")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def repair_protocol_revert(protocol: Dict[str, Any], diagnosis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Repair a degraded protocol by reverting to original text.

    This is the safest approach - if tooltips made it worse, remove them.
    """
    protocol_id = protocol['id']
    original_text = protocol.get('chunk_text', '')
    simplified_text = protocol.get('simplified_text', '')

    reading_level_before = diagnosis['reading_level_before']
    reading_level_after = diagnosis['reading_level_after']

    # Revert to original text
    repaired_text = original_text

    # Recalculate reading level (should match reading_level_before)
    word_count, sentence_count, syllable_count = analyze_text_complexity(repaired_text)
    reading_level_repaired = calculate_flesch_kincaid_grade(repaired_text, word_count, sentence_count, syllable_count)

    improvement = reading_level_after - reading_level_repaired

    return {
        'protocol_id': protocol_id,
        'chunk_summary': diagnosis['chunk_summary'],
        'reading_level_before': reading_level_before,
        'reading_level_after': reading_level_after,
        'reading_level_repaired': reading_level_repaired,
        'degradation': diagnosis['degradation'],
        'repair_improvement': improvement,
        'net_change': reading_level_repaired - reading_level_before,
        'strategy_applied': 'revert_to_original',
        'should_update': True,  # Always update to revert degraded protocols
        'repaired_text': repaired_text
    }

def main():
    """Main execution."""
    print("=" * 80)
    print("REPAIR DEGRADED PROTOCOLS - VERSION 2 (REVERT STRATEGY)")
    print("=" * 80)
    print()

    # Load degraded protocols analysis
    analysis_path = Path(__file__).parent / 'degraded-protocols-analysis.json'
    if not analysis_path.exists():
        print("ERROR: degraded-protocols-analysis.json not found")
        print("Run identify-degraded-protocols.py first")
        sys.exit(1)

    print("Loading degraded protocols analysis...")
    with open(analysis_path, 'r', encoding='utf-8') as f:
        analysis = json.load(f)

    degraded_protocols = analysis['degraded_protocols']
    print(f"✓ Loaded analysis for {len(degraded_protocols)} degraded protocols")
    print()

    # Fetch protocols from database
    print("Fetching protocols from database...")
    protocol_ids = [d['protocol_id'] for d in degraded_protocols]

    protocols_map = {}
    for protocol_id in protocol_ids:
        response = supabase.table('mio_knowledge_chunks').select('*').eq('id', protocol_id).execute()
        if response.data:
            protocols_map[protocol_id] = response.data[0]

    print(f"✓ Retrieved {len(protocols_map)} protocols from database")
    print()

    # Repair each protocol by reverting to original
    print("Reverting degraded protocols to original text...")
    repair_results = []
    protocols_updated = 0

    for i, diagnosis in enumerate(degraded_protocols, 1):
        protocol_id = diagnosis['protocol_id']
        protocol = protocols_map.get(protocol_id)

        if not protocol:
            print(f"  ⚠️  Protocol {protocol_id} not found in database")
            continue

        print(f"  Reverting protocol {i}/{len(degraded_protocols)}: {diagnosis['chunk_summary'][:50]}...")

        repair_result = repair_protocol_revert(protocol, diagnosis)
        repair_results.append(repair_result)

        if repair_result['should_update']:
            # Update database - revert to original text
            update_data = {
                'simplified_text': repair_result['repaired_text'],
                'reading_level_after': repair_result['reading_level_repaired'],
                'glossary_terms': '{}',  # Clear glossary terms since we removed tooltips
                'language_variant': 'original'  # Mark as reverted
            }

            try:
                supabase.table('mio_knowledge_chunks').update(update_data).eq('id', protocol_id).execute()
                protocols_updated += 1
                print(f"    → Reverted (improvement: {repair_result['repair_improvement']:.2f} grades)")
            except Exception as e:
                print(f"    ✗ Error updating: {str(e)}")

    print()
    print(f"✓ Repair process complete")
    print(f"  Protocols reverted: {protocols_updated}")
    print()

    # Calculate summary statistics
    avg_improvement = sum(r['repair_improvement'] for r in repair_results) / len(repair_results) if repair_results else 0

    summary = {
        'total_degraded': len(degraded_protocols),
        'protocols_updated': protocols_updated,
        'avg_repair_improvement': avg_improvement,
        'strategy': 'revert_to_original'
    }

    # Save repair report
    report = {
        'repair_date': datetime.now().isoformat(),
        'summary': summary,
        'repair_results': repair_results
    }

    report_path = Path(__file__).parent / 'protocol-repair-report-v2.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"✓ Saved repair report to: {report_path}")
    print()

    # Print summary
    print("=" * 80)
    print("REPAIR SUMMARY")
    print("=" * 80)
    print(f"Total Degraded Protocols: {summary['total_degraded']}")
    print(f"Protocols Successfully Reverted: {summary['protocols_updated']}")
    print(f"Average Repair Improvement: {summary['avg_repair_improvement']:.2f} grade levels")
    print()

    # Show top 10 improvements
    print("Top 10 Improvements:")
    print("-" * 80)
    sorted_results = sorted(repair_results, key=lambda r: r['repair_improvement'], reverse=True)
    for i, r in enumerate(sorted_results[:10], 1):
        print(f"\n{i}. {r['chunk_summary'][:60]}")
        print(f"   Before tooltips: {r['reading_level_before']:.2f}")
        print(f"   After tooltips: {r['reading_level_after']:.2f} (degradation: +{r['degradation']:.2f})")
        print(f"   After revert: {r['reading_level_repaired']:.2f} (improvement: +{r['repair_improvement']:.2f})")

    print()
    print("=" * 80)
    print("REPAIR COMPLETE")
    print("=" * 80)
    print()
    print("NOTE: These protocols have been reverted to their original text.")
    print("They can be re-processed with improved glossary definitions in the future.")
    print()

    return 0

if __name__ == '__main__':
    sys.exit(main())
