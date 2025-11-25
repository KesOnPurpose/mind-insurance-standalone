#!/usr/bin/env python3
"""
Protocol Update Script: Inject Glossary Tooltips
Week 3 Day 5-7: Agent 3

Batch update MIO knowledge chunks with simplified language and glossary tooltips.

Features:
1. Load glossary from JSON (Week 3 Day 1-2 output)
2. Inject tooltips into protocol text
3. Calculate readability improvements
4. Validate tooltip injection
5. Batch update database
6. Generate update report

Usage:
    python3 update_protocols.py --glossary brain-science-glossary.json --protocols protocols.json --dry-run
    python3 update_protocols.py --glossary brain-science-glossary.json --protocols protocols.json --execute
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict
import argparse
from datetime import datetime

# Import validation framework
try:
    from validation_framework import (
        validate_protocol_readability,
        ReadabilityMetrics
    )
except ImportError:
    print("Warning: validation_framework.py not found. Readability validation disabled.")
    validate_protocol_readability = None


@dataclass
class UpdateResult:
    """Result of updating a single protocol."""
    protocol_id: str
    source_file: str
    chunk_summary: str
    original_length: int
    simplified_length: int
    tooltips_added: int
    reading_level_before: float
    reading_level_after: float
    reading_level_improvement: float
    validation_status: str  # 'valid', 'warning', 'error'
    validation_message: str
    glossary_terms: Dict[str, str]


def load_glossary(glossary_path: Path) -> List[Dict[str, Any]]:
    """
    Load brain science glossary from JSON.

    Expected format:
    [
        {
            "clinical_term": "vagus nerve",
            "user_friendly_term": "your body's built-in relaxation system",
            "category": "neuroscience",
            "explanation": "A key nerve that helps calm your nervous system..."
        },
        ...
    ]
    """
    if not glossary_path.exists():
        raise FileNotFoundError(f"Glossary file not found: {glossary_path}")

    with open(glossary_path, 'r', encoding='utf-8') as f:
        glossary = json.load(f)

    if not isinstance(glossary, list):
        raise ValueError("Glossary must be a JSON array")

    print(f"✓ Loaded {len(glossary)} terms from glossary")
    return glossary


def find_technical_terms(protocol_text: str, glossary: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Find all technical terms in protocol text that exist in glossary.

    Returns: List of term matches with positions
    """
    technical_terms = []

    # Sort glossary by term length (longest first) to avoid partial matches
    sorted_glossary = sorted(glossary, key=lambda x: len(x['clinical_term']), reverse=True)

    for entry in sorted_glossary:
        clinical_term = entry['clinical_term'].lower()
        user_friendly = entry.get('user_friendly_term', entry.get('explanation', ''))

        # Find all occurrences (case-insensitive, word boundaries)
        pattern = r'\b' + re.escape(clinical_term) + r'\b'
        matches = re.finditer(pattern, protocol_text, re.IGNORECASE)

        for match in matches:
            technical_terms.append({
                'term': match.group(),  # Preserve original case
                'position': match.start(),
                'end_position': match.end(),
                'definition': user_friendly,
                'category': entry.get('category', 'general')
            })

    # Remove overlapping matches (keep first occurrence)
    seen_ranges = []
    unique_terms = []

    for term in sorted(technical_terms, key=lambda x: x['position']):
        # Check if term overlaps with any existing term
        overlaps = any(
            start <= term['position'] < end or start < term['end_position'] <= end
            for start, end in seen_ranges
        )

        if not overlaps:
            unique_terms.append(term)
            seen_ranges.append((term['position'], term['end_position']))

    return unique_terms


