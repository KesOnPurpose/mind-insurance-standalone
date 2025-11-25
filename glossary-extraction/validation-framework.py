#!/usr/bin/env python3
"""
Protocol Readability Validation Framework
Week 3 Day 5-7: Agent 3

Validates protocol readability using multiple metrics:
1. Flesch-Kincaid Grade Level (target: 8th grade)
2. Flesch Reading Ease (target: 60-70)
3. Jargon Density (technical terms per 100 words, target: <5)
4. Sentence Complexity (average words per sentence, target: <20)
5. Syllable Complexity (average syllables per word, target: <2)

Usage:
    python3 validation-framework.py --input protocols.json --output validation-report.json
    python3 validation-framework.py --test  # Run on sample data
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict
import argparse


@dataclass
class ReadabilityMetrics:
    """Readability scores for a single protocol."""
    protocol_id: str
    source_file: str
    chunk_summary: str

    # Flesch-Kincaid metrics
    flesch_kincaid_grade: float
    flesch_reading_ease: float

    # Text complexity
    word_count: int
    sentence_count: int
    syllable_count: int
    avg_words_per_sentence: float
    avg_syllables_per_word: float

    # Jargon analysis
    technical_term_count: int
    jargon_density: float  # Terms per 100 words

    # Overall assessment
    reading_level_category: str  # 'easy', 'moderate', 'difficult', 'very_difficult'
    needs_simplification: bool
    priority_score: int  # 0-100, higher = more urgent to simplify


def count_syllables(word: str) -> int:
    """
    Count syllables in a word using vowel groups.

    Rules:
    - Count vowel groups (consecutive vowels = 1 syllable)
    - Silent 'e' at end doesn't count
    - Minimum 1 syllable per word
    """
    word = word.lower().strip()

    # Remove non-alpha characters
    word = re.sub(r'[^a-z]', '', word)

    if not word:
        return 0

    # Count vowel groups
    vowel_groups = re.findall(r'[aeiouy]+', word)
    syllable_count = len(vowel_groups)

    # Subtract silent 'e' at end
    if word.endswith('e') and syllable_count > 1:
        syllable_count -= 1

    # Ensure minimum 1 syllable
    return max(1, syllable_count)


def count_sentences(text: str) -> int:
    """
    Count sentences in text.

    Sentence delimiters: . ! ?
    Handles abbreviations (e.g., Dr., Mr., etc.)
    """
    # Replace common abbreviations to avoid false splits
    text = re.sub(r'\b(Dr|Mr|Mrs|Ms|etc|i\.e|e\.g)\.', r'\1<PERIOD>', text, flags=re.IGNORECASE)

    # Count sentence-ending punctuation
    sentences = re.split(r'[.!?]+', text)

    # Filter empty strings
    sentences = [s.strip() for s in sentences if s.strip()]

    return max(1, len(sentences))  # Minimum 1 sentence


def calculate_flesch_kincaid_grade(text: str, word_count: int, sentence_count: int, syllable_count: int) -> float:
    """
    Calculate Flesch-Kincaid Grade Level.

    Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59

    Score interpretation:
    - 5.0-6.0 = 5th-6th grade (easy to read)
    - 7.0-8.0 = 7th-8th grade (fairly easy) ← TARGET
    - 9.0-10.0 = 9th-10th grade (plain English)
    - 11.0-12.0 = 11th-12th grade (fairly difficult)
    - 13.0+ = College level (difficult)
    """
    if word_count == 0 or sentence_count == 0:
        return 0.0

    avg_words_per_sentence = word_count / sentence_count
    avg_syllables_per_word = syllable_count / word_count

    grade_level = (0.39 * avg_words_per_sentence) + (11.8 * avg_syllables_per_word) - 15.59

    return round(grade_level, 2)


def calculate_flesch_reading_ease(text: str, word_count: int, sentence_count: int, syllable_count: int) -> float:
    """
    Calculate Flesch Reading Ease Score.

    Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)

    Score interpretation:
    - 90-100 = Very easy (5th grade)
    - 80-90 = Easy (6th grade)
    - 70-80 = Fairly easy (7th grade)
    - 60-70 = Standard (8th-9th grade) ← TARGET
    - 50-60 = Fairly difficult (10th-12th grade)
    - 30-50 = Difficult (college)
    - 0-30 = Very difficult (college graduate)
    """
    if word_count == 0 or sentence_count == 0:
        return 0.0

    avg_words_per_sentence = word_count / sentence_count
    avg_syllables_per_word = syllable_count / word_count

    ease_score = 206.835 - (1.015 * avg_words_per_sentence) - (84.6 * avg_syllables_per_word)

    return round(ease_score, 2)


def analyze_text_complexity(text: str) -> Tuple[int, int, int]:
    """
    Analyze text for word count, sentence count, and syllable count.

    Returns: (word_count, sentence_count, syllable_count)
    """
    # Remove markdown formatting for accurate counting
    clean_text = re.sub(r'\*\*', '', text)  # Remove bold
    clean_text = re.sub(r'\*', '', clean_text)  # Remove italics
    clean_text = re.sub(r'#{1,6}\s', '', clean_text)  # Remove headers
    clean_text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean_text)  # Remove links, keep text

    # Count words
    words = re.findall(r'\b[a-zA-Z]+\b', clean_text)
    word_count = len(words)

    # Count sentences
    sentence_count = count_sentences(clean_text)

    # Count syllables
    syllable_count = sum(count_syllables(word) for word in words)

    return word_count, sentence_count, syllable_count


def find_technical_terms_simple(text: str) -> List[str]:
    """
    Identify technical terms using heuristics.

    Technical term indicators:
    - Contains medical/scientific suffixes: -ology, -ation, -osis, -ism
    - Contains neuro-, psycho-, bio- prefixes
    - Multi-syllable Latinate words
    - Common neuroscience terms (hardcoded list)

    Note: This is a simplified version. Full implementation should use glossary.
    """
    technical_terms = []

    # Common neuroscience/psychology terms
    neuroscience_terms = [
        'vagus nerve', 'coherence', 'neuroplasticity', 'amygdala', 'cortisol',
        'dopamine', 'serotonin', 'prefrontal cortex', 'limbic system',
        'hippocampus', 'neural pathways', 'synaptic', 'neurotransmitter',
        'homeostasis', 'autonomic', 'parasympathetic', 'sympathetic',
        'neurological', 'cognitive', 'metacognition', 'executive function'
    ]

    text_lower = text.lower()

    # Find multi-word technical terms
    for term in neuroscience_terms:
        if term in text_lower:
            technical_terms.append(term)

    # Find words with technical suffixes
    words = re.findall(r'\b[a-zA-Z]+\b', text)
    for word in words:
        if len(word) < 5:
            continue  # Skip short words

        word_lower = word.lower()

        # Check for technical suffixes
        if any(word_lower.endswith(suffix) for suffix in [
            'ology', 'ation', 'osis', 'ism', 'itis', 'ectomy',
            'plasia', 'pathy', 'trophy', 'genesis', 'lysis'
        ]):
            technical_terms.append(word)

        # Check for technical prefixes
        if any(word_lower.startswith(prefix) for prefix in [
            'neuro', 'psycho', 'bio', 'physio', 'cardio', 'hemo'
        ]):
            technical_terms.append(word)

    # Remove duplicates
    return list(set(technical_terms))


def calculate_jargon_density(text: str, technical_terms: List[str]) -> float:
    """
    Calculate jargon density: technical terms per 100 words.

    Target: <5 terms per 100 words (5% jargon density)
    """
    words = re.findall(r'\b[a-zA-Z]+\b', text)
    word_count = len(words)

    if word_count == 0:
        return 0.0

    density = (len(technical_terms) / word_count) * 100
    return round(density, 2)


def categorize_reading_level(flesch_kincaid_grade: float, flesch_reading_ease: float) -> str:
    """
    Categorize reading difficulty.

    Categories:
    - easy: FKG ≤ 6, FRE ≥ 80
    - moderate: FKG 7-9, FRE 60-80
    - difficult: FKG 10-12, FRE 40-60
    - very_difficult: FKG > 12, FRE < 40
    """
    if flesch_kincaid_grade <= 6 and flesch_reading_ease >= 80:
        return 'easy'
    elif flesch_kincaid_grade <= 9 and flesch_reading_ease >= 60:
        return 'moderate'
    elif flesch_kincaid_grade <= 12 and flesch_reading_ease >= 40:
        return 'difficult'
    else:
        return 'very_difficult'


def calculate_priority_score(
    flesch_kincaid_grade: float,
    jargon_density: float,
    difficulty_level: str,
    category: str
) -> int:
    """
    Calculate update priority score (0-100).

    Higher score = more urgent to simplify.

    Factors:
    - Reading level (max 40 points)
    - Jargon density (max 30 points)
    - Difficulty level (max 15 points)
    - Category (max 15 points)
    """
    score = 0

    # Reading level (max 40 points)
    if flesch_kincaid_grade > 12:
        score += 40
    elif flesch_kincaid_grade > 10:
        score += 30
    elif flesch_kincaid_grade > 8:
        score += 20
    elif flesch_kincaid_grade > 6:
        score += 10

    # Jargon density (max 30 points)
    if jargon_density > 10:
        score += 30
    elif jargon_density > 5:
        score += 20
    elif jargon_density > 2:
        score += 10

    # Difficulty level (max 15 points)
    if difficulty_level == 'advanced':
        score += 15
    elif difficulty_level == 'intermediate':
        score += 10
    elif difficulty_level == 'beginner':
        score += 5

    # Category (max 15 points)
    if category == 'neural-rewiring':
        score += 15
    elif category in ['research', 'clinical']:
        score += 10
    elif category in ['daily-deductible', 'traditional']:
        score += 5

    return min(100, score)  # Cap at 100


def validate_protocol_readability(protocol: Dict[str, Any]) -> ReadabilityMetrics:
    """
    Validate readability of a single protocol.

    Returns: ReadabilityMetrics object
    """
    protocol_id = protocol.get('id', protocol.get('chunk_number', 'unknown'))
    source_file = protocol.get('source_file', 'unknown')
    chunk_summary = protocol.get('chunk_summary', 'No summary')
    chunk_text = protocol.get('chunk_text', '')
    difficulty_level = protocol.get('difficulty_level', 'intermediate')
    category = protocol.get('category', 'general')

    # Analyze text complexity
    word_count, sentence_count, syllable_count = analyze_text_complexity(chunk_text)

    # Calculate Flesch-Kincaid metrics
    flesch_kincaid_grade = calculate_flesch_kincaid_grade(
        chunk_text, word_count, sentence_count, syllable_count
    )
    flesch_reading_ease = calculate_flesch_reading_ease(
        chunk_text, word_count, sentence_count, syllable_count
    )

    # Analyze jargon
    technical_terms = find_technical_terms_simple(chunk_text)
    jargon_density = calculate_jargon_density(chunk_text, technical_terms)

    # Calculate derived metrics
    avg_words_per_sentence = word_count / sentence_count if sentence_count > 0 else 0
    avg_syllables_per_word = syllable_count / word_count if word_count > 0 else 0

    # Categorize reading level
    reading_level_category = categorize_reading_level(flesch_kincaid_grade, flesch_reading_ease)

    # Determine if needs simplification (target: 8th grade or below)
    needs_simplification = flesch_kincaid_grade > 8.0 or jargon_density > 5.0

    # Calculate priority score
    priority_score = calculate_priority_score(
        flesch_kincaid_grade, jargon_density, difficulty_level, category
    )

    return ReadabilityMetrics(
        protocol_id=str(protocol_id),
        source_file=source_file,
        chunk_summary=chunk_summary,
        flesch_kincaid_grade=flesch_kincaid_grade,
        flesch_reading_ease=flesch_reading_ease,
        word_count=word_count,
        sentence_count=sentence_count,
        syllable_count=syllable_count,
        avg_words_per_sentence=round(avg_words_per_sentence, 2),
        avg_syllables_per_word=round(avg_syllables_per_word, 2),
        technical_term_count=len(technical_terms),
        jargon_density=jargon_density,
        reading_level_category=reading_level_category,
        needs_simplification=needs_simplification,
        priority_score=priority_score
    )


def generate_validation_report(metrics_list: List[ReadabilityMetrics]) -> Dict[str, Any]:
    """
    Generate comprehensive validation report from metrics.

    Returns summary statistics and flagged protocols.
    """
    if not metrics_list:
        return {
            'error': 'No metrics to analyze',
            'protocol_count': 0
        }

    # Calculate summary statistics
    total_protocols = len(metrics_list)
    avg_fkg = sum(m.flesch_kincaid_grade for m in metrics_list) / total_protocols
    avg_fre = sum(m.flesch_reading_ease for m in metrics_list) / total_protocols
    avg_jargon = sum(m.jargon_density for m in metrics_list) / total_protocols
    avg_words_per_sentence = sum(m.avg_words_per_sentence for m in metrics_list) / total_protocols

    # Count protocols by reading level category
    category_counts = {
        'easy': 0,
        'moderate': 0,
        'difficult': 0,
        'very_difficult': 0
    }
    for m in metrics_list:
        category_counts[m.reading_level_category] += 1

    # Count protocols needing simplification
    needs_simplification = sum(1 for m in metrics_list if m.needs_simplification)

    # Find protocols with highest priority
    high_priority = sorted(
        [m for m in metrics_list if m.priority_score >= 60],
        key=lambda m: m.priority_score,
        reverse=True
    )

    # Find protocols with worst readability
    worst_readability = sorted(
        metrics_list,
        key=lambda m: m.flesch_kincaid_grade,
        reverse=True
    )[:20]  # Top 20 worst

    # Find protocols with highest jargon density
    highest_jargon = sorted(
        metrics_list,
        key=lambda m: m.jargon_density,
        reverse=True
    )[:20]  # Top 20 highest jargon

    return {
        'summary': {
            'total_protocols': total_protocols,
            'avg_flesch_kincaid_grade': round(avg_fkg, 2),
            'avg_flesch_reading_ease': round(avg_fre, 2),
            'avg_jargon_density': round(avg_jargon, 2),
            'avg_words_per_sentence': round(avg_words_per_sentence, 2),
            'protocols_needing_simplification': needs_simplification,
            'simplification_percentage': round((needs_simplification / total_protocols) * 100, 2)
        },
        'reading_level_distribution': category_counts,
        'target_achievement': {
            'protocols_at_target': total_protocols - needs_simplification,
            'protocols_above_target': needs_simplification,
            'target_achievement_rate': round(((total_protocols - needs_simplification) / total_protocols) * 100, 2)
        },
        'high_priority_protocols': [asdict(m) for m in high_priority[:20]],
        'worst_readability_protocols': [asdict(m) for m in worst_readability],
        'highest_jargon_protocols': [asdict(m) for m in highest_jargon]
    }


def run_validation_test():
    """
    Run validation on sample test data.
    """
    print("=" * 80)
    print("READABILITY VALIDATION FRAMEWORK - TEST MODE")
    print("=" * 80)
    print()

    # Sample test protocols
    test_protocols = [
        {
            'id': 'test-1',
            'source_file': 'test.md',
            'chunk_number': 1,
            'chunk_summary': 'Easy Protocol',
            'chunk_text': 'This is a simple test. The text is easy to read. It has short sentences. Anyone can understand it.',
            'difficulty_level': 'beginner',
            'category': 'daily-deductible'
        },
        {
            'id': 'test-2',
            'source_file': 'test.md',
            'chunk_number': 2,
            'chunk_summary': 'Complex Protocol',
            'chunk_text': '''
            The practice activates the vagus nerve through vocalization, which shifts from fear to faith,
            creating a neurological state of trust and safety. The vibration of singing literally changes
            your physiological state by modulating the autonomic nervous system and engaging the
            parasympathetic response, thereby reducing cortisol levels and promoting homeostasis.
            ''',
            'difficulty_level': 'advanced',
            'category': 'neural-rewiring'
        },
        {
            'id': 'test-3',
            'source_file': 'test.md',
            'chunk_number': 3,
            'chunk_summary': 'Moderate Protocol',
            'chunk_text': '''
            Meditation on vision creates coherence between mind and body. It generates the emotions of
            your future in the present. This literally begins to rewire neural pathways toward that reality.
            Sit in silence for 10 minutes daily and visualize your goals as already accomplished.
            ''',
            'difficulty_level': 'intermediate',
            'category': 'traditional-foundation'
        }
    ]

    print("Analyzing 3 test protocols...")
    print()

    metrics_list = []
    for i, protocol in enumerate(test_protocols, 1):
        print(f"Protocol {i}: {protocol['chunk_summary']}")
        print("-" * 80)

        metrics = validate_protocol_readability(protocol)
        metrics_list.append(metrics)

        print(f"  Flesch-Kincaid Grade Level: {metrics.flesch_kincaid_grade} (Target: ≤ 8.0)")
        print(f"  Flesch Reading Ease: {metrics.flesch_reading_ease} (Target: 60-70)")
        print(f"  Words: {metrics.word_count} | Sentences: {metrics.sentence_count} | Syllables: {metrics.syllable_count}")
        print(f"  Avg Words/Sentence: {metrics.avg_words_per_sentence} (Target: < 20)")
        print(f"  Avg Syllables/Word: {metrics.avg_syllables_per_word} (Target: < 2)")
        print(f"  Technical Terms: {metrics.technical_term_count}")
        print(f"  Jargon Density: {metrics.jargon_density}% (Target: < 5%)")
        print(f"  Reading Level: {metrics.reading_level_category.upper()}")
        print(f"  Needs Simplification: {'YES' if metrics.needs_simplification else 'NO'}")
        print(f"  Priority Score: {metrics.priority_score}/100")
        print()

    # Generate report
    print("=" * 80)
    print("VALIDATION REPORT SUMMARY")
    print("=" * 80)

    report = generate_validation_report(metrics_list)

    print("\nSummary Statistics:")
    for key, value in report['summary'].items():
        print(f"  {key}: {value}")

    print("\nReading Level Distribution:")
    for level, count in report['reading_level_distribution'].items():
        print(f"  {level}: {count} protocols")

    print("\nTarget Achievement:")
    for key, value in report['target_achievement'].items():
        print(f"  {key}: {value}")

    print("\nTest completed successfully!")
    print("=" * 80)


def main():
    """
    Main entry point.
    """
    parser = argparse.ArgumentParser(description='Validate protocol readability')
    parser.add_argument('--input', type=str, help='Input JSON file with protocols')
    parser.add_argument('--output', type=str, help='Output JSON file for validation report')
    parser.add_argument('--test', action='store_true', help='Run test mode with sample data')

    args = parser.parse_args()

    if args.test:
        run_validation_test()
        return

    if not args.input:
        print("Error: --input required (or use --test for demo)")
        parser.print_help()
        sys.exit(1)

    # Load protocols
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    print(f"Loading protocols from {input_path}...")
    with open(input_path, 'r', encoding='utf-8') as f:
        protocols = json.load(f)

    if not isinstance(protocols, list):
        print("Error: Input JSON must be an array of protocols")
        sys.exit(1)

    print(f"Analyzing {len(protocols)} protocols...")
    print()

    # Validate each protocol
    metrics_list = []
    for i, protocol in enumerate(protocols, 1):
        if i % 10 == 0:
            print(f"  Processed {i}/{len(protocols)} protocols...")

        metrics = validate_protocol_readability(protocol)
        metrics_list.append(metrics)

    print(f"✓ All {len(protocols)} protocols analyzed")
    print()

    # Generate report
    print("Generating validation report...")
    report = generate_validation_report(metrics_list)

    # Save report
    output_path = Path(args.output) if args.output else input_path.parent / 'validation-report.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"✓ Report saved to {output_path}")
    print()

    # Print summary
    print("=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)
    print()

    summary = report['summary']
    print(f"Total Protocols: {summary['total_protocols']}")
    print(f"Average Reading Level: {summary['avg_flesch_kincaid_grade']} (Target: ≤ 8.0)")
    print(f"Average Jargon Density: {summary['avg_jargon_density']}% (Target: < 5%)")
    print(f"Protocols Needing Simplification: {summary['protocols_needing_simplification']} ({summary['simplification_percentage']}%)")
    print()

    target = report['target_achievement']
    print(f"Target Achievement Rate: {target['target_achievement_rate']}%")
    print(f"  At Target: {target['protocols_at_target']}")
    print(f"  Above Target: {target['protocols_above_target']}")
    print()

    print("Reading Level Distribution:")
    for level, count in report['reading_level_distribution'].items():
        pct = (count / summary['total_protocols']) * 100
        print(f"  {level}: {count} ({pct:.1f}%)")
    print()

    print(f"High Priority Protocols: {len(report['high_priority_protocols'])}")
    if report['high_priority_protocols']:
        print("  Top 5:")
        for i, protocol in enumerate(report['high_priority_protocols'][:5], 1):
            print(f"    {i}. {protocol['chunk_summary']} (Priority: {protocol['priority_score']}, FKG: {protocol['flesch_kincaid_grade']})")

    print()
    print("=" * 80)
    print("✓ Validation complete!")
    print("=" * 80)


if __name__ == '__main__':
    main()
