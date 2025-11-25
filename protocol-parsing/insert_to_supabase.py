#!/usr/bin/env python3
"""
MIO Protocol Database Insertion - Week 2 Day 6
Batch insert 205 protocols with embeddings into Supabase mio_knowledge_chunks table

Usage:
    # Dry run (validation only, no insert)
    python3 insert_to_supabase.py --dry-run

    # Full insertion
    SUPABASE_SERVICE_KEY=your_key python3 insert_to_supabase.py

    # With batch size override
    python3 insert_to_supabase.py --batch-size 25

Environment Variables Required:
    SUPABASE_SERVICE_KEY - Service role key for database access
"""

import os
import sys
import json
import argparse
import time
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

# Supabase client
try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Error: supabase-py not installed")
    print("   Install with: pip install supabase")
    sys.exit(1)


# Configuration
SUPABASE_URL = "https://hpyodaugrkctagkrfofj.supabase.co"
TABLE_NAME = "mio_knowledge_chunks"
DEFAULT_BATCH_SIZE = 50
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

# Expected embedding dimension
EXPECTED_EMBEDDING_DIM = 1536

# Input file path
INPUT_FILE = Path(__file__).parent / "output" / "all-protocols-with-embeddings.json"


class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(text: str):
    """Print formatted header"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'=' * 60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{text}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 60}{Colors.ENDC}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")


def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")


def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")


def print_info(text: str):
    """Print info message"""
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.ENDC}")


def get_supabase_client() -> Optional[Client]:
    """
    Initialize Supabase client with service role key
    Returns None if credentials missing
    """
    service_key = os.getenv('SUPABASE_SERVICE_KEY')

    if not service_key:
        print_error("SUPABASE_SERVICE_KEY environment variable not set")
        print_info("Set it with: export SUPABASE_SERVICE_KEY=your_key_here")
        print_info("Or: SUPABASE_SERVICE_KEY=your_key python3 insert_to_supabase.py")
        return None

    try:
        client = create_client(SUPABASE_URL, service_key)
        print_success(f"Connected to Supabase: {SUPABASE_URL}")
        return client
    except Exception as e:
        print_error(f"Failed to connect to Supabase: {e}")
        return None


def load_protocols(file_path: Path) -> Optional[List[Dict[str, Any]]]:
    """
    Load protocols from JSON file
    Returns None if file not found or invalid JSON
    """
    if not file_path.exists():
        print_error(f"Input file not found: {file_path}")
        print_info("Expected location: protocol-parsing/output/all-protocols-with-embeddings.json")
        print_info("This file should be created by the parallel embedding generation task")
        return None

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            protocols = json.load(f)

        if not isinstance(protocols, list):
            print_error(f"Invalid JSON format: expected list, got {type(protocols)}")
            return None

        print_success(f"Loaded {len(protocols)} protocols from {file_path.name}")
        return protocols

    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON in {file_path.name}: {e}")
        return None
    except Exception as e:
        print_error(f"Error reading {file_path.name}: {e}")
        return None


def validate_protocol(protocol: Dict[str, Any], index: int) -> Tuple[bool, Optional[str]]:
    """
    Validate a single protocol record
    Returns: (is_valid, error_message)
    """
    # Required fields
    required_fields = ['source_file', 'chunk_text']
    for field in required_fields:
        if field not in protocol or not protocol[field]:
            return False, f"Missing required field: {field}"

    # Validate embedding if present
    if 'embedding' in protocol:
        embedding = protocol['embedding']

        # Check if embedding is a list
        if not isinstance(embedding, list):
            return False, f"Embedding must be a list, got {type(embedding)}"

        # Check embedding dimension
        if len(embedding) != EXPECTED_EMBEDDING_DIM:
            return False, f"Invalid embedding dimension: {len(embedding)} (expected {EXPECTED_EMBEDDING_DIM})"

        # Check if all values are floats/numbers
        if not all(isinstance(x, (int, float)) for x in embedding):
            return False, "Embedding contains non-numeric values"
    else:
        return False, "Missing embedding field"

    # Validate difficulty_level if present
    if 'difficulty_level' in protocol and protocol['difficulty_level']:
        valid_levels = ['beginner', 'intermediate', 'advanced']
        if protocol['difficulty_level'] not in valid_levels:
            return False, f"Invalid difficulty_level: {protocol['difficulty_level']} (must be one of {valid_levels})"

    # Validate array fields
    array_fields = ['applicable_patterns', 'temperament_match', 'state_created']
    for field in array_fields:
        if field in protocol and protocol[field] is not None:
            if not isinstance(protocol[field], list):
                return False, f"Field {field} must be an array, got {type(protocol[field])}"

    # Validate time commitment fields
    if 'time_commitment_min' in protocol and protocol['time_commitment_min'] is not None:
        if not isinstance(protocol['time_commitment_min'], int):
            return False, f"time_commitment_min must be an integer"

    if 'time_commitment_max' in protocol and protocol['time_commitment_max'] is not None:
        if not isinstance(protocol['time_commitment_max'], int):
            return False, f"time_commitment_max must be an integer"

    return True, None


def validate_all_protocols(protocols: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Validate all protocols
    Returns: (all_valid, error_list)
    """
    print_header("Validating Protocol Data")

    errors = []
    protocols_with_embeddings = 0

    for i, protocol in enumerate(protocols):
        is_valid, error = validate_protocol(protocol, i)

        if not is_valid:
            errors.append(f"Protocol {i + 1} ({protocol.get('source_file', 'unknown')}): {error}")

        if 'embedding' in protocol and protocol['embedding']:
            protocols_with_embeddings += 1

    # Summary
    print(f"Total protocols: {len(protocols)}")
    print(f"Protocols with embeddings: {protocols_with_embeddings}")
    print(f"Protocols without embeddings: {len(protocols) - protocols_with_embeddings}")

    if errors:
        print_warning(f"Found {len(errors)} validation errors")
        return False, errors
    else:
        print_success("All protocols passed validation")
        return True, []