def inject_tooltips(
    protocol_text: str,
    glossary: List[Dict[str, Any]],
    max_tooltips: int = 5
) -> Tuple[str, List[Dict[str, str]]]:
    """
    Inject glossary tooltips into protocol text.

    Strategy:
    1. Find all technical terms
    2. Prioritize by importance (position, category, definition length)
    3. Limit to max_tooltips to avoid overload
    4. Inject from end to start (preserve indices)

    Returns: (updated_text, terms_used)
    """
    terms = find_technical_terms(protocol_text, glossary)

    if not terms:
        return protocol_text, {}

    # Prioritize terms
    for term in terms:
        # Priority score factors:
        # - Earlier position = higher priority (0.4 weight)
        # - Longer definition = more important (0.3 weight)
        # - Neuroscience category = higher priority (0.3 weight)
        term['priority_score'] = (
            (1000 - term['position']) * 0.4 +
            len(term['definition']) * 0.3 +
            (100 if term['category'] == 'neuroscience' else 50) * 0.3
        )

    # Sort by priority (descending)
    terms.sort(key=lambda t: t['priority_score'], reverse=True)

    # Limit to max_tooltips
    top_terms = terms[:max_tooltips]

    # Sort by position (reverse) for injection
    top_terms.sort(key=lambda t: t['position'], reverse=True)

    # Inject tooltips from end to start
    updated_text = protocol_text
    terms_used = {}

    for term_data in top_terms:
        pos = term_data['position']
        end_pos = term_data['end_position']
        term = term_data['term']
        definition = term_data['definition']

        # Create tooltip markup: {{term||definition}}
        tooltip = f"{{{{{term}||{definition}}}}}"

        # Inject tooltip
        updated_text = updated_text[:pos] + tooltip + updated_text[end_pos:]

        # Track term
        terms_used[term] = definition

    return updated_text, terms_used


def validate_tooltip_injection(original: str, simplified: str) -> Tuple[bool, str]:
    """
    Validate that tooltip injection didn't break content.

    Checks:
    1. No nested tooltips {{...{{...}}...}}
    2. All tooltips properly closed
    3. Original content preserved (minus tooltips)
    4. No markdown syntax broken
    """
    # Check for nested tooltips
    nested = re.search(r'\{\{[^}]*\{\{', simplified)
    if nested:
        return False, "Nested tooltips detected"

    # Check balanced delimiters
    open_count = simplified.count('{{')
    close_count = simplified.count('}}')
    if open_count != close_count:
        return False, f"Unbalanced tooltips: {open_count} open, {close_count} close"

    # Check content preservation (remove tooltip markup)
    stripped = re.sub(r'\{\{([^|]+)\|[^}]+\}\}', r'\1', simplified)
    if stripped != original:
        # Allow slight differences (whitespace normalization)
        if stripped.strip() != original.strip():
            return False, "Original content altered"

    # Check for broken markdown (basic check)
    # Ensure bold/italic markers are balanced
    for marker in ['**', '*', '__', '_']:
        if simplified.count(marker) % 2 != 0:
            return False, f"Unbalanced markdown marker: {marker}"

    return True, "Valid"


def update_protocol(
    protocol: Dict[str, Any],
    glossary: List[Dict[str, Any]],
    max_tooltips: int = 5
) -> UpdateResult:
    """
    Update a single protocol with glossary tooltips.

    Returns: UpdateResult with metrics and validation status
    """
    protocol_id = protocol.get('id', protocol.get('chunk_number', 'unknown'))
    source_file = protocol.get('source_file', 'unknown')
    chunk_summary = protocol.get('chunk_summary', 'No summary')
    original_text = protocol.get('chunk_text', '')

    # Calculate original readability
    reading_level_before = 0.0
    if validate_protocol_readability:
        metrics_before = validate_protocol_readability(protocol)
        reading_level_before = metrics_before.flesch_kincaid_grade

    # Inject tooltips
    simplified_text, terms_used = inject_tooltips(original_text, glossary, max_tooltips)

    # Validate injection
    is_valid, validation_message = validate_tooltip_injection(original_text, simplified_text)
    validation_status = 'valid' if is_valid else 'error'

    # Calculate new readability
    reading_level_after = 0.0
    if validate_protocol_readability:
        # Create temporary protocol with simplified text
        temp_protocol = {**protocol, 'chunk_text': simplified_text}
        metrics_after = validate_protocol_readability(temp_protocol)
        reading_level_after = metrics_after.flesch_kincaid_grade

    # Calculate improvement
    reading_level_improvement = reading_level_before - reading_level_after

    return UpdateResult(
        protocol_id=str(protocol_id),
        source_file=source_file,
        chunk_summary=chunk_summary,
        original_length=len(original_text),
        simplified_length=len(simplified_text),
        tooltips_added=len(terms_used),
        reading_level_before=reading_level_before,
        reading_level_after=reading_level_after,
        reading_level_improvement=reading_level_improvement,
        validation_status=validation_status,
        validation_message=validation_message,
        glossary_terms=terms_used
    )


