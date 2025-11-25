#!/usr/bin/env python3
"""
Research Protocol Parser - MIO Protocol Parsing System
Extracts 250+ protocols from 8 KB files with dual framing extraction

Week 2 Day 2-4 of 6-week MIO transformation
"""

import json
import re
from typing import List, Dict, Any, Optional
from pathlib import Path


class ResearchProtocolParser:
    """Parser for extracting research protocols from MIO knowledge base files"""

    # KB file category mappings
    KB_CATEGORIES = {
        'mio-kb-01': 'core-framework',
        'mio-kb-02': 'avatar-index',
        'mio-kb-03': 'protocol-library',
        'mio-kb-04': 'communication-frameworks',
        'mio-kb-05': 'emergency-tools',
        'mio-kb-06': 'data-coaching',
        'mio-kb-07': 'neural-rewiring',
        'mio-kb-08': 'forensic-integration'
    }

    # Pattern keywords for applicable_patterns
    PATTERN_KEYWORDS = {
        'burnout': ['burnout', 'exhaustion', 'depleted', 'depletion'],
        'impostor_syndrome': ['impostor', 'fraud', 'fake', 'imposter'],
        'identity_ceiling': ['ceiling', 'roots', 'origins', 'betrayal'],
        'comparison': ['comparison', 'comparing', 'scrolling', 'highlight reel'],
        'decision_fatigue': ['decision', 'paralysis', 'overwhelm', 'overthinking'],
        'execution_breakdown': ['execution', 'abandoner', 'quit', '90%'],
        'motivation_collapse': ['motivation', 'purpose', 'why', 'meaningless'],
        'relationship_erosion': ['relationship', 'isolation', 'lonely', 'connection'],
        'past_prison': ['past prison', 'roots', 'origins', 'family'],
        'success_sabotage': ['success sabotage', 'self-sabotage', 'breakthrough'],
        'compass_crisis': ['compass crisis', 'validation', 'identity fragmentation'],
        'loyalty_conflict': ['loyalty', 'leaving behind', 'better than us'],
        'origin_story_anchor': ['origin story', 'past defines', 'people like me'],
        'depletion_dedication': ['depletion dedication', 'sacrifice everything', 'rest is weakness'],
        'relationship_sacrifice': ['relationship sacrifice', 'collateral damage', 'isolation at the top'],
        'comparison_collision': ['comparison collision', 'their success', 'everyone winning']
    }

    # Temperament keywords
    TEMPERAMENT_KEYWORDS = {
        'warrior': ['warrior', 'action', 'conquest', 'battle', 'fight', 'intensity', 'hiit'],
        'sage': ['sage', 'wisdom', 'contemplat', 'reflect', 'insight', 'nature walk'],
        'connector': ['connector', 'relationship', 'connection', 'community', 'relational'],
        'builder': ['builder', 'system', 'optimiz', 'data', 'metric', 'structured']
    }

    def __init__(self):
        self.protocols = []

    def extract_file_number(self, filename: str) -> Optional[int]:
        """Extract KB file number from filename"""
        match = re.search(r'mio-kb-(\d+)', filename)
        return int(match.group(1)) if match else None

    def extract_kb_prefix(self, filename: str) -> Optional[str]:
        """Extract KB prefix (e.g., 'mio-kb-01') from filename"""
        match = re.search(r'(mio-kb-\d+)', filename)
        return match.group(1) if match else None

    def infer_patterns(self, text: str) -> List[str]:
        """Infer applicable patterns from protocol text"""
        text_lower = text.lower()
        patterns = []

        for pattern_name, keywords in self.PATTERN_KEYWORDS.items():
            if any(keyword in text_lower for keyword in keywords):
                patterns.append(pattern_name)

        return list(set(patterns))  # Remove duplicates

    def infer_temperaments(self, text: str) -> List[str]:
        """Infer applicable temperaments from protocol text"""
        text_lower = text.lower()
        temperaments = []

        for temp_name, keywords in self.TEMPERAMENT_KEYWORDS.items():
            if any(keyword in text_lower for keyword in keywords):
                temperaments.append(temp_name)

        return list(set(temperaments)) if temperaments else ['all']

    def extract_time_commitment(self, text: str) -> tuple:
        """Extract time commitment range from protocol text"""
        # Look for time patterns like "5-30 minutes" or "10 minutes"
        time_pattern = r'(\d+)(?:-(\d+))?\s*(?:min|minute)'
        matches = re.findall(time_pattern, text.lower())

        if matches:
            times = []
            for match in matches:
                min_time = int(match[0])
                max_time = int(match[1]) if match[1] else min_time
                times.extend([min_time, max_time])

            return (min(times), max(times))

        return (10, 20)  # Default

    def infer_difficulty(self, text: str) -> str:
        """Infer difficulty level from protocol complexity"""
        text_lower = text.lower()

        # Count complexity indicators
        steps = len(re.findall(r'\n\s*\d+\.', text))
        has_protocol = 'protocol:' in text_lower
        has_multiple_options = text.count('option 1:') > 0 or text.count('method 1:') > 0

        if steps >= 5 or has_multiple_options:
            return 'advanced'
        elif steps >= 3 or has_protocol:
            return 'intermediate'
        else:
            return 'beginner'

    def is_emergency_protocol(self, text: str) -> bool:
        """Check if protocol is an emergency intervention"""
        text_lower = text.lower()
        emergency_keywords = ['emergency', 'crisis', '60-second', 'immediate', 'urgent']
        return any(keyword in text_lower for keyword in emergency_keywords)

    def extract_practice_frequency(self, text: str) -> str:
        """Extract recommended practice frequency"""
        text_lower = text.lower()

        if 'daily' in text_lower or 'every day' in text_lower:
            return 'daily'
        elif 'weekly' in text_lower or 'once a week' in text_lower:
            return 'weekly'
        elif 'as needed' in text_lower or 'when needed' in text_lower:
            return 'as-needed'
        else:
            return 'daily'  # Default

    def extract_dual_framing(self, text: str) -> tuple:
        """Extract clinical and user-facing framing if present"""
        # Look for dual framing patterns
        clinical_match = re.search(r'\*\*Internal\s*\(Clinical\)\*\*:\s*["\']([^"\']+)["\']', text)
        user_match = re.search(r'\*\*External\s*\(User-facing\)\*\*:\s*["\']([^"\']+)["\']', text)

        clinical = clinical_match.group(1) if clinical_match else None
        user = user_match.group(1) if user_match else None

        return (clinical, user)

    def extract_pattern_names(self, header: str) -> List[str]:
        """Extract pattern/sub-pattern names from === headers"""
        # Look for === PATTERN: NAME === or === NAME ===
        pattern_match = re.search(r'===\s*(?:PATTERN:\s*)?([^=]+)===', header)
        if pattern_match:
            name = pattern_match.group(1).strip()
            return [name.lower().replace(' ', '_')]
        return []

    def create_summary(self, text: str, pattern_names: List[str]) -> str:
        """Create a concise summary of the protocol"""
        if pattern_names:
            pattern_display = ' - '.join(p.replace('_', ' ').title() for p in pattern_names[:2])
        else:
            # Extract first sentence or first 100 chars
            first_line = text.split('\n')[0]
            pattern_display = first_line[:100]

        return pattern_display

    def parse_file_chunk(self, chunk_text: str, source_file: str, file_number: int,
                        chunk_number: int) -> Dict[str, Any]:
        """Parse a single file chunk into a protocol entry"""

        # Extract dual framing
        clinical_framing, user_framing = self.extract_dual_framing(chunk_text)

        # Extract pattern names from headers
        pattern_names = []
        for line in chunk_text.split('\n'):
            if '===' in line:
                pattern_names.extend(self.extract_pattern_names(line))

        # Infer metadata
        applicable_patterns = self.infer_patterns(chunk_text) or pattern_names
        temperament_match = self.infer_temperaments(chunk_text)
        time_min, time_max = self.extract_time_commitment(chunk_text)
        difficulty = self.infer_difficulty(chunk_text)
        is_emergency = self.is_emergency_protocol(chunk_text)
        frequency = self.extract_practice_frequency(chunk_text)

        # Get KB category
        kb_prefix = self.extract_kb_prefix(source_file)
        kb_category = self.KB_CATEGORIES.get(kb_prefix, 'unknown')

        # Determine category based on KB file
        if 'emergency' in kb_category or is_emergency:
            category = 'emergency-protocol'
        elif 'protocol-library' in kb_category or 'practice' in chunk_text.lower():
            category = 'research-protocol'
        elif 'avatar' in kb_category:
            category = 'avatar-definition'
        elif 'communication' in kb_category:
            category = 'communication-framework'
        else:
            category = 'research-protocol'

        # Create summary
        summary = self.create_summary(chunk_text, pattern_names or applicable_patterns)

        protocol = {
            'source_file': source_file,
            'file_number': file_number,
            'chunk_number': chunk_number,
            'chunk_text': chunk_text.strip(),
            'chunk_summary': summary,
            'category': category,
            'applicable_patterns': applicable_patterns[:5],  # Limit to 5 most relevant
            'temperament_match': temperament_match,
            'time_commitment_min': time_min,
            'time_commitment_max': time_max,
            'difficulty_level': difficulty,
            'is_emergency_protocol': is_emergency,
            'practice_frequency': frequency,
            'clinical_framing': clinical_framing,
            'user_framing': user_framing,
            'kb_file_category': kb_category
        }

        return protocol

    def parse_file(self, content: str) -> List[Dict[str, Any]]:
        """Parse entire file content split by SOURCE FILE markers"""

        # Split by file delimiter
        file_sections = re.split(r'\n={80,}\n', content)

        protocols = []

        for section in file_sections:
            if not section.strip():
                continue

            # Extract source file metadata
            source_match = re.search(r'# SOURCE FILE:\s*(.+)', section)
            path_match = re.search(r'# ORIGINAL PATH:\s*(.+)', section)

            if not source_match:
                continue

            source_file = source_match.group(1).strip()
            file_number = self.extract_file_number(source_file)

            if file_number is None:
                continue

            # Split section by practice/protocol markers
            # Look for PRACTICE X: or TOOL X: or AVATAR X: or === headers
            chunks = []
            current_chunk = []
            chunk_number = 0

            for line in section.split('\n'):
                # Check for new chunk markers
                is_new_chunk = (
                    re.match(r'^PRACTICE\s+\d+:', line) or
                    re.match(r'^TOOL\s+\d+:', line) or
                    re.match(r'^AVATAR\s+\d+:', line) or
                    re.match(r'^EMERGENCY TOOL\s+\d+:', line) or
                    (re.match(r'^===\s+[A-Z]', line) and len(current_chunk) > 10)
                )

                if is_new_chunk and current_chunk:
                    # Save previous chunk
                    chunk_text = '\n'.join(current_chunk)
                    if len(chunk_text.strip()) > 50:  # Minimum chunk size
                        chunk_number += 1
                        protocol = self.parse_file_chunk(
                            chunk_text,
                            source_file,
                            file_number,
                            chunk_number
                        )
                        protocols.append(protocol)
                    current_chunk = [line]
                else:
                    current_chunk.append(line)

            # Don't forget the last chunk
            if current_chunk:
                chunk_text = '\n'.join(current_chunk)
                if len(chunk_text.strip()) > 50:
                    chunk_number += 1
                    protocol = self.parse_file_chunk(
                        chunk_text,
                        source_file,
                        file_number,
                        chunk_number
                    )
                    protocols.append(protocol)

        return protocols

    def parse_and_save(self, input_file: Path, output_file: Path) -> Dict[str, Any]:
        """Parse input file and save results to JSON"""

        print(f"Reading input file: {input_file}")
        content = input_file.read_text(encoding='utf-8')

        print("Parsing protocols...")
        protocols = self.parse_file(content)

        print(f"Extracted {len(protocols)} protocols")

        # Generate statistics
        stats = self.generate_statistics(protocols)

        # Save to JSON
        output_data = {
            'metadata': {
                'source_file': str(input_file),
                'total_protocols': len(protocols),
                'kb_files_processed': len(set(p['source_file'] for p in protocols)),
                'statistics': stats
            },
            'protocols': protocols
        }

        print(f"Writing output to: {output_file}")
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(json.dumps(output_data, indent=2), encoding='utf-8')

        return stats

    def generate_statistics(self, protocols: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate statistics about parsed protocols"""

        stats = {
            'total_protocols': len(protocols),
            'by_kb_file': {},
            'by_category': {},
            'by_difficulty': {},
            'by_temperament': {},
            'emergency_protocols': 0,
            'with_dual_framing': 0,
            'avg_time_min': 0,
            'avg_time_max': 0
        }

        total_time_min = 0
        total_time_max = 0

        for protocol in protocols:
            # Count by KB file
            kb_cat = protocol['kb_file_category']
            stats['by_kb_file'][kb_cat] = stats['by_kb_file'].get(kb_cat, 0) + 1

            # Count by category
            cat = protocol['category']
            stats['by_category'][cat] = stats['by_category'].get(cat, 0) + 1

            # Count by difficulty
            diff = protocol['difficulty_level']
            stats['by_difficulty'][diff] = stats['by_difficulty'].get(diff, 0) + 1

            # Count by temperament
            for temp in protocol['temperament_match']:
                stats['by_temperament'][temp] = stats['by_temperament'].get(temp, 0) + 1

            # Emergency protocols
            if protocol['is_emergency_protocol']:
                stats['emergency_protocols'] += 1

            # Dual framing
            if protocol['clinical_framing'] or protocol['user_framing']:
                stats['with_dual_framing'] += 1

            # Time
            total_time_min += protocol['time_commitment_min']
            total_time_max += protocol['time_commitment_max']

        if protocols:
            stats['avg_time_min'] = round(total_time_min / len(protocols), 1)
            stats['avg_time_max'] = round(total_time_max / len(protocols), 1)

        return stats


def main():
    """Main execution function"""

    base_path = Path("/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/protocol-parsing")

    # Test file (first 5 KB files)
    test_input = base_path / "fixtures" / "test-research-protocols.md"
    test_output = base_path / "output" / "research-protocols-test-parsed.json"

    # Full file (all 8 KB files)
    full_input = base_path / "staging" / "research-protocols-combined.md"
    full_output = base_path / "output" / "research-protocols-parsed.json"

    parser = ResearchProtocolParser()

    # Parse test file first
    print("\n" + "="*80)
    print("PARSING TEST FILE (First 5 KB Files)")
    print("="*80 + "\n")

    test_stats = parser.parse_and_save(test_input, test_output)

    print("\n" + "="*80)
    print("TEST FILE STATISTICS")
    print("="*80)
    print(json.dumps(test_stats, indent=2))

    # Parse full file
    print("\n" + "="*80)
    print("PARSING FULL FILE (All 8 KB Files)")
    print("="*80 + "\n")

    full_stats = parser.parse_and_save(full_input, full_output)

    print("\n" + "="*80)
    print("FULL FILE STATISTICS")
    print("="*80)
    print(json.dumps(full_stats, indent=2))

    # Show sample protocol
    print("\n" + "="*80)
    print("SAMPLE PARSED PROTOCOL")
    print("="*80)

    sample_output = json.loads(full_output.read_text())
    if sample_output['protocols']:
        # Find a protocol with interesting data
        for protocol in sample_output['protocols']:
            if protocol['applicable_patterns'] and len(protocol['chunk_text']) > 200:
                print(json.dumps(protocol, indent=2))
                break

    print("\n" + "="*80)
    print("PARSING COMPLETE")
    print("="*80)
    print(f"\nTest results: {test_output}")
    print(f"Full results: {full_output}")
    print(f"\nTotal protocols extracted: {full_stats['total_protocols']}")
    print(f"KB files processed: {len(full_stats['by_kb_file'])}")


if __name__ == "__main__":
    main()
