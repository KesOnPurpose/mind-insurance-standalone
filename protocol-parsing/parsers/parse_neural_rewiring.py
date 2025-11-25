#!/usr/bin/env python3
"""
Neural Rewiring Parser for MIO Protocol Parsing System
Extracts Pattern × Temperament matrix protocols (40 total: 10 patterns × 4 temperaments)
Week 2 Day 2-4 of 6-week MIO transformation
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Any

# Pattern to Temperament lookup
TEMPERAMENTS = ["WARRIOR", "SAGE", "CONNECTOR", "BUILDER"]

# Pattern name normalization
PATTERN_NAMES = {
    "COMPARISON CATASTROPHE": "comparison_catastrophe",
    "MOTIVATION COLLAPSE": "motivation_collapse",
    "PERFORMANCE LIABILITY": "performance_liability"
}


def normalize_pattern_name(name: str) -> str:
    """Convert pattern name to snake_case identifier"""
    return PATTERN_NAMES.get(name, name.lower().replace(" ", "_").replace("-", "_"))


def extract_time_and_frequency(practice_title: str) -> tuple:
    """
    Extract time commitment and frequency from practice title
    Example: "Personal Best Tracking (10 minutes, daily)" -> (10, 10, "daily")
    Example: "Blinder Walk Practice (20 minutes, 3x/week)" -> (20, 20, "3x/week")
    Example: "Social Media Detox Protocol (varies, ongoing)" -> (None, None, "ongoing")
    """
    # Pattern: (NUMBER minutes, FREQUENCY) or (varies, FREQUENCY)
    time_pattern = r'\((\d+|varies)\s*(?:minutes?)?,?\s*([^)]+)\)'
    match = re.search(time_pattern, practice_title, re.IGNORECASE)

    if match:
        time_str = match.group(1)
        frequency = match.group(2).strip()

        if time_str.lower() == "varies":
            return None, None, frequency
        else:
            time_min = int(time_str)
            return time_min, time_min, frequency

    return None, None, "as_needed"


def determine_difficulty(time_min: int, frequency: str, is_emergency: bool) -> str:
    """
    Determine difficulty level based on time commitment and frequency
    """
    if is_emergency:
        return "beginner"

    if time_min is None:
        return "intermediate"

    # Daily + high time = advanced
    if "daily" in frequency.lower() and time_min >= 20:
        return "advanced"
    elif "daily" in frequency.lower():
        return "intermediate"
    elif "weekly" in frequency.lower() or "week" in frequency.lower():
        return "intermediate"
    elif time_min <= 10:
        return "beginner"
    else:
        return "intermediate"


def parse_practice_section(text: str, pattern_name: str, temperament: str, protocol_title: str, chunk_number: int) -> Dict[str, Any]:
    """
    Parse a single practice section into structured data
    """
    # Extract practice number and title
    practice_match = re.match(r'####\s*Practice\s+(\d+):\s*(.+)', text.split('\n')[0])
    emergency_match = re.match(r'####\s*Emergency Protocol:\s*(.+)', text.split('\n')[0])

    is_emergency = False
    practice_number = None
    practice_name = ""

    if practice_match:
        practice_number = int(practice_match.group(1))
        practice_name = practice_match.group(2).strip()
    elif emergency_match:
        is_emergency = True
        practice_name = emergency_match.group(1).strip()

    # Extract time and frequency
    time_min, time_max, frequency = extract_time_and_frequency(practice_name)

    # Extract "Why This Rewires the Pattern"
    why_pattern = r'\*\*Why This Rewires the Pattern\*\*:\s*(.+?)(?=\*\*How to Do It\*\*:|$)'
    why_match = re.search(why_pattern, text, re.DOTALL)
    why_rewires = why_match.group(1).strip() if why_match else ""

    # Extract "How to Do It" steps
    how_pattern = r'\*\*How to Do It\*\*:\s*(.+?)(?=\*\*(?:Expected Outcome|What to Do)\*\*:|$)'
    how_match = re.search(how_pattern, text, re.DOTALL)
    how_to_do = how_match.group(1).strip() if how_match else ""

    # For emergency protocols, extract "What to Do" instead
    if is_emergency:
        what_pattern = r'\*\*What to Do\*\*:\s*(.+?)(?=---|$)'
        what_match = re.search(what_pattern, text, re.DOTALL)
        how_to_do = what_match.group(1).strip() if what_match else ""

    # Extract "Expected Outcome"
    outcome_pattern = r'\*\*Expected Outcome\*\*:\s*(.+?)(?=---|$)'
    outcome_match = re.search(outcome_pattern, text, re.DOTALL)
    expected_outcome = outcome_match.group(1).strip() if outcome_match else ""

    # Extract "When to Use" for emergency protocols
    when_pattern = r'\*\*When to Use\*\*:\s*(.+?)(?=\*\*What to Do\*\*:|$)'
    when_match = re.search(when_pattern, text, re.DOTALL)
    when_to_use = when_match.group(1).strip() if when_match else ""

    # Determine difficulty
    difficulty = determine_difficulty(time_min, frequency, is_emergency)

    # Create chunk summary
    clean_practice_name = re.sub(r'\s*\([^)]+\)', '', practice_name)
    chunk_summary = f"{clean_practice_name} - {temperament.capitalize()}"

    return {
        "source_file": "neural_rewiring_protocols.txt",
        "file_number": 1,
        "chunk_number": chunk_number,
        "chunk_text": text.strip(),
        "chunk_summary": chunk_summary,
        "category": "neural-rewiring",
        "applicable_patterns": [normalize_pattern_name(pattern_name)],
        "temperament_match": [temperament.lower()],
        "time_commitment_min": time_min,
        "time_commitment_max": time_max,
        "difficulty_level": difficulty,
        "is_emergency_protocol": is_emergency,
        "practice_frequency": frequency,
        "pattern_name": normalize_pattern_name(pattern_name),
        "temperament_name": temperament.lower(),
        "protocol_title": protocol_title.strip('*"'),
        "practice_number": practice_number,
        "practice_name": clean_practice_name,
        "why_rewires": why_rewires,
        "how_to_do": how_to_do,
        "expected_outcome": expected_outcome,
        "emergency_trigger": when_to_use if is_emergency else None
    }


def parse_temperament_section(text: str, pattern_name: str, temperament: str, start_chunk: int) -> List[Dict[str, Any]]:
    """
    Parse all practices for a single pattern × temperament combination
    """
    protocols = []

    # Extract protocol title
    title_match = re.search(r'\*\*Your Protocol:\s*([^*]+)\*\*', text)
    protocol_title = title_match.group(1).strip() if title_match else f"{pattern_name} - {temperament}"

    # Split by practice sections (both regular and emergency)
    practice_sections = re.split(r'(?=####\s+(?:Practice\s+\d+:|Emergency Protocol:))', text)

    chunk_number = start_chunk
    for section in practice_sections:
        section = section.strip()
        if not section or not section.startswith('####'):
            continue

        try:
            protocol = parse_practice_section(section, pattern_name, temperament, protocol_title, chunk_number)
            protocols.append(protocol)
            chunk_number += 1
        except Exception as e:
            print(f"Warning: Failed to parse practice in {pattern_name} + {temperament}: {e}")
            continue

    return protocols


def parse_pattern_section(text: str, pattern_name: str, start_chunk: int) -> List[Dict[str, Any]]:
    """
    Parse all temperament sections for a single pattern
    """
    all_protocols = []

    # Split by temperament headers
    temperament_pattern = r'###\s+' + re.escape(pattern_name) + r'\s+\+\s+(WARRIOR|SAGE|CONNECTOR|BUILDER)\s+TEMPERAMENT'

    # Find all temperament sections
    temp_sections = re.split(f'(?={temperament_pattern})', text)

    chunk_number = start_chunk
    for section in temp_sections:
        section = section.strip()
        if not section:
            continue

        # Extract temperament from this section
        temp_match = re.search(temperament_pattern, section)
        if not temp_match:
            continue

        temperament = temp_match.group(1)

        # Parse this temperament's practices
        protocols = parse_temperament_section(section, pattern_name, temperament, chunk_number)
        all_protocols.extend(protocols)
        chunk_number += len(protocols)

    return all_protocols


def parse_neural_rewiring_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse the complete neural rewiring protocols file
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    all_protocols = []

    # Find all pattern sections (## N. PATTERN NAME PROTOCOLS)
    pattern_sections = re.split(r'(?=^## \d+\. [A-Z\s]+PROTOCOLS)', content, flags=re.MULTILINE)

    chunk_number = 1
    for section in pattern_sections:
        section = section.strip()
        if not section:
            continue

        # Extract pattern name
        pattern_match = re.match(r'## \d+\.\s+([A-Z\s]+)\s+PROTOCOLS', section)
        if not pattern_match:
            continue

        pattern_name = pattern_match.group(1).strip()

        # Parse all temperaments for this pattern
        protocols = parse_pattern_section(section, pattern_name, chunk_number)
        all_protocols.extend(protocols)
        chunk_number += len(protocols)

    return all_protocols


def main():
    """
    Main execution: Parse test fixture first, then full staging file
    """
    base_path = Path("/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/protocol-parsing")

    test_file = base_path / "fixtures/test-neural-rewiring.txt"
    staging_file = base_path / "staging/neural-rewiring-normalized.txt"
    output_file = base_path / "output/neural-rewiring-parsed.json"

    # Ensure output directory exists
    output_file.parent.mkdir(parents=True, exist_ok=True)

    print("=" * 80)
    print("NEURAL REWIRING PARSER - MIO Protocol Parsing System")
    print("=" * 80)

    # Test on fixture first
    print("\n[1/2] Testing on fixture file...")
    print(f"Input: {test_file}")

    if test_file.exists():
        test_protocols = parse_neural_rewiring_file(str(test_file))
        print(f"✓ Parsed {len(test_protocols)} protocols from test fixture")
        print(f"  - Emergency protocols: {sum(1 for p in test_protocols if p['is_emergency_protocol'])}")
        print(f"  - Regular practices: {sum(1 for p in test_protocols if not p['is_emergency_protocol'])}")

        # Show sample
        if test_protocols:
            print("\n📋 Sample Protocol (first entry):")
            sample = test_protocols[0]
            print(json.dumps({
                "chunk_summary": sample["chunk_summary"],
                "pattern_name": sample["pattern_name"],
                "temperament_name": sample["temperament_name"],
                "protocol_title": sample["protocol_title"],
                "practice_name": sample["practice_name"],
                "time_commitment_min": sample["time_commitment_min"],
                "practice_frequency": sample["practice_frequency"],
                "difficulty_level": sample["difficulty_level"],
                "is_emergency_protocol": sample["is_emergency_protocol"]
            }, indent=2))
    else:
        print(f"✗ Test file not found: {test_file}")
        return

    # Run on full staging file
    print("\n[2/2] Processing full staging file...")
    print(f"Input: {staging_file}")

    if staging_file.exists():
        all_protocols = parse_neural_rewiring_file(str(staging_file))
        print(f"✓ Parsed {len(all_protocols)} protocols from staging file")
        print(f"  - Emergency protocols: {sum(1 for p in all_protocols if p['is_emergency_protocol'])}")
        print(f"  - Regular practices: {sum(1 for p in all_protocols if not p['is_emergency_protocol'])}")

        # Pattern × Temperament breakdown
        patterns = {}
        for protocol in all_protocols:
            pattern = protocol['pattern_name']
            if pattern not in patterns:
                patterns[pattern] = {'total': 0, 'temperaments': {}}
            patterns[pattern]['total'] += 1

            temp = protocol['temperament_name']
            if temp not in patterns[pattern]['temperaments']:
                patterns[pattern]['temperaments'][temp] = 0
            patterns[pattern]['temperaments'][temp] += 1

        print(f"\n📊 Pattern × Temperament Matrix:")
        for pattern, data in patterns.items():
            print(f"  {pattern}: {data['total']} protocols")
            for temp, count in data['temperaments'].items():
                print(f"    - {temp}: {count}")

        # Write output
        print(f"\n💾 Writing output to: {output_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_protocols, f, indent=2, ensure_ascii=False)

        print(f"✓ Successfully wrote {len(all_protocols)} protocols to JSON")

        # Show emergency protocol breakdown
        emergency_protocols = [p for p in all_protocols if p['is_emergency_protocol']]
        if emergency_protocols:
            print(f"\n🚨 Emergency Protocols ({len(emergency_protocols)} total):")
            for ep in emergency_protocols:
                print(f"  - {ep['chunk_summary']}")

        print("\n" + "=" * 80)
        print("✅ NEURAL REWIRING PARSER COMPLETE")
        print("=" * 80)

        return all_protocols
    else:
        print(f"✗ Staging file not found: {staging_file}")
        return None


if __name__ == "__main__":
    main()