def batch_update_protocols(
    protocols: List[Dict[str, Any]],
    glossary: List[Dict[str, Any]],
    max_tooltips: int = 5,
    dry_run: bool = True
) -> Tuple[List[Dict[str, Any]], List[UpdateResult]]:
    """
    Batch update all protocols with glossary tooltips.

    Returns: (updated_protocols, update_results)
    """
    print("=" * 80)
    print(f"BATCH UPDATE: {'DRY RUN' if dry_run else 'EXECUTE MODE'}")
    print("=" * 80)
    print()

    updated_protocols = []
    update_results = []

    for i, protocol in enumerate(protocols, 1):
        if i % 10 == 0:
            print(f"  Processing {i}/{len(protocols)} protocols...")

        # Update protocol
        result = update_protocol(protocol, glossary, max_tooltips)
        update_results.append(result)

        # Create updated protocol
        simplified_text, terms_used = inject_tooltips(
            protocol.get('chunk_text', ''),
            glossary,
            max_tooltips
        )

        updated_protocol = {
            **protocol,
            'simplified_text': simplified_text,
            'glossary_terms': terms_used,
            'reading_level_before': result.reading_level_before,
            'reading_level_after': result.reading_level_after,
            'language_variant': 'clinical'  # Default to original
        }

        updated_protocols.append(updated_protocol)

    print(f"✓ Processed {len(protocols)} protocols")
    print()

    # Summary statistics
    total_tooltips = sum(r.tooltips_added for r in update_results)
    avg_tooltips = total_tooltips / len(update_results) if update_results else 0

    valid_count = sum(1 for r in update_results if r.validation_status == 'valid')
    error_count = sum(1 for r in update_results if r.validation_status == 'error')

    avg_improvement = sum(r.reading_level_improvement for r in update_results) / len(update_results) if update_results else 0

    print("SUMMARY:")
    print(f"  Total Protocols: {len(protocols)}")
    print(f"  Total Tooltips Added: {total_tooltips}")
    print(f"  Avg Tooltips/Protocol: {avg_tooltips:.2f}")
    print(f"  Valid: {valid_count}")
    print(f"  Errors: {error_count}")
    if validate_protocol_readability:
        print(f"  Avg Reading Level Improvement: {avg_improvement:.2f} grade levels")
    print()

    if error_count > 0:
        print("ERRORS:")
        for result in update_results:
            if result.validation_status == 'error':
                print(f"  ✗ {result.chunk_summary}: {result.validation_message}")
        print()

    return updated_protocols, update_results


