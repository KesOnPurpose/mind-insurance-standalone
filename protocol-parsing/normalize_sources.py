#!/usr/bin/env python3
"""
MIO Protocol Parser - Day 1: File Normalization
Prepares source files for parsing by normalizing encoding, whitespace, and structure
"""

import os
import re
import shutil
from pathlib import Path
from typing import List, Tuple

# Source file paths
SOURCES = {
    'daily_deductible': '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/UFB/📚 Daily Deductible Library_ Complete Practice Collection.md',
    'neural_rewiring': '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/30 Day Challenge/Identity Collision Avatar Assessment /neural_rewiring_protocols.txt',
    'research_protocols': [
        '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/30 Day Challenge/MIO-System-PRODUCTION/01-Knowledge-Base/mio-kb-01-core-framework.md',
        '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/30 Day Challenge/MIO-System-PRODUCTION/01-Knowledge-Base/mio-kb-02-avatar-index.md',
        '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/30 Day Challenge/MIO-System-PRODUCTION/01-Knowledge-Base/mio-kb-03-protocol-library.md',
        '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/30 Day Challenge/MIO-System-PRODUCTION/01-Knowledge-Base/mio-kb-04-communication-frameworks.md',
        '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/30 Day Challenge/MIO-System-PRODUCTION/01-Knowledge-Base/mio-kb-05-emergency-tools.md',
        '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/30 Day Challenge/MIO-System-PRODUCTION/01-Knowledge-Base/mio-kb-06-data-coaching.md',
        '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/30 Day Challenge/MIO-System-PRODUCTION/01-Knowledge-Base/mio-kb-07-neural-rewiring-protocols.md',
        '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Purpose Waze Company/Context/30 Day Challenge/MIO-System-PRODUCTION/01-Knowledge-Base/mio-kb-08-forensic-to-protocol-integration.md'
    ]
}

STAGING_DIR = Path(__file__).parent / 'staging'
BACKUP_DIR = Path(__file__).parent / 'backup'

def normalize_text(text: str) -> str:
    """
    Normalize text content:
    - Convert to UTF-8
    - Replace smart quotes with regular quotes
    - Normalize whitespace (tabs → spaces, multiple spaces → single)
    - Ensure consistent line endings (Unix LF)
    - Remove BOM if present
    """
    # Remove BOM
    if text.startswith('\ufeff'):
        text = text[1:]

    # Smart quotes → regular quotes
    replacements = {
        '\u2018': "'",  # Left single quote
        '\u2019': "'",  # Right single quote
        '\u201c': '"',  # Left double quote
        '\u201d': '"',  # Right double quote
        '\u2013': '-',  # En dash
        '\u2014': '--', # Em dash
        '\u2026': '...',# Ellipsis
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    # Normalize whitespace
    text = text.replace('\t', '    ')  # Tabs → 4 spaces
    text = re.sub(r' +', ' ', text)    # Multiple spaces → single

    # Normalize line endings to Unix LF
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # Remove trailing whitespace from lines
    lines = text.split('\n')
    lines = [line.rstrip() for line in lines]
    text = '\n'.join(lines)

    # Ensure file ends with single newline
    text = text.rstrip() + '\n'

    return text

def process_file(source_path: str, dest_path: Path, backup: bool = True) -> Tuple[int, int]:
    """
    Process a single source file:
    1. Read with UTF-8 encoding
    2. Normalize content
    3. Create backup
    4. Write normalized version

    Returns: (original_size, normalized_size)
    """
    source_path = Path(source_path)

    if not source_path.exists():
        print(f"⚠️  Source file not found: {source_path}")
        return (0, 0)

    # Read original
    try:
        with open(source_path, 'r', encoding='utf-8', errors='replace') as f:
            original_text = f.read()
    except Exception as e:
        print(f"❌ Error reading {source_path.name}: {e}")
        return (0, 0)

    original_size = len(original_text)

    # Normalize
    normalized_text = normalize_text(original_text)
    normalized_size = len(normalized_text)

    # Create backup
    if backup:
        backup_path = BACKUP_DIR / source_path.name
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_path, backup_path)

    # Write normalized version
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(normalized_text)

    return (original_size, normalized_size)

