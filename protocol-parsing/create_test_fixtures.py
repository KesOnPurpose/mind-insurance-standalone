#!/usr/bin/env python3
"""
MIO Protocol Parser - Day 1: Test Fixture Creation
Creates small test files with 5 protocols from each source for parser validation
"""

import re
from pathlib import Path

STAGING_DIR = Path(__file__).parent / 'staging'
FIXTURES_DIR = Path(__file__).parent / 'fixtures'

def extract_daily_deductible_fixtures():
    """Extract first 5 practices from Daily Deductible"""
    source = STAGING_DIR / 'daily-deductible-normalized.md'
    dest = FIXTURES_DIR / 'test-daily-deductible.md'

    with open(source, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by practice headers - note the escaped period: #### **1\. Practice Name**
    # The pattern matches: #### **<number>\. <title>** through the next #### or end
    practice_pattern = r'(####\s+\*\*\d+\\.+.+?\*\*.*?)(?=####\s+\*\*\d+\\.|---|\Z)'
    practices = re.findall(practice_pattern, content, re.DOTALL)

    if not practices:
        # Try alternative pattern without escaped period
        practice_pattern = r'(####\s+\*\*\d+\.\s+.+?\*\*.*?)(?=####\s+\*\*\d+\.|---|\Z)'
        practices = re.findall(practice_pattern, content, re.DOTALL)

    # Take first 5 practices
    test_content = "## Daily Deductible Library - Test Fixtures (First 5 Practices)\n\n"
    test_content += '### **Traditional Foundation Practices**\n\n'
    test_content += ''.join(practices[:5])

    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(test_content)

    return len(practices[:5])

def extract_neural_rewiring_fixtures():
    """Extract first 5 protocols from Neural Rewiring (1 pattern with all 4 temperaments + 1 emergency)"""
    source = STAGING_DIR / 'neural-rewiring-normalized.txt'
    dest = FIXTURES_DIR / 'test-neural-rewiring.txt'

    with open(source, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find COMPARISON CATASTROPHE section (8.) through its 4 temperament variants
    start = content.find('## 8. COMPARISON CATASTROPHE PROTOCOLS')

    if start == -1:
        print("   ⚠️  Could not find COMPARISON CATASTROPHE section")
        return 0

    # Find the end of this pattern (before ## 9.)
    end = content.find('## 9.', start)
    if end == -1:
        end = len(content)

    pattern_content = content[start:end]

    # Extract: Pattern header + All 4 temperaments (Warrior, Sage, Connector, Builder)
    test_content = "# Neural Rewiring Protocols - Test Fixtures\n\n"
    test_content += pattern_content.strip() + "\n"

    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(test_content)

    # Count temperament sections
    temperament_count = len(re.findall(r'### COMPARISON CATASTROPHE \+ \w+ TEMPERAMENT', pattern_content))

    return temperament_count  # Should be 4 (one per temperament)

def extract_research_protocol_fixtures():
    """Extract first 5 protocol sections from Research Protocols"""
    source = STAGING_DIR / 'research-protocols-combined.md'
    dest = FIXTURES_DIR / 'test-research-protocols.md'

    with open(source, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by SOURCE FILE markers
    sections = content.split('# SOURCE FILE:')

    # Take first 5 non-empty sections (skip intro)
    test_sections = []
    count = 0

    for section in sections[1:]:  # Skip first empty split
        if count >= 5:
            break

        # Add back the marker
        test_sections.append('# SOURCE FILE:' + section)
        count += 1

    test_content = "# Research Protocols - Test Fixtures (First 5 Knowledge Base Files)\n\n"
    test_content += '\n'.join(test_sections)

    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(test_content)

    return count

def main():
    """Create test fixtures from all sources"""
    print("=" * 60)
    print("Creating Test Fixtures - 5 Protocols Per Source")
    print("=" * 60)
    print()

    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

    # Daily Deductible
    print("📚 Extracting Daily Deductible fixtures...")
    dd_count = extract_daily_deductible_fixtures()
    print(f"   ✓ Created test file with {dd_count} practices")
    print()

    # Neural Rewiring
    print("🧠 Extracting Neural Rewiring fixtures...")
    nr_count = extract_neural_rewiring_fixtures()
    print(f"   ✓ Created test file with 1 pattern × {nr_count} temperaments = {nr_count} protocols")
    print()

    # Research Protocols
    print("🔬 Extracting Research Protocol fixtures...")
    rp_count = extract_research_protocol_fixtures()
    print(f"   ✓ Created test file with {rp_count} knowledge base sections")
    print()

    # Summary
    print("=" * 60)
    print("TEST FIXTURES CREATED")
    print("=" * 60)
    print()

    print("Fixture files:")
    for file in sorted(FIXTURES_DIR.glob('*.md')) + sorted(FIXTURES_DIR.glob('*.txt')):
        size = file.stat().st_size
        lines = sum(1 for _ in open(file, 'r', encoding='utf-8'))
        print(f"   ✓ {file.name}")
        print(f"      Size: {size:,} bytes | Lines: {lines:,}")
    print()

    print("✅ Fixtures ready for parser testing (Days 2-4)")
    print()

if __name__ == '__main__':
    main()
