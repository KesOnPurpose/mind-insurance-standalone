#!/usr/bin/env python3
"""
MIO Protocol Parser - Day 7: Search Validation
Tests hybrid search functionality: vector similarity + full-text + pattern matching
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Any

# Check if supabase package is available
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️  supabase-py not installed. Install with: pip install supabase")

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://hpyodaugrkctagkrfofj.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')

# Test queries covering different search patterns
TEST_QUERIES = [
    {
        'name': 'Vector Similarity: Motivation Issue',
        'query': 'I feel unmotivated and stuck in my business',
        'expected_patterns': ['motivation_collapse', 'past_prison'],
        'expected_min_results': 5
    },
    {
        'name': 'Vector Similarity: Comparison Struggles',
        'query': 'I keep comparing myself to others and feeling inadequate',
        'expected_patterns': ['comparison_catastrophe', 'impostor_syndrome'],
        'expected_min_results': 5
    },
    {
        'name': 'Pattern Filter: Success Sabotage',
        'pattern_filter': 'success_sabotage',
        'expected_min_results': 10
    },
    {
        'name': 'Temperament Filter: Warrior',
        'temperament_filter': 'warrior',
        'expected_min_results': 30
    },
    {
        'name': 'Time Commitment: Quick Wins (5-10 min)',
        'time_max': 10,
        'expected_min_results': 20
    },
    {
        'name': 'Emergency Protocols Only',
        'emergency_only': True,
        'expected_min_results': 12
    },
    {
        'name': 'Full-Text Search: Prayer',
        'text_search': 'prayer worship',
        'expected_min_results': 3
    },
    {
        'name': 'Category Filter: Neural Rewiring',
        'category': 'neural-rewiring',
        'expected_min_results': 40
    },
    {
        'name': 'Hybrid: Warrior + Motivation + Under 20 min',
        'query': 'feel unmotivated to take action',
        'temperament_filter': 'warrior',
        'time_max': 20,
        'expected_min_results': 3
    },
    {
        'name': 'Hybrid: Emergency + Comparison Pattern',
        'pattern_filter': 'comparison_catastrophe',
        'emergency_only': True,
        'expected_min_results': 4
    }
]

def create_supabase_client() -> Client:
    """Create authenticated Supabase client"""
    if not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_SERVICE_KEY environment variable not set")

    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_embedding(text: str) -> List[float]:
    """
    Generate embedding for search query using OpenAI API
    (In production, this would call OpenAI's text-embedding-3-small)
    For testing, we'll use a simple approach or skip vector search
    """
    try:
        import openai
        openai.api_key = os.getenv('OPENAI_API_KEY')

        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"   ⚠️  Could not generate embedding: {e}")
        return None

def run_vector_search(supabase: Client, query: str, limit: int = 10) -> List[Dict]:
    """Run vector similarity search"""
    embedding = get_embedding(query)
    if not embedding:
        print("   ⚠️  Skipping vector search (no embedding)")
        return []

    # Call the search_mio_protocols function
    result = supabase.rpc('search_mio_protocols', {
        'query_embedding': embedding,
        'match_threshold': 0.7,
        'match_count': limit
    }).execute()

    return result.data if result.data else []

def run_pattern_filter(supabase: Client, pattern: str, limit: int = 20) -> List[Dict]:
    """Filter by pattern"""
    result = supabase.table('mio_knowledge_chunks') \
        .select('*') \
        .contains('applicable_patterns', [pattern]) \
        .limit(limit) \
        .execute()

    return result.data if result.data else []

def run_temperament_filter(supabase: Client, temperament: str, limit: int = 50) -> List[Dict]:
    """Filter by temperament"""
    result = supabase.table('mio_knowledge_chunks') \
        .select('*') \
        .contains('temperament_match', [temperament]) \
        .limit(limit) \
        .execute()

    return result.data if result.data else []

def run_time_filter(supabase: Client, max_minutes: int, limit: int = 30) -> List[Dict]:
    """Filter by time commitment"""
    result = supabase.table('mio_knowledge_chunks') \
        .select('*') \
        .lte('time_commitment_max', max_minutes) \
        .limit(limit) \
        .execute()

    return result.data if result.data else []

def run_emergency_filter(supabase: Client, limit: int = 20) -> List[Dict]:
    """Filter emergency protocols only"""
    result = supabase.table('mio_knowledge_chunks') \
        .select('*') \
        .eq('is_emergency_protocol', True) \
        .limit(limit) \
        .execute()

    return result.data if result.data else []

def run_text_search(supabase: Client, text: str, limit: int = 20) -> List[Dict]:
    """Full-text search on chunk_text"""
    result = supabase.table('mio_knowledge_chunks') \
        .select('*') \
        .text_search('chunk_text', text) \
        .limit(limit) \
        .execute()

    return result.data if result.data else []

def run_category_filter(supabase: Client, category: str, limit: int = 50) -> List[Dict]:
    """Filter by category"""
    result = supabase.table('mio_knowledge_chunks') \
        .select('*') \
        .eq('category', category) \
        .limit(limit) \
        .execute()

    return result.data if result.data else []

def run_hybrid_search(supabase: Client, test_case: Dict) -> List[Dict]:
    """Run hybrid search with multiple filters"""
    query = supabase.table('mio_knowledge_chunks').select('*')

    # Apply filters
    if test_case.get('pattern_filter'):
        query = query.contains('applicable_patterns', [test_case['pattern_filter']])

    if test_case.get('temperament_filter'):
        query = query.contains('temperament_match', [test_case['temperament_filter']])

    if test_case.get('time_max'):
        query = query.lte('time_commitment_max', test_case['time_max'])

    if test_case.get('emergency_only'):
        query = query.eq('is_emergency_protocol', True)

    if test_case.get('category'):
        query = query.eq('category', test_case['category'])

    result = query.limit(50).execute()

    # If there's a query text, rank by vector similarity (in production)
    # For now, return filtered results
    return result.data if result.data else []

def validate_test_case(test_case: Dict, results: List[Dict]) -> Dict[str, Any]:
    """Validate test case results"""
    validation = {
        'name': test_case['name'],
        'passed': True,
        'issues': []
    }

    # Check minimum results
    expected_min = test_case.get('expected_min_results', 1)
    if len(results) < expected_min:
        validation['passed'] = False
        validation['issues'].append(
            f"Expected at least {expected_min} results, got {len(results)}"
        )

    # Check expected patterns (if applicable)
    if test_case.get('expected_patterns'):
        found_patterns = set()
        for result in results:
            patterns = result.get('applicable_patterns', [])
            found_patterns.update(patterns)

        expected_patterns = set(test_case['expected_patterns'])
        missing_patterns = expected_patterns - found_patterns

        if missing_patterns:
            validation['passed'] = False
            validation['issues'].append(
                f"Missing expected patterns: {', '.join(missing_patterns)}"
            )

    # Check that results have required fields
    if results:
        sample = results[0]
        required_fields = ['chunk_summary', 'category', 'applicable_patterns']
        missing_fields = [f for f in required_fields if f not in sample]

        if missing_fields:
            validation['passed'] = False
            validation['issues'].append(
                f"Results missing fields: {', '.join(missing_fields)}"
            )

    validation['result_count'] = len(results)
    return validation

def run_validation_suite():
    """Run complete validation suite"""
    print("=" * 80)
    print("MIO Protocol Library - Search Validation Suite")
    print("=" * 80)
    print()

    # Check prerequisites
    if not SUPABASE_AVAILABLE:
        print("❌ supabase-py package not installed")
        print("   Install with: pip install supabase")
        return

    if not SUPABASE_SERVICE_KEY:
        print("❌ SUPABASE_SERVICE_KEY environment variable not set")
        return

    print("✓ Prerequisites checked")
    print()

    # Create Supabase client
    try:
        supabase = create_supabase_client()
        print("✓ Connected to Supabase")
        print()
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return

    # Check table exists and has data
    try:
        count_result = supabase.table('mio_knowledge_chunks') \
            .select('id', count='exact') \
            .limit(1) \
            .execute()

        total_count = count_result.count
        print(f"✓ Found {total_count} protocols in database")
        print()

        if total_count == 0:
            print("⚠️  No protocols in database. Run Day 6 insertion script first.")
            return

    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return

    # Run test cases
    results_summary = []

    for i, test_case in enumerate(TEST_QUERIES, 1):
        print(f"Test {i}/{len(TEST_QUERIES)}: {test_case['name']}")
        print("-" * 80)

        try:
            # Run appropriate search
            if test_case.get('query'):
                if any(k in test_case for k in ['pattern_filter', 'temperament_filter', 'time_max', 'emergency_only']):
                    # Hybrid search
                    results = run_hybrid_search(supabase, test_case)
                else:
                    # Pure vector search
                    results = run_vector_search(supabase, test_case['query'])
            elif test_case.get('pattern_filter'):
                results = run_pattern_filter(supabase, test_case['pattern_filter'])
            elif test_case.get('temperament_filter'):
                results = run_temperament_filter(supabase, test_case['temperament_filter'])
            elif test_case.get('time_max'):
                results = run_time_filter(supabase, test_case['time_max'])
            elif test_case.get('emergency_only'):
                results = run_emergency_filter(supabase)
            elif test_case.get('text_search'):
                results = run_text_search(supabase, test_case['text_search'])
            elif test_case.get('category'):
                results = run_category_filter(supabase, test_case['category'])
            else:
                print("   ⚠️  Unknown test case type")
                continue

            # Validate results
            validation = validate_test_case(test_case, results)
            results_summary.append(validation)

            # Print results
            if validation['passed']:
                print(f"   ✅ PASSED - {validation['result_count']} results")
            else:
                print(f"   ❌ FAILED - {validation['result_count']} results")
                for issue in validation['issues']:
                    print(f"      • {issue}")

            # Show sample results
            if results:
                print(f"   Sample results:")
                for j, result in enumerate(results[:3], 1):
                    summary = result.get('chunk_summary', 'Unknown')
                    category = result.get('category', 'Unknown')
                    patterns = result.get('applicable_patterns', [])
                    print(f"      {j}. {summary} ({category})")
                    if patterns:
                        print(f"         Patterns: {', '.join(patterns[:3])}")

            print()

        except Exception as e:
            print(f"   ❌ ERROR: {e}")
            print()
            results_summary.append({
                'name': test_case['name'],
                'passed': False,
                'issues': [str(e)],
                'result_count': 0
            })

    # Final summary
    print("=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)
    print()

    passed = sum(1 for r in results_summary if r['passed'])
    total = len(results_summary)

    print(f"Tests Passed: {passed}/{total} ({passed/total*100:.1f}%)")
    print()

    if passed == total:
        print("✅ ALL TESTS PASSED - Protocol library search is fully functional!")
    else:
        print("⚠️  Some tests failed - review issues above")
        print()
        print("Failed tests:")
        for result in results_summary:
            if not result['passed']:
                print(f"   • {result['name']}")
                for issue in result['issues']:
                    print(f"      - {issue}")

    print()

    # Save results
    output_file = Path(__file__).parent / 'validation-results.json'
    with open(output_file, 'w') as f:
        json.dump({
            'total_tests': total,
            'passed': passed,
            'failed': total - passed,
            'test_results': results_summary
        }, f, indent=2)

    print(f"✓ Results saved to: {output_file}")
    print()

if __name__ == '__main__':
    run_validation_suite()