def main():
    """Main normalization workflow"""
    print("=" * 60)
    print("MIO Protocol Parser - Day 1: File Normalization")
    print("=" * 60)
    print()

    # Create directories
    STAGING_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    stats = {
        'files_processed': 0,
        'total_original': 0,
        'total_normalized': 0,
        'errors': []
    }

    # Process Daily Deductible
    print("📚 Processing Daily Deductible Library...")
    orig, norm = process_file(
        SOURCES['daily_deductible'],
        STAGING_DIR / 'daily-deductible-normalized.md'
    )
    if orig > 0:
        stats['files_processed'] += 1
        stats['total_original'] += orig
        stats['total_normalized'] += norm
        print(f"   ✓ Normalized: {orig:,} → {norm:,} bytes")
    print()

    # Process Neural Rewiring
    print("🧠 Processing Neural Rewiring Protocols...")
    orig, norm = process_file(
        SOURCES['neural_rewiring'],
        STAGING_DIR / 'neural-rewiring-normalized.txt'
    )
    if orig > 0:
        stats['files_processed'] += 1
        stats['total_original'] += orig
        stats['total_normalized'] += norm
        print(f"   ✓ Normalized: {orig:,} → {norm:,} bytes")
    print()

    # Process Research Protocols (combine into single file)
    print("🔬 Processing Research Protocols (8 files)...")
    combined_content = []
    research_orig = 0
    research_norm = 0

    for i, source_path in enumerate(SOURCES['research_protocols'], 1):
        source_path = Path(source_path)
        if not source_path.exists():
            print(f"   ⚠️  File {i}/8 not found: {source_path.name}")
            continue

        try:
            with open(source_path, 'r', encoding='utf-8', errors='replace') as f:
                text = f.read()

            research_orig += len(text)
            normalized = normalize_text(text)
            research_norm += len(normalized)

            # Add file header
            combined_content.append(f"# SOURCE FILE: {source_path.name}\n")
            combined_content.append(f"# ORIGINAL PATH: {source_path}\n\n")
            combined_content.append(normalized)
            combined_content.append("\n\n" + "=" * 80 + "\n\n")

            print(f"   ✓ {i}/8: {source_path.name} ({len(normalized):,} bytes)")

        except Exception as e:
            print(f"   ❌ {i}/8: {source_path.name} - Error: {e}")
            stats['errors'].append(f"{source_path.name}: {e}")

    # Write combined research protocols
    if combined_content:
        combined_text = ''.join(combined_content)
        dest_path = STAGING_DIR / 'research-protocols-combined.md'
        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(combined_text)

        stats['files_processed'] += len(SOURCES['research_protocols'])
        stats['total_original'] += research_orig
        stats['total_normalized'] += research_norm
        print(f"   ✓ Combined: {len(combined_content)} sections → {len(combined_text):,} bytes")
    print()

    # Summary
    print("=" * 60)
    print("NORMALIZATION COMPLETE")
    print("=" * 60)
    print(f"Files processed: {stats['files_processed']}")
    print(f"Original size:   {stats['total_original']:,} bytes")
    print(f"Normalized size: {stats['total_normalized']:,} bytes")
    print(f"Size change:     {stats['total_normalized'] - stats['total_original']:+,} bytes")
    print()

    if stats['errors']:
        print(f"⚠️  Errors: {len(stats['errors'])}")
        for error in stats['errors']:
            print(f"   - {error}")
        print()

    # Output file listing
    print("Normalized files:")
    for file in sorted(STAGING_DIR.glob('*.md')) + sorted(STAGING_DIR.glob('*.txt')):
        size = file.stat().st_size
        print(f"   ✓ {file.name} ({size:,} bytes)")
    print()

    print("✅ Ready for parser development (Day 2-4)")
    print()

if __name__ == '__main__':
    main()
