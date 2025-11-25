#!/usr/bin/env python3
"""
OpenAI Embedding Generation for MIO Protocol Library
Week 2 Day 5 - Vector Embeddings for Semantic Search

Processes 205 parsed protocols from 3 JSON files and generates embeddings.
Uses text-embedding-3-small model with batch processing.

Usage:
    python3 generate_embeddings.py
    OPENAI_API_KEY=sk-... python3 generate_embeddings.py
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Any

try:
    from openai import OpenAI
except ImportError:
    print("ERROR: openai package not installed")
    print("Install with: pip install openai")
    sys.exit(1)

# Try to load from .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    # Look for .env in parent directory (mindhouse-prodigy/)
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass  # python-dotenv not installed, that's ok


# Configuration
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
INPUT_FILES = [
    OUTPUT_DIR / "daily-deductible-parsed.json",
    OUTPUT_DIR / "neural-rewiring-parsed.json",
    OUTPUT_DIR / "research-protocols-parsed.json"
]
OUTPUT_FILE = OUTPUT_DIR / "all-protocols-with-embeddings.json"

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
BATCH_SIZE = 100  # OpenAI allows up to 2048 inputs per batch
MAX_TOKENS = 8000  # Use chunk_summary if chunk_text exceeds this


def load_protocols() -> List[Dict[str, Any]]:
    """Load and combine all 3 protocol JSON files."""
    print("Loading protocol files...")
    all_protocols = []

    for file_path in INPUT_FILES:
        if not file_path.exists():
            print(f"ERROR: File not found: {file_path}")
            sys.exit(1)

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

            # Handle both array format and object with protocols key
            if isinstance(data, list):
                protocols = data
            elif isinstance(data, dict) and 'protocols' in data:
                protocols = data['protocols']
            else:
                print(f"ERROR: Unexpected format in {file_path.name}")
                sys.exit(1)

            all_protocols.extend(protocols)
            print(f"  Loaded {len(protocols)} protocols from {file_path.name}")

    print(f"Total protocols loaded: {len(all_protocols)}")
    return all_protocols


def prepare_embedding_text(protocol: Dict[str, Any]) -> str:
    """
    Prepare text for embedding with metadata context.
    Uses chunk_text as primary content, falls back to chunk_summary if too long.
    Adds metadata to improve semantic matching.
    """
    # Extract fields
    chunk_text = protocol.get('chunk_text', '')
    chunk_summary = protocol.get('chunk_summary', '')
    category = protocol.get('category', '')
    patterns = protocol.get('applicable_patterns', [])
    temperament = protocol.get('temperament_match', [])

    # Estimate tokens (rough: 1 token ≈ 4 chars)
    estimated_tokens = len(chunk_text) / 4

    # Use chunk_summary if chunk_text is too long
    main_content = chunk_text if estimated_tokens < MAX_TOKENS else chunk_summary

    # Build enriched text with metadata
    metadata_parts = []

    if chunk_summary:
        metadata_parts.append(f"Title: {chunk_summary}")

    if category:
        metadata_parts.append(f"Category: {category}")

    if patterns:
        patterns_str = ", ".join(patterns)
        metadata_parts.append(f"Patterns: {patterns_str}")

    if temperament:
        temp_str = ", ".join(temperament)
        metadata_parts.append(f"Temperament: {temp_str}")

    # Combine metadata + main content
    metadata_header = "\n".join(metadata_parts)
    embedding_text = f"{metadata_header}\n\n{main_content}"

    return embedding_text


def generate_embeddings_batch(
    client: OpenAI,
    texts: List[str],
    batch_num: int,
    total_batches: int
) -> tuple[List[List[float]], int]:
    """
    Generate embeddings for a batch of texts with retry logic.
    Returns: (embeddings, token_count)
    """
    max_retries = 5
    base_delay = 2

    for attempt in range(max_retries):
        try:
            print(f"  Processing batch {batch_num}/{total_batches} ({len(texts)} texts)...", end=' ')

            response = client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=texts,
                dimensions=EMBEDDING_DIMENSIONS
            )

            embeddings = [item.embedding for item in response.data]
            token_count = response.usage.total_tokens

            print(f"✓ ({token_count} tokens)")
            return embeddings, token_count

        except Exception as e:
            error_msg = str(e)

            # Handle rate limit (429) with exponential backoff
            if "429" in error_msg or "rate_limit" in error_msg.lower():
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"⚠ Rate limit, retrying in {delay}s...")
                    time.sleep(delay)
                    continue
                else:
                    print(f"✗ Failed after {max_retries} retries")
                    raise
            else:
                print(f"✗ Error: {error_msg}")
                raise

    raise Exception("Max retries exceeded")


def generate_all_embeddings(protocols: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], int, float]:
    """
    Generate embeddings for all protocols with batch processing.
    Returns: (protocols_with_embeddings, total_tokens, total_cost)
    """
    # Check for API key
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("ERROR: OPENAI_API_KEY environment variable not set")
        print("Set it with: export OPENAI_API_KEY=sk-...")
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    # Prepare all embedding texts
    print("\nPreparing texts for embedding...")
    embedding_texts = []
    for protocol in protocols:
        text = prepare_embedding_text(protocol)
        embedding_texts.append(text)

    # Calculate batches
    total_protocols = len(protocols)
    num_batches = (total_protocols + BATCH_SIZE - 1) // BATCH_SIZE

    print(f"Processing {total_protocols} protocols in {num_batches} batches of {BATCH_SIZE}")
    print(f"Model: {EMBEDDING_MODEL} (dimensions: {EMBEDDING_DIMENSIONS})\n")

    # Process batches
    all_embeddings = []
    total_tokens = 0

    for batch_num in range(num_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, total_protocols)
        batch_texts = embedding_texts[start_idx:end_idx]

        batch_embeddings, batch_tokens = generate_embeddings_batch(
            client, batch_texts, batch_num + 1, num_batches
        )

        all_embeddings.extend(batch_embeddings)
        total_tokens += batch_tokens

        # Small delay between batches to avoid rate limits
        if batch_num < num_batches - 1:
            time.sleep(0.5)

    # Calculate cost ($0.020 per 1M tokens for text-embedding-3-small)
    cost_per_million = 0.020
    total_cost = (total_tokens / 1_000_000) * cost_per_million

    # Add embeddings to protocols
    print("\nAdding embeddings to protocol data...")
    protocols_with_embeddings = []

    for protocol, embedding in zip(protocols, all_embeddings):
        protocol_copy = protocol.copy()
        protocol_copy['embedding'] = embedding
        protocol_copy['embedding_model'] = EMBEDDING_MODEL
        protocol_copy['embedding_dimensions'] = EMBEDDING_DIMENSIONS
        protocols_with_embeddings.append(protocol_copy)

    return protocols_with_embeddings, total_tokens, total_cost


def validate_embeddings(protocols: List[Dict[str, Any]]) -> bool:
    """Validate that all protocols have valid embeddings."""
    print("\nValidating embeddings...")

    issues = []

    for i, protocol in enumerate(protocols):
        if 'embedding' not in protocol:
            issues.append(f"Protocol {i}: Missing embedding field")
            continue

        embedding = protocol['embedding']

        if not isinstance(embedding, list):
            issues.append(f"Protocol {i}: Embedding is not a list")
            continue

        if len(embedding) != EMBEDDING_DIMENSIONS:
            issues.append(f"Protocol {i}: Wrong dimension ({len(embedding)} != {EMBEDDING_DIMENSIONS})")
            continue

        # Check for null/NaN values
        if any(x is None or (isinstance(x, float) and x != x) for x in embedding):
            issues.append(f"Protocol {i}: Contains null/NaN values")
            continue

        # Check that values are floats
        if not all(isinstance(x, (int, float)) for x in embedding):
            issues.append(f"Protocol {i}: Contains non-numeric values")

    if issues:
        print("✗ Validation failed:")
        for issue in issues[:10]:  # Show first 10 issues
            print(f"  - {issue}")
        if len(issues) > 10:
            print(f"  ... and {len(issues) - 10} more issues")
        return False

    print(f"✓ All {len(protocols)} protocols have valid embeddings")
    return True


def save_output(protocols: List[Dict[str, Any]]) -> int:
    """Save protocols with embeddings to JSON file."""
    print(f"\nSaving to {OUTPUT_FILE.name}...")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(protocols, f, indent=2, ensure_ascii=False)

    file_size = OUTPUT_FILE.stat().st_size
    print(f"✓ Saved {len(protocols)} protocols ({file_size:,} bytes)")

    return file_size


def get_sample_embedding(protocols: List[Dict[str, Any]]) -> List[float]:
    """Get first 10 values of first protocol's embedding."""
    if protocols and 'embedding' in protocols[0]:
        return protocols[0]['embedding'][:10]
    return []


def main():
    """Main execution flow."""
    print("=" * 70)
    print("MIO Protocol Library - OpenAI Embedding Generation")
    print("Week 2 Day 5 - Vector Embeddings for Semantic Search")
    print("=" * 70)

    # Load protocols
    protocols = load_protocols()

    # Generate embeddings
    protocols_with_embeddings, total_tokens, total_cost = generate_all_embeddings(protocols)

    # Validate
    if not validate_embeddings(protocols_with_embeddings):
        print("\n✗ Validation failed. Aborting.")
        sys.exit(1)

    # Save output
    file_size = save_output(protocols_with_embeddings)

    # Get sample embedding
    sample = get_sample_embedding(protocols_with_embeddings)

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Script Path:        {__file__}")
    print(f"Total Protocols:    {len(protocols_with_embeddings)}")
    print(f"Total Tokens Used:  {total_tokens:,}")
    print(f"Total Cost:         ${total_cost:.4f}")
    print(f"Output File:        {OUTPUT_FILE}")
    print(f"Output File Size:   {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")
    print(f"\nSample Embedding (first 10 values):")
    print(f"  {sample}")
    print("\n✓ Embedding generation complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
