#!/usr/bin/env python3
"""
Pre-flight check for embedding generation script.
Verifies all prerequisites are met before running.
"""

import sys
import os
from pathlib import Path

print("=" * 70)
print("EMBEDDING GENERATION - PRE-FLIGHT CHECK")
print("=" * 70)
print()

all_checks_passed = True

# Check 1: Python version
print("1. Checking Python version...")
version = sys.version_info
if version.major >= 3 and version.minor >= 8:
    print(f"   ✓ Python {version.major}.{version.minor}.{version.micro}")
else:
    print(f"   ✗ Python {version.major}.{version.minor}.{version.micro} (requires 3.8+)")
    all_checks_passed = False
print()

# Check 2: Required packages
print("2. Checking required packages...")
required_packages = {
    'openai': 'OpenAI API client',
    'json': 'JSON handling (built-in)',
    'pathlib': 'Path operations (built-in)'
}

for package, description in required_packages.items():
    try:
        __import__(package)
        print(f"   ✓ {package} - {description}")
    except ImportError:
        print(f"   ✗ {package} - {description} (NOT INSTALLED)")
        if package == 'openai':
            print(f"      Install with: pip install openai")
            all_checks_passed = False
print()

# Check 3: Optional packages
print("3. Checking optional packages...")
optional_packages = {
    'dotenv': '.env file loading'
}

for package, description in optional_packages.items():
    try:
        __import__(package)
        print(f"   ✓ {package} - {description}")
    except ImportError:
        print(f"   ⚠ {package} - {description} (optional, will use env vars)")
print()

# Check 4: Input files
print("4. Checking input files...")
output_dir = Path(__file__).parent / "output"
input_files = [
    "daily-deductible-parsed.json",
    "neural-rewiring-parsed.json",
    "research-protocols-parsed.json"
]

for filename in input_files:
    filepath = output_dir / filename
    if filepath.exists():
        size = filepath.stat().st_size
        print(f"   ✓ {filename} ({size:,} bytes)")
    else:
        print(f"   ✗ {filename} (NOT FOUND)")
        all_checks_passed = False
print()

# Check 5: OpenAI API key
print("5. Checking OpenAI API key...")

# Try loading from .env
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

api_key = os.environ.get('OPENAI_API_KEY')
if api_key:
    masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
    print(f"   ✓ OPENAI_API_KEY found ({masked_key})")
else:
    print(f"   ✗ OPENAI_API_KEY not set")
    print(f"      Set in .env file or export it:")
    print(f"      export OPENAI_API_KEY=sk-proj-your-key-here")
    all_checks_passed = False
print()

# Check 6: Output directory writable
print("6. Checking output directory...")
if output_dir.exists() and os.access(output_dir, os.W_OK):
    print(f"   ✓ {output_dir} (writable)")
else:
    print(f"   ✗ {output_dir} (not writable)")
    all_checks_passed = False
print()

# Summary
print("=" * 70)
print("SUMMARY")
print("=" * 70)

if all_checks_passed:
    print("✓ All checks passed! Ready to generate embeddings.")
    print()
    print("Run the script with:")
    print("  python3 generate_embeddings.py")
    print()
    print("Expected:")
    print("  - Processing time: 2-3 minutes")
    print("  - Cost: ~$0.001 (less than 1 cent)")
    print("  - Output: 205 protocols with 1536-dim embeddings")
else:
    print("✗ Some checks failed. Please fix the issues above before running.")
    print()
    print("Common fixes:")
    print("  - Install OpenAI: pip install openai")
    print("  - Set API key in .env file")
    print("  - Verify input files exist in output/ directory")

print("=" * 70)

sys.exit(0 if all_checks_passed else 1)