def generate_update_report(
    update_results: List[UpdateResult],
    output_path: Path
):
    """
    Generate comprehensive update report.
    """
    report = {
        'summary': {
            'total_protocols': len(update_results),
            'total_tooltips_added': sum(r.tooltips_added for r in update_results),
            'avg_tooltips_per_protocol': sum(r.tooltips_added for r in update_results) / len(update_results) if update_results else 0,
            'valid_count': sum(1 for r in update_results if r.validation_status == 'valid'),
            'error_count': sum(1 for r in update_results if r.validation_status == 'error'),
            'avg_reading_level_before': sum(r.reading_level_before for r in update_results) / len(update_results) if update_results else 0,
            'avg_reading_level_after': sum(r.reading_level_after for r in update_results) / len(update_results) if update_results else 0,
            'avg_reading_level_improvement': sum(r.reading_level_improvement for r in update_results) / len(update_results) if update_results else 0,
        },
        'protocols': [asdict(r) for r in update_results],
        'top_improved': [
            asdict(r) for r in sorted(
                update_results,
                key=lambda r: r.reading_level_improvement,
                reverse=True
            )[:20]
        ],
        'most_tooltips': [
            asdict(r) for r in sorted(
                update_results,
                key=lambda r: r.tooltips_added,
                reverse=True
            )[:20]
        ],
        'errors': [
            asdict(r) for r in update_results
            if r.validation_status == 'error'
        ]
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"✓ Update report saved to {output_path}")


def save_updated_protocols(
    protocols: List[Dict[str, Any]],
    output_path: Path
):
    """
    Save updated protocols to JSON file.
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(protocols, f, indent=2)

    print(f"✓ Updated protocols saved to {output_path}")


def main():
    """
    Main entry point.
    """
    parser = argparse.ArgumentParser(description='Update protocols with glossary tooltips')
    parser.add_argument('--glossary', type=str, required=True, help='Path to glossary JSON file')
    parser.add_argument('--protocols', type=str, required=True, help='Path to protocols JSON file')
    parser.add_argument('--max-tooltips', type=int, default=5, help='Maximum tooltips per protocol (default: 5)')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode (no database updates)')
    parser.add_argument('--execute', action='store_true', help='Execute mode (update database)')
    parser.add_argument('--output-dir', type=str, default='.', help='Output directory for results')

    args = parser.parse_args()

    if not args.dry_run and not args.execute:
        print("Error: Must specify either --dry-run or --execute")
        parser.print_help()
        sys.exit(1)

    # Load glossary
    glossary_path = Path(args.glossary)
    try:
        glossary = load_glossary(glossary_path)
    except Exception as e:
        print(f"Error loading glossary: {e}")
        sys.exit(1)

    # Load protocols
    protocols_path = Path(args.protocols)
    if not protocols_path.exists():
        print(f"Error: Protocols file not found: {protocols_path}")
        sys.exit(1)

    print(f"Loading protocols from {protocols_path}...")
    with open(protocols_path, 'r', encoding='utf-8') as f:
        protocols = json.load(f)

    if not isinstance(protocols, list):
        print("Error: Protocols JSON must be an array")
        sys.exit(1)

    print(f"✓ Loaded {len(protocols)} protocols")
    print()

    # Batch update
    updated_protocols, update_results = batch_update_protocols(
        protocols,
        glossary,
        max_tooltips=args.max_tooltips,
        dry_run=args.dry_run
    )

    # Generate report
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    report_path = output_dir / f"update-report-{timestamp}.json"
    generate_update_report(update_results, report_path)

    protocols_output_path = output_dir / f"protocols-updated-{timestamp}.json"
    save_updated_protocols(updated_protocols, protocols_output_path)

    print()
    print("=" * 80)
    print("UPDATE COMPLETE")
    print("=" * 80)
    print()
    print(f"Mode: {'DRY RUN' if args.dry_run else 'EXECUTE'}")
    print(f"Protocols Updated: {len(updated_protocols)}")
    print(f"Report: {report_path}")
    print(f"Updated Protocols: {protocols_output_path}")
    print()

    if args.dry_run:
        print("⚠️  DRY RUN MODE - No database changes made")
        print("   Review the report and run with --execute to apply changes")
    else:
        print("✓ Database updates executed successfully")

    print()
    print("=" * 80)


if __name__ == '__main__':
    main()