def transform_protocol_to_db_record(protocol: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform protocol JSON to database record format
    Maps JSON fields to database schema
    """
    # Calculate token approximation (4 characters per token)
    chunk_text = protocol.get('chunk_text', '')
    tokens_approx = len(chunk_text) // 4 if chunk_text else 0

    return {
        'source_file': protocol['source_file'],
        'file_number': protocol.get('file_number'),
        'chunk_number': protocol.get('chunk_number'),
        'chunk_text': chunk_text,
        'chunk_summary': protocol.get('chunk_summary'),
        'embedding': protocol['embedding'],  # vector(1536)
        'category': protocol.get('category'),
        'applicable_patterns': protocol.get('applicable_patterns', []),
        'temperament_match': protocol.get('temperament_match', []),
        'time_commitment_min': protocol.get('time_commitment_min'),
        'time_commitment_max': protocol.get('time_commitment_max'),
        'difficulty_level': protocol.get('difficulty_level'),
        'state_created': protocol.get('state_created', []),
        'tokens_approx': tokens_approx
    }


def insert_batch(
    client: Client,
    batch: List[Dict[str, Any]],
    batch_num: int,
    total_batches: int,
    retry_count: int = 0
) -> Tuple[bool, Optional[str]]:
    """
    Insert a single batch of records
    Returns: (success, error_message)
    """
    try:
        # Transform protocols to database records
        db_records = [transform_protocol_to_db_record(p) for p in batch]

        # Insert batch using upsert (to handle duplicates)
        # Note: Supabase upsert requires a unique constraint
        # We'll use insert for now and handle duplicates at validation level
        result = client.table(TABLE_NAME).insert(db_records).execute()

        print_success(f"Batch {batch_num}/{total_batches}: Inserted {len(batch)} records")
        return True, None

    except Exception as e:
        error_msg = str(e)

        # Retry logic
        if retry_count < MAX_RETRIES:
            print_warning(f"Batch {batch_num}/{total_batches} failed: {error_msg}")
            print_info(f"Retrying in {RETRY_DELAY}s... (attempt {retry_count + 1}/{MAX_RETRIES})")
            time.sleep(RETRY_DELAY)
            return insert_batch(client, batch, batch_num, total_batches, retry_count + 1)
        else:
            print_error(f"Batch {batch_num}/{total_batches} failed after {MAX_RETRIES} retries: {error_msg}")
            return False, error_msg


def insert_protocols(
    client: Client,
    protocols: List[Dict[str, Any]],
    batch_size: int = DEFAULT_BATCH_SIZE,
    dry_run: bool = False
) -> Dict[str, Any]:
    """
    Insert all protocols in batches
    Returns statistics dictionary
    """
    print_header("Database Insertion")

    if dry_run:
        print_warning("DRY RUN MODE - No records will be inserted")

    total_protocols = len(protocols)
    total_batches = (total_protocols + batch_size - 1) // batch_size

    print(f"Total protocols: {total_protocols}")
    print(f"Batch size: {batch_size}")
    print(f"Total batches: {total_batches}")
    print()

    stats = {
        'total_protocols': total_protocols,
        'total_batches': total_batches,
        'successful_batches': 0,
        'failed_batches': 0,
        'successful_inserts': 0,
        'failed_inserts': 0,
        'start_time': time.time(),
        'batch_times': [],
        'failed_records': []
    }

    if dry_run:
        print_success("Dry run validation complete - ready for insertion")
        return stats

    # Process batches
    for i in range(0, total_protocols, batch_size):
        batch_num = (i // batch_size) + 1
        batch = protocols[i:i + batch_size]

        batch_start = time.time()
        success, error = insert_batch(client, batch, batch_num, total_batches)
        batch_time = time.time() - batch_start

        stats['batch_times'].append(batch_time)

        if success:
            stats['successful_batches'] += 1
            stats['successful_inserts'] += len(batch)
        else:
            stats['failed_batches'] += 1
            stats['failed_inserts'] += len(batch)

            # Log failed records
            for protocol in batch:
                stats['failed_records'].append({
                    'source_file': protocol.get('source_file', 'unknown'),
                    'chunk_number': protocol.get('chunk_number'),
                    'error': error
                })

        # Progress indicator
        progress = (batch_num / total_batches) * 100
        print(f"Progress: {progress:.1f}% ({stats['successful_inserts']} inserted)")

    stats['end_time'] = time.time()
    stats['total_time'] = stats['end_time'] - stats['start_time']

    return stats


def verify_insertion(client: Client, expected_count: int) -> bool:
    """
    Verify records were inserted correctly
    """
    print_header("Verification")

    try:
        # Count total records
        result = client.table(TABLE_NAME).select("id", count='exact').execute()
        actual_count = result.count

        print(f"Expected records: {expected_count}")
        print(f"Actual records in database: {actual_count}")

        if actual_count >= expected_count:
            print_success("Record count verification passed")
        else:
            print_warning(f"Record count mismatch: expected {expected_count}, got {actual_count}")
            return False

        # Test vector search capability
        print("\nTesting vector search capability...")
        test_embedding = [0.0] * EXPECTED_EMBEDDING_DIM  # Dummy embedding for testing

        # Note: This requires a custom RPC function 'search_mio_knowledge' to be created
        # For now, we'll just test basic select with embedding field
        result = client.table(TABLE_NAME).select("id, source_file, embedding").limit(1).execute()

        if result.data and len(result.data) > 0:
            record = result.data[0]
            if 'embedding' in record and record['embedding']:
                embedding_len = len(record['embedding'])
                if embedding_len == EXPECTED_EMBEDDING_DIM:
                    print_success(f"Embedding dimension verified: {embedding_len}")
                else:
                    print_warning(f"Embedding dimension mismatch: {embedding_len} (expected {EXPECTED_EMBEDDING_DIM})")
            else:
                print_warning("Embedding field is empty")
        else:
            print_warning("No records found to verify embeddings")

        return True

    except Exception as e:
        print_error(f"Verification failed: {e}")
        return False


def run_test_queries(client: Client):
    """
    Run sample test queries to demonstrate functionality
    """
    print_header("Test Queries")

    try:
        # Test 1: Select protocols by category
        print("Test 1: Select protocols by category 'traditional-foundation'")
        result = client.table(TABLE_NAME).select("id, source_file, category, chunk_summary").eq(
            'category', 'traditional-foundation'
        ).limit(5).execute()

        if result.data:
            print_success(f"Found {len(result.data)} protocols in 'traditional-foundation' category")
            for record in result.data[:3]:
                print(f"   - {record.get('chunk_summary', 'No summary')}")
        else:
            print_info("No records found for this category")

        # Test 2: Filter by difficulty level
        print("\nTest 2: Select 'beginner' level protocols")
        result = client.table(TABLE_NAME).select("id, chunk_summary, difficulty_level").eq(
            'difficulty_level', 'beginner'
        ).limit(5).execute()

        if result.data:
            print_success(f"Found {len(result.data)} beginner-level protocols")
        else:
            print_info("No beginner-level protocols found")

        # Test 3: Filter by time commitment
        print("\nTest 3: Select protocols with time commitment <= 10 minutes")
        result = client.table(TABLE_NAME).select("id, chunk_summary, time_commitment_max").lte(
            'time_commitment_max', 10
        ).limit(5).execute()

        if result.data:
            print_success(f"Found {len(result.data)} quick protocols (<=10 min)")
        else:
            print_info("No quick protocols found")

        # Test 4: Search by pattern (using contains)
        print("\nTest 4: Search for protocols applicable to 'past_prison' pattern")
        result = client.table(TABLE_NAME).select("id, chunk_summary, applicable_patterns").contains(
            'applicable_patterns', ['past_prison']
        ).limit(5).execute()

        if result.data:
            print_success(f"Found {len(result.data)} protocols for 'past_prison' pattern")
        else:
            print_info("No protocols found for this pattern")

        print_success("Test queries completed")

    except Exception as e:
        print_error(f"Test queries failed: {e}")


def save_failed_records(failed_records: List[Dict[str, Any]], output_dir: Path):
    """Save failed records to JSON file for manual review"""
    if not failed_records:
        return

    failed_file = output_dir / f"failed-insertions-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"

    try:
        with open(failed_file, 'w', encoding='utf-8') as f:
            json.dump(failed_records, f, indent=2)

        print_warning(f"Failed records saved to: {failed_file}")
    except Exception as e:
        print_error(f"Could not save failed records: {e}")


def print_stats_summary(stats: Dict[str, Any]):
    """Print insertion statistics summary"""
    print_header("Insertion Summary")

    print(f"Total protocols: {stats['total_protocols']}")
    print(f"Successful inserts: {stats['successful_inserts']}")
    print(f"Failed inserts: {stats['failed_inserts']}")
    print(f"Successful batches: {stats['successful_batches']}/{stats['total_batches']}")

    if 'total_time' in stats and stats['total_time'] > 0:
        print(f"\nExecution time: {stats['total_time']:.2f} seconds")
        print(f"Average time per batch: {sum(stats['batch_times']) / len(stats['batch_times']):.2f} seconds")
        print(f"Records per second: {stats['successful_inserts'] / stats['total_time']:.2f}")

    if stats['failed_inserts'] > 0:
        print_warning(f"\n⚠️  {stats['failed_inserts']} records failed to insert")
        print_info("Check failed-insertions-*.json for details")
    else:
        print_success("\n✅ All records inserted successfully!")


def main():
    """Main execution flow"""
    parser = argparse.ArgumentParser(
        description='Insert MIO protocols with embeddings into Supabase',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run (validation only)
  python3 insert_to_supabase.py --dry-run

  # Full insertion
  SUPABASE_SERVICE_KEY=your_key python3 insert_to_supabase.py

  # Custom batch size
  python3 insert_to_supabase.py --batch-size 25

  # Skip verification
  python3 insert_to_supabase.py --no-verify
        """
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Validate data without inserting to database'
    )

    parser.add_argument(
        '--batch-size',
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help=f'Number of records per batch (default: {DEFAULT_BATCH_SIZE})'
    )

    parser.add_argument(
        '--no-verify',
        action='store_true',
        help='Skip verification after insertion'
    )

    parser.add_argument(
        '--no-test-queries',
        action='store_true',
        help='Skip test queries after insertion'
    )

    parser.add_argument(
        '--input-file',
        type=Path,
        default=INPUT_FILE,
        help='Path to input JSON file with embeddings'
    )

    args = parser.parse_args()

    # Print header
    print_header("MIO Protocol Database Insertion - Week 2 Day 6")

    # Step 1: Initialize Supabase client (not needed for dry run)
    client = None
    if not args.dry_run:
        client = get_supabase_client()
        if not client:
            print_error("Cannot proceed without Supabase credentials")
            sys.exit(1)

    # Step 2: Load protocols
    protocols = load_protocols(args.input_file)
    if not protocols:
        print_error("Cannot proceed without protocol data")
        sys.exit(1)

    # Step 3: Validate protocols
    is_valid, errors = validate_all_protocols(protocols)
    if not is_valid:
        print_error(f"Validation failed with {len(errors)} errors:")
        for error in errors[:10]:  # Show first 10 errors
            print(f"   - {error}")
        if len(errors) > 10:
            print(f"   ... and {len(errors) - 10} more errors")
        sys.exit(1)

    # Step 4: Insert protocols
    stats = insert_protocols(client, protocols, batch_size=args.batch_size, dry_run=args.dry_run)

    if args.dry_run:
        print_success("\nDry run complete - ready for Day 6 execution!")
        print_info(f"Command to run: SUPABASE_SERVICE_KEY=your_key python3 {sys.argv[0]}")
        sys.exit(0)

    # Step 5: Save failed records if any
    if stats['failed_records']:
        save_failed_records(stats['failed_records'], args.input_file.parent)

    # Step 6: Print statistics
    print_stats_summary(stats)

    # Step 7: Verify insertion
    if not args.no_verify and stats['successful_inserts'] > 0:
        verify_insertion(client, stats['successful_inserts'])

    # Step 8: Run test queries
    if not args.no_test_queries and stats['successful_inserts'] > 0:
        run_test_queries(client)

    # Final status
    print_header("Status")
    if stats['failed_inserts'] == 0:
        print_success("✅ Day 6 database insertion COMPLETE!")
        print_success("✅ Ready for MIO chatbot integration (Week 3)")
        print_info(f"Database: {SUPABASE_URL}")
        print_info(f"Table: {TABLE_NAME}")
        print_info(f"Total records: {stats['successful_inserts']}")
    else:
        print_warning("⚠️  Insertion completed with errors")
        print_info(f"Successful: {stats['successful_inserts']}/{stats['total_protocols']}")
        print_info("Review failed-insertions-*.json and retry")
        sys.exit(1)


if __name__ == '__main__':
    main()
