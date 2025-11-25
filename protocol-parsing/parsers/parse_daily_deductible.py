#!/usr/bin/env python3
"""
Daily Deductible Parser - MIO Protocol Parsing System
Week 2 Day 2-4 of 6-week MIO transformation

Purpose: Extract 45 Daily Deductible practices into JSON matching mio_knowledge_chunks schema
Input: Normalized markdown file with practice structure
Output: JSON array ready for database import
"""

import re
import json
from typing import Dict, List, Optional, Tuple
from pathlib import Path


class DailyDeductibleParser:
    """Parser for Daily Deductible Library practices"""

    # Category mapping from section headers
    CATEGORY_MAP = {
        "Traditional Foundation Practices": "traditional-foundation",
        "Faith-Based Practices": "faith-based",
        "Hybrid Practices": "hybrid-practices",
        "Monastic Practices": "monastic-practices",
        "Philosophical Practices": "philosophical-practices",
        "Neurological Practices": "neurological-practices",
        "Integration Practices": "integration-practices"
    }

    # Pattern inference rules
    PATTERN_RULES = {
        "traditional-foundation": ["past_prison", "success_sabotage", "compass_crisis", "identity_collision"],
        "faith-based": ["past_prison", "compass_crisis"],
        "hybrid-practices": ["past_prison", "compass_crisis", "success_sabotage"],
        "monastic-practices": ["past_prison", "compass_crisis"],
        "philosophical-practices": ["compass_crisis", "identity_collision"],
        "neurological-practices": ["success_sabotage", "identity_collision"],
        "integration-practices": ["past_prison", "success_sabotage", "compass_crisis", "identity_collision"]
    }

    # Temperament inference keywords
    TEMPERAMENT_KEYWORDS = {
        "sage": ["prayer", "meditation", "journal", "contemplate", "reflect", "wisdom", "learning", "reading", "writing"],
        "warrior": ["movement", "workout", "exercise", "action", "strength", "push", "discipline", "prostration"],
        "connector": ["worship", "community", "social", "blessing", "service", "connection"],
        "creator": ["visualization", "create", "imagine", "design", "vision"]
    }

    def __init__(self):
        self.current_category = None
        self.practices = []

    def parse_time(self, time_str: str) -> Tuple[Optional[int], Optional[int]]:
        """
        Parse time string to extract min/max minutes
        Examples: "5-30 minutes", "10 minutes", "varies", "Throughout day"
        """
        if not time_str or "varies" in time_str.lower() or "throughout" in time_str.lower():
            return None, None

        # Look for range: "5-30 minutes" or "10-20 minutes"
        range_match = re.search(r'(\d+)\s*-\s*(\d+)\s*min', time_str, re.IGNORECASE)
        if range_match:
            return int(range_match.group(1)), int(range_match.group(2))

        # Look for single value: "10 minutes"
        single_match = re.search(r'(\d+)\s*min', time_str, re.IGNORECASE)
        if single_match:
            val = int(single_match.group(1))
            return val, val

        # Look for hour-based: "1-4 hours" or "1 hour"
        hour_range_match = re.search(r'(\d+)\s*-\s*(\d+)\s*hour', time_str, re.IGNORECASE)
        if hour_range_match:
            return int(hour_range_match.group(1)) * 60, int(hour_range_match.group(2)) * 60

        hour_match = re.search(r'(\d+)\s*hour', time_str, re.IGNORECASE)
        if hour_match:
            val = int(hour_match.group(1)) * 60
            return val, val

        return None, None

    def parse_states(self, state_str: str) -> List[str]:
        """
        Parse comma-separated states from "The State It Creates" field
        """
        if not state_str:
            return []

        # Split by comma and clean up each state
        states = [s.strip().lower() for s in state_str.split(',')]
        return [s for s in states if s]

    def infer_difficulty(self, time_min: Optional[int], time_max: Optional[int]) -> str:
        """
        Infer difficulty based on time commitment
        <10min = beginner, 10-20min = intermediate, >20min = advanced
        """
        if time_min is None and time_max is None:
            return "intermediate"  # Default for variable time

        avg_time = time_max if time_max else time_min if time_min else 15

        if avg_time < 10:
            return "beginner"
        elif avg_time <= 20:
            return "intermediate"
        else:
            return "advanced"

    def infer_temperament(self, practice_title: str, instructions: str) -> List[str]:
        """
        Infer temperament match based on practice characteristics
        """
        text = (practice_title + " " + instructions).lower()
        temperaments = []

        for temp, keywords in self.TEMPERAMENT_KEYWORDS.items():
            if any(keyword in text for keyword in keywords):
                temperaments.append(temp)

        # Default to sage if no matches
        return temperaments if temperaments else ["sage"]

    def extract_practice_id(self, header: str) -> Optional[int]:
        """
        Extract practice ID from header like "#### **1\. Prayer and Worship**"
        Note: Escaped periods in markdown (1\. not 1.)
        """
        match = re.search(r'####\s+\*\*(\d+)\\?\.\s+(.+?)\*\*', header)
        if match:
            return int(match.group(1))
        return None

    def extract_practice_title(self, header: str) -> Optional[str]:
        """
        Extract practice title from header
        """
        match = re.search(r'####\s+\*\*\d+\\?\.\s+(.+?)\*\*', header)
        if match:
            return match.group(1).strip()
        return None

    def parse_practice(self, practice_text: str, chunk_number: int) -> Optional[Dict]:
        """
        Parse a single practice block into structured JSON
        """
        lines = practice_text.strip().split('\n')

        # Extract header (first line)
        header = lines[0]
        practice_id = self.extract_practice_id(header)
        practice_title = self.extract_practice_title(header)

        if not practice_id or not practice_title:
            return None

        # Parse the rest of the practice
        time_str = ""
        state_str = ""
        instructions_lines = []
        why_it_works = ""

        in_instructions = False
        in_why = False

        for line in lines[1:]:
            line = line.strip()

            # Extract time and state (often on same line)
            if "**Time:**" in line:
                # Extract time part
                time_match = re.search(r'\*\*Time:\*\*\s*([^*]+?)(?:\s*\*\*|$)', line)
                if time_match:
                    time_str = time_match.group(1).strip()

                # Extract state part (may be on same line)
                # Stop at **Instructions:** if present
                state_match = re.search(r'\*\*The State It Creates:\*\*\s*(.+?)(?:\s*\*\*Instructions:\*\*|$)', line)
                if state_match:
                    state_str = state_match.group(1).strip()

            # Extract states if on separate line
            elif line.startswith("**The State It Creates:**"):
                state_str = line.replace("**The State It Creates:**", "").strip()

            # Extract instructions
            elif line.startswith("**Instructions:**"):
                in_instructions = True
                in_why = False
            elif line.startswith("**Why it works:**"):
                in_why = True
                in_instructions = False
                why_it_works = line.replace("**Why it works:**", "").strip()
            elif in_instructions and line:
                instructions_lines.append(line)
            elif in_why and line:
                why_it_works += " " + line

        # Parse time
        time_min, time_max = self.parse_time(time_str)

        # Parse states
        states = self.parse_states(state_str)

        # Build full chunk text
        chunk_text = practice_text.strip()

        # Build instructions text
        instructions_text = "\n".join(instructions_lines)

        # Infer metadata
        category = self.current_category or "traditional-foundation"
        applicable_patterns = self.PATTERN_RULES.get(category, [])
        temperament = self.infer_temperament(practice_title, instructions_text)
        difficulty = self.infer_difficulty(time_min, time_max)

        # Calculate approximate tokens (rough estimate: 4 chars per token)
        tokens_approx = len(chunk_text) // 4

        # Build practice object
        practice = {
            "source_file": "daily_deductible_library.md",
            "file_number": 1,
            "chunk_number": chunk_number,
            "chunk_text": chunk_text,
            "chunk_summary": practice_title,
            "category": category,
            "applicable_patterns": applicable_patterns,
            "temperament_match": temperament,
            "time_commitment_min": time_min,
            "time_commitment_max": time_max,
            "difficulty_level": difficulty,
            "state_created": states,
            "tokens_approx": tokens_approx,

            # Additional fields mentioned in requirements (not in schema yet)
            "is_emergency_protocol": False,
            "practice_frequency": "daily"
        }

        return practice

    def parse_file(self, file_path: str) -> List[Dict]:
        """
        Parse entire Daily Deductible markdown file
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Use direct parsing method which handles categories properly
        self.practices = self._parse_direct(content)

        return self.practices

    def _parse_direct(self, content: str) -> List[Dict]:
        """
        Alternative parsing method: find all practice headers and extract blocks
        """
        practices = []

        # Find all practice headers
        practice_pattern = r'#### \*\*(\d+)\\\.\s+(.+?)\*\*'
        practice_matches = list(re.finditer(practice_pattern, content))

        # Find all section headers (categories)
        # Must start with ### ** and NOT be followed by a digit (which would be a practice)
        section_pattern = r'### \*\*(?!\d)(.+?)\*\*'
        section_matches = list(re.finditer(section_pattern, content))

        chunk_number = 1

        for i, match in enumerate(practice_matches):
            start = match.start()

            # Find which category this practice belongs to
            # Look backwards from practice start to find the most recent section header
            current_category = "traditional-foundation"  # Default
            for section_match in reversed(section_matches):
                if section_match.start() < start:
                    category_name = section_match.group(1).strip()
                    # Remove any parenthetical descriptions and escaped chars
                    category_name = re.sub(r'\s*\(.+?\)\s*$', '', category_name)
                    category_name = category_name.replace('\\', '')  # Remove escape chars
                    current_category = self.CATEGORY_MAP.get(category_name, "traditional-foundation")
                    break

            # Set category for this practice
            self.current_category = current_category

            # End is either the next practice or end of section
            if i + 1 < len(practice_matches):
                end = practice_matches[i + 1].start()
            else:
                # Find next major section or end of file
                next_section = content.find('\n---\n', start)
                if next_section != -1:
                    end = next_section
                else:
                    end = len(content)

            practice_text = content[start:end].strip()
            parsed = self.parse_practice(practice_text, chunk_number)
            if parsed:
                practices.append(parsed)
                chunk_number += 1

        return practices


def main():
    """Main execution"""
    import sys

    parser = DailyDeductibleParser()

    # File paths
    base_path = Path("/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/protocol-parsing")
    test_file = base_path / "fixtures" / "test-daily-deductible.md"
    staging_file = base_path / "staging" / "daily-deductible-normalized.md"
    output_file = base_path / "output" / "daily-deductible-parsed.json"

    # Ensure output directory exists
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Parse test file first
    print("=" * 80)
    print("DAILY DEDUCTIBLE PARSER - MIO Protocol Parsing System")
    print("=" * 80)
    print()

    if test_file.exists():
        print(f"Testing on: {test_file}")
        test_practices = parser.parse_file(str(test_file))
        print(f"✓ Parsed {len(test_practices)} practices from test fixture")

        if test_practices:
            print()
            print("Sample practice (first from test):")
            print(json.dumps(test_practices[0], indent=2))
        print()

    # Parse full staging file
    parser = DailyDeductibleParser()  # Reset parser

    if staging_file.exists():
        print(f"Parsing full file: {staging_file}")
        all_practices = parser.parse_file(str(staging_file))
        print(f"✓ Parsed {len(all_practices)} practices from staging file")

        # Write to output file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_practices, f, indent=2, ensure_ascii=False)

        print(f"✓ Output written to: {output_file}")

        # Show statistics
        print()
        print("Statistics:")
        print(f"  Total practices: {len(all_practices)}")

        categories = {}
        for p in all_practices:
            cat = p.get('category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1

        print(f"  Categories:")
        for cat, count in sorted(categories.items()):
            print(f"    - {cat}: {count}")

        print()
        print("Sample practice (first from staging):")
        if all_practices:
            print(json.dumps(all_practices[0], indent=2))
    else:
        print(f"ERROR: Staging file not found: {staging_file}")
        sys.exit(1)


if __name__ == "__main__":
    main()
