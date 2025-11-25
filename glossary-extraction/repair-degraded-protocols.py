#!/usr/bin/env python3
"""
Repair Degraded Protocols
Fix protocols where reading level INCREASED after tooltip injection.

Strategy:
1. Load degraded protocols analysis
2. For each protocol, apply appropriate repair strategy:
   - simplify_language: Replace complex tooltips with simpler definitions
   - shorten_definitions: Truncate long tooltip definitions
   - remove_tooltips: Remove tooltips from high-density sentences
   - manual_review: Flag for manual intervention
3. Recalculate reading level after repair
4. Only update if reading level improves
5. Generate repair report
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime
import re

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

def simplify_tooltip_definition(definition: str, max_reading_level: float = 7.0) -> str:
    """
    Simplify a tooltip definition to target reading level.

    Strategies:
    - Remove complex words (3+ syllables)
    - Shorten sentences
    - Use simpler vocabulary
    """
    # For now, use a simple truncation strategy
    # In production, this could use an LLM to rewrite

    # Split into sentences
    sentences = re.split(r'[.!?]+', definition)

    # Keep only first sentence if it's simple enough
    first_sentence = sentences[0].strip() if sentences else definition

    # Truncate to max 12 words
    words = first_sentence.split()
    if len(words) > 12:
        first_sentence = ' '.join(words[:12]) + '...'

    return first_sentence

def extract_and_simplify_tooltips(text: str, simplify: bool = True, max_reading_level: float = 7.0) -> str:
    """
    Extract tooltips from text and optionally simplify them.

    Format: {{term||definition}}
    """
    tooltip_pattern = r'\{\{([^|]+)\|\|([^}]+)\}\}'

    def replace_tooltip(match):
        term = match.group(1).strip()
        definition = match.group(2).strip()

        if simplify:
            # Simplify the definition
            simplified_def = simplify_tooltip_definition(definition, max_reading_level)
            return f"{{{{{term}||{simplified_def}}}}}"
        else:
            return match.group(0)

    return re.sub(tooltip_pattern, replace_tooltip, text)

def remove_complex_tooltips(text: str, reading_level_threshold: float = 8.0) -> Tuple[str, int]:
    """
    Remove tooltips with definitions above reading level threshold.

    Returns: (cleaned_text, tooltips_removed)
    """
    tooltip_pattern = r'\{\{([^|]+)\|\|([^}]+)\}\}'
    tooltips_removed = 0

    def should_remove_tooltip(match):
        nonlocal tooltips_removed
        term = match.group(1).strip()
        definition = match.group(2).strip()

        # Calculate definition reading level
        word_count, sentence_count, syllable_count = analyze_text_complexity(definition)
        reading_level = calculate_flesch_kincaid_grade(definition, word_count, sentence_count, syllable_count)

        if reading_level > reading_level_threshold:
            tooltips_removed += 1
            return term  # Replace with just the term
        else:
            return match.group(0)  # Keep the tooltip

    cleaned_text = re.sub(tooltip_pattern, should_remove_tooltip, text)
    return cleaned_text, tooltips_removed

def repair_protocol(protocol: Dict[str, Any], diagnosis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Repair a single degraded protocol.

    Returns: Repair result
    """
    protocol_id = protocol['id']
    original_text = protocol.get('chunk_text', '')
    simplified_text = protocol.get('simplified_text', '')

    repair_strategies = diagnosis['repair_strategies']

    # Try repair strategies in order
    repaired_text = simplified_text
    strategy_applied = None
    tooltips_modified = 0

    if 'simplify_language' in repair_strategies:
        # Simplify complex tooltip definitions
        repaired_text = extract_and_simplify_tooltips(simplified_text, simplify=True, max_reading_level=7.0)
        strategy_applied = 'simplify_language'

    elif 'remove_tooltips' in repair_strategies:
        # Remove complex tooltips entirely
        repaired_text, tooltips_modified = remove_complex_tooltips(simplified_text, reading_level_threshold=8.0)
        strategy_applied = 'remove_tooltips'

    elif 'manual_review' in repair_strategies:
        # Flag for manual review - no automatic repair
        strategy_applied = 'manual_review'
        repaired_text = simplified_text  # No change

    # Calculate new reading level
    word_count, sentence_count, syllable_count = analyze_text_complexity(repaired_text)
    reading_level_repaired = calculate_flesch_kincaid_grade(repaired_text, word_count, sentence_count, syllable_count)

    reading_level_before = diagnosis['reading_level_before']
    reading_level_after = diagnosis['reading_level_after']

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
        'strategy_applied': strategy_applied,
        'tooltips_modified': tooltips_modified,
        'should_update': improvement > 0.1 and reading_level_repaired < reading_level_after,
        'repaired_text': repaired_text
    }

