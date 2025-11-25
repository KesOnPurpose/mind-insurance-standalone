#!/usr/bin/env python3
"""
Identify and Analyze Degraded Protocols
Find protocols where reading level INCREASED after tooltip injection.

Strategy:
1. Load Week 4 reprocessing results
2. Filter protocols where reading_level_after > reading_level_before
3. Fetch actual protocol text from Supabase
4. Analyze degradation causes:
   - Tooltip definitions too long
   - Tooltip definitions too complex
   - Too many tooltips in single sentence
5. Generate detailed report with repair recommendations
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any
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

def extract_tooltips_from_text(text: str) -> List[Dict[str, str]]:
    """
    Extract tooltip markup from text.

    Format: {{term||definition}}

    Returns: List of {term, definition, length, complexity}
    """
    tooltip_pattern = r'\{\{([^|]+)\|\|([^}]+)\}\}'
    matches = re.findall(tooltip_pattern, text)

    tooltips = []
    for term, definition in matches:
        # Calculate definition complexity
        word_count, sentence_count, syllable_count = analyze_text_complexity(definition)
        reading_level = calculate_flesch_kincaid_grade(definition, word_count, sentence_count, syllable_count)

        tooltips.append({
            'term': term.strip(),
            'definition': definition.strip(),
            'length': len(definition),
            'word_count': word_count,
            'reading_level': reading_level
        })

    return tooltips

def analyze_sentence_tooltip_density(text: str) -> Dict[str, Any]:
    """
    Analyze how many tooltips appear in each sentence.

    High density = readability problems.
    """
    sentences = re.split(r'[.!?]+', text)
    tooltip_pattern = r'\{\{[^}]+\}\}'

    sentence_analysis = []
    max_tooltips_per_sentence = 0

    for sentence in sentences:
        if not sentence.strip():
            continue

        tooltip_count = len(re.findall(tooltip_pattern, sentence))
        if tooltip_count > 0:
            sentence_analysis.append({
                'sentence': sentence.strip()[:100] + '...',
                'tooltip_count': tooltip_count,
                'sentence_length': len(sentence.split())
            })

        max_tooltips_per_sentence = max(max_tooltips_per_sentence, tooltip_count)

    return {
        'max_tooltips_per_sentence': max_tooltips_per_sentence,
        'avg_tooltips_per_sentence': len([s for s in sentence_analysis if s['tooltip_count'] > 0]) / max(len(sentences), 1),
        'high_density_sentences': [s for s in sentence_analysis if s['tooltip_count'] >= 3]
    }

def diagnose_degradation(protocol: Dict[str, Any]) -> Dict[str, Any]:
    """
    Diagnose why a protocol's reading level degraded.

    Returns: Diagnosis with repair recommendations
    """
    original_text = protocol.get('chunk_text', '')
    simplified_text = protocol.get('simplified_text', '')

    # Extract tooltips
    tooltips = extract_tooltips_from_text(simplified_text)

    # Analyze tooltip complexity
    long_tooltips = [t for t in tooltips if t['word_count'] > 15]
    complex_tooltips = [t for t in tooltips if t['reading_level'] > 8.0]

    # Analyze sentence density
    density_analysis = analyze_sentence_tooltip_density(simplified_text)

    # Determine primary cause
    causes = []
    repair_strategies = []

    if len(long_tooltips) > 0:
        causes.append(f"{len(long_tooltips)} tooltips exceed 15 words")
        repair_strategies.append("shorten_definitions")

    if len(complex_tooltips) > 0:
        causes.append(f"{len(complex_tooltips)} tooltips exceed Grade 8 reading level")
        repair_strategies.append("simplify_language")

    if density_analysis['max_tooltips_per_sentence'] >= 3:
        causes.append(f"High tooltip density ({density_analysis['max_tooltips_per_sentence']} in one sentence)")
        repair_strategies.append("remove_tooltips")

    if not causes:
        causes.append("Unknown cause - requires manual review")
        repair_strategies.append("manual_review")

    return {
        'protocol_id': protocol['id'],
        'chunk_summary': protocol.get('chunk_summary', 'No summary'),
        'reading_level_before': protocol.get('reading_level_before', 0),
        'reading_level_after': protocol.get('reading_level_after', 0),
        'degradation': protocol.get('reading_level_after', 0) - protocol.get('reading_level_before', 0),
        'tooltip_count': len(tooltips),
        'long_tooltips': len(long_tooltips),
        'complex_tooltips': len(complex_tooltips),
        'max_tooltips_per_sentence': density_analysis['max_tooltips_per_sentence'],
        'primary_causes': causes,
        'repair_strategies': repair_strategies,
        'tooltip_details': tooltips[:3],  # Sample of first 3 tooltips
        'high_density_sentences': density_analysis['high_density_sentences'][:2]  # Sample
    }

def main():
    """Main execution."""
    print("=" * 80)
    print("IDENTIFY AND ANALYZE DEGRADED PROTOCOLS")
    print("=" * 80)
    print()

    # Fetch all protocols from database
    print("Fetching all protocols from database...")
    response = supabase.table('mio_knowledge_chunks').select('*').execute()
    all_protocols = response.data
    print(f"✓ Retrieved {len(all_protocols)} protocols")
    print()

    # Filter degraded protocols (reading level increased)
    print("Filtering degraded protocols...")
    degraded_protocols = [
        p for p in all_protocols
        if p.get('reading_level_before') and p.get('reading_level_after')
        and p['reading_level_after'] > p['reading_level_before']
    ]

    print(f"✓ Found {len(degraded_protocols)} degraded protocols")
    print()

    # Sort by degradation amount (worst first)
    degraded_protocols.sort(
        key=lambda p: p['reading_level_after'] - p['reading_level_before'],
        reverse=True
    )

    # Diagnose each protocol
    print("Diagnosing degradation causes...")
    diagnoses = []

    for i, protocol in enumerate(degraded_protocols, 1):
        print(f"  Analyzing protocol {i}/{len(degraded_protocols)}: {protocol.get('chunk_summary', 'No summary')[:50]}...")
        diagnosis = diagnose_degradation(protocol)
        diagnoses.append(diagnosis)

    print(f"✓ Completed diagnosis for {len(diagnoses)} protocols")
    print()

    # Generate summary statistics
    total_long_tooltips = sum(d['long_tooltips'] for d in diagnoses)
    total_complex_tooltips = sum(d['complex_tooltips'] for d in diagnoses)
    high_density_count = sum(1 for d in diagnoses if d['max_tooltips_per_sentence'] >= 3)

    summary = {
        'total_degraded': len(degraded_protocols),
        'avg_degradation': sum(d['degradation'] for d in diagnoses) / len(diagnoses),
        'max_degradation': max(d['degradation'] for d in diagnoses),
        'total_long_tooltips': total_long_tooltips,
        'total_complex_tooltips': total_complex_tooltips,
        'high_density_count': high_density_count,
        'repair_strategy_counts': {
            'shorten_definitions': sum(1 for d in diagnoses if 'shorten_definitions' in d['repair_strategies']),
            'simplify_language': sum(1 for d in diagnoses if 'simplify_language' in d['repair_strategies']),
            'remove_tooltips': sum(1 for d in diagnoses if 'remove_tooltips' in d['repair_strategies']),
            'manual_review': sum(1 for d in diagnoses if 'manual_review' in d['repair_strategies'])
        }
    }

    # Save detailed report
    report = {
        'analysis_date': datetime.now().isoformat(),
        'summary': summary,
        'degraded_protocols': diagnoses
    }

    report_path = Path(__file__).parent / 'degraded-protocols-analysis.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"✓ Saved detailed analysis to: {report_path}")
    print()

    # Print summary
    print("=" * 80)
    print("DEGRADATION ANALYSIS SUMMARY")
    print("=" * 80)
    print(f"Total Degraded Protocols: {summary['total_degraded']}")
    print(f"Average Degradation: {summary['avg_degradation']:.2f} grade levels")
    print(f"Maximum Degradation: {summary['max_degradation']:.2f} grade levels")
    print()
    print("Root Causes:")
    print(f"  Long Tooltips (>15 words): {summary['total_long_tooltips']}")
    print(f"  Complex Tooltips (>Grade 8): {summary['total_complex_tooltips']}")
    print(f"  High Density (3+ per sentence): {summary['high_density_count']}")
    print()
    print("Repair Strategies Needed:")
    for strategy, count in summary['repair_strategy_counts'].items():
        print(f"  {strategy.replace('_', ' ').title()}: {count} protocols")
    print()

    # Show top 10 worst degradations
    print("Top 10 Worst Degradations:")
    print("-" * 80)
    for i, d in enumerate(diagnoses[:10], 1):
        print(f"\n{i}. {d['chunk_summary'][:60]}")
        print(f"   Degradation: +{d['degradation']:.2f} grades ({d['reading_level_before']:.2f} → {d['reading_level_after']:.2f})")
        print(f"   Causes: {', '.join(d['primary_causes'])}")
        print(f"   Strategies: {', '.join(d['repair_strategies'])}")

    print()
    print("=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)

    return 0

if __name__ == '__main__':
    sys.exit(main())