def main():
    """Main execution."""
    print("=" * 80)
    print("REPAIR DEGRADED PROTOCOLS")
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

    # Fetch protocols one by one or in batches
    protocols_map = {}
    for protocol_id in protocol_ids:
        response = supabase.table('mio_knowledge_chunks').select('*').eq('id', protocol_id).execute()
        if response.data:
            protocols_map[protocol_id] = response.data[0]

    print(f"✓ Retrieved {len(protocols_map)} protocols from database")
    print()

    # Repair each protocol
    print("Repairing protocols...")
    repair_results = []
    protocols_updated = 0
    protocols_flagged_manual = 0

    for i, diagnosis in enumerate(degraded_protocols, 1):
        protocol_id = diagnosis['protocol_id']
        protocol = protocols_map.get(protocol_id)

        if not protocol:
            print(f"  ⚠️  Protocol {protocol_id} not found in database")
            continue

        print(f"  Repairing protocol {i}/{len(degraded_protocols)}: {diagnosis['chunk_summary'][:50]}...")

        repair_result = repair_protocol(protocol, diagnosis)
        repair_results.append(repair_result)

        if repair_result['strategy_applied'] == 'manual_review':
            protocols_flagged_manual += 1
            print(f"    → Flagged for manual review")
        elif repair_result['should_update']:
            # Update database
            update_data = {
                'simplified_text': repair_result['repaired_text'],
                'reading_level_after': repair_result['reading_level_repaired'],
                'language_variant': 'simplified'
            }

            try:
                supabase.table('mio_knowledge_chunks').update(update_data).eq('id', protocol_id).execute()
                protocols_updated += 1
                print(f"    → Updated (improvement: {repair_result['repair_improvement']:.2f} grades)")
            except Exception as e:
                print(f"    ✗ Error updating: {str(e)}")
        else:
            print(f"    → No update (improvement too small: {repair_result['repair_improvement']:.2f} grades)")

    print()
    print(f"✓ Repair process complete")
    print(f"  Protocols updated: {protocols_updated}")
    print(f"  Protocols flagged for manual review: {protocols_flagged_manual}")
    print()

    # Calculate summary statistics
    successful_repairs = [r for r in repair_results if r['should_update']]
    avg_improvement = sum(r['repair_improvement'] for r in successful_repairs) / len(successful_repairs) if successful_repairs else 0

    summary = {
        'total_degraded': len(degraded_protocols),
        'protocols_updated': protocols_updated,
        'protocols_flagged_manual': protocols_flagged_manual,
        'avg_repair_improvement': avg_improvement,
        'strategy_counts': {
            'simplify_language': sum(1 for r in repair_results if r['strategy_applied'] == 'simplify_language'),
            'remove_tooltips': sum(1 for r in repair_results if r['strategy_applied'] == 'remove_tooltips'),
            'manual_review': protocols_flagged_manual
        }
    }

    # Save repair report
    report = {
        'repair_date': datetime.now().isoformat(),
        'summary': summary,
        'repair_results': repair_results
    }

    report_path = Path(__file__).parent / 'protocol-repair-report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"✓ Saved repair report to: {report_path}")
    print()

    # Print summary
    print("=" * 80)
    print("REPAIR SUMMARY")
    print("=" * 80)
    print(f"Total Degraded Protocols: {summary['total_degraded']}")
    print(f"Protocols Successfully Repaired: {summary['protocols_updated']}")
    print(f"Protocols Flagged for Manual Review: {summary['protocols_flagged_manual']}")
    print(f"Average Repair Improvement: {summary['avg_repair_improvement']:.2f} grade levels")
    print()
    print("Repair Strategies Applied:")
    for strategy, count in summary['strategy_counts'].items():
        print(f"  {strategy.replace('_', ' ').title()}: {count} protocols")
    print()

    # Show manual review protocols
    if protocols_flagged_manual > 0:
        print("Protocols Requiring Manual Review:")
        print("-" * 80)
        manual_review = [r for r in repair_results if r['strategy_applied'] == 'manual_review']
        for i, r in enumerate(manual_review, 1):
            print(f"\n{i}. {r['chunk_summary'][:60]}")
            print(f"   Degradation: +{r['degradation']:.2f} grades ({r['reading_level_before']:.2f} → {r['reading_level_after']:.2f})")
            print(f"   Protocol ID: {r['protocol_id']}")
        print()

    print("=" * 80)
    print("REPAIR COMPLETE")
    print("=" * 80)

    return 0

if __name__ == '__main__':
    sys.exit(main())
