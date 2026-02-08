#!/usr/bin/env python3
"""
Schema Verification Script
==========================
Verifies that all schema changes from schema-migration.sql were applied successfully.

Usage:
    python3 verify-schema.py

Requirements:
    - .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY
    - urllib (standard library)
"""

import json
import urllib.request
import urllib.error
import os
from typing import List, Tuple

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

# Supabase configuration (from .env)
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://hpyodaugrkctagkrfofj.supabase.co')
SERVICE_KEY = os.getenv(
    'SUPABASE_SERVICE_KEY',
    'process.env.SUPABASE_SERVICE_ROLE_KEY'
)

# Expected schema changes
EXPECTED_COLUMNS = [
    'simplified_text',
    'glossary_terms',
    'reading_level_before',
    'reading_level_after',
    'language_variant'
]

EXPECTED_INDEXES = [
    'idx_language_variant',
    'idx_glossary_terms',
    'idx_reading_level_after',
    'idx_reading_level_before'
]


def check_column_exists(column_name: str) -> Tuple[bool, str]:
    """
    Check if a column exists in mio_knowledge_chunks table.

    Args:
        column_name: Name of the column to check

    Returns:
        Tuple of (exists, error_message)
    """
    url = f'{SUPABASE_URL}/rest/v1/mio_knowledge_chunks?select={column_name}&limit=1'
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json'
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            return (True, '')
    except urllib.error.HTTPError as e:
        if e.code == 400:
            return (False, 'Column does not exist')
        else:
            return (False, f'HTTP {e.code}: {e.reason}')
    except Exception as e:
        return (False, str(e))


def print_header(text: str):
    """Print a formatted header."""
    print()
    print(f"{BLUE}{'=' * 80}{RESET}")
    print(f"{BLUE}{text.center(80)}{RESET}")
    print(f"{BLUE}{'=' * 80}{RESET}")
    print()


def print_result(label: str, status: bool, detail: str = ''):
    """Print a formatted result line."""
    status_icon = f"{GREEN}✅{RESET}" if status else f"{RED}❌{RESET}"
    detail_text = f" - {detail}" if detail else ''
    print(f"{status_icon} {label}{detail_text}")


def main():
    """Main verification routine."""
    print_header("SCHEMA MIGRATION VERIFICATION")

    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Table: mio_knowledge_chunks")
    print()

    # Test connection
    print("1. Testing database connection...")
    url = f'{SUPABASE_URL}/rest/v1/mio_knowledge_chunks?select=id&limit=1'
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json'
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print_result("Database connection", True, f"Table accessible ({len(data)} sample row)")
    except Exception as e:
        print_result("Database connection", False, str(e))
        print()
        print(f"{RED}Cannot proceed without database connection. Exiting.{RESET}")
        return 1

    print()

    # Check columns
    print("2. Verifying new columns...")
    columns_passed = 0
    columns_failed = 0

    for col in EXPECTED_COLUMNS:
        exists, error = check_column_exists(col)
        if exists:
            print_result(f"Column '{col}'", True, "EXISTS")
            columns_passed += 1
        else:
            print_result(f"Column '{col}'", False, error)
            columns_failed += 1

    print()
    print(f"   Columns: {columns_passed}/{len(EXPECTED_COLUMNS)} exist")
    print()

    # Summary
    print_header("VERIFICATION SUMMARY")

    total_checks = len(EXPECTED_COLUMNS)
    total_passed = columns_passed
    total_failed = columns_failed

    print(f"Total Checks:  {total_checks}")
    print(f"Passed:        {GREEN}{total_passed}{RESET}")
    print(f"Failed:        {RED}{total_failed}{RESET}")
    print()

    # Final status
    if total_failed == 0:
        print(f"{GREEN}{'✅ SCHEMA MIGRATION COMPLETE':^80}{RESET}")
        print()
        print("All required schema changes have been applied successfully.")
        print()
        print("Next Steps:")
        print("  1. Week 4 Agent 2: Generate glossary from clinical protocols")
        print("  2. Week 4 Agent 3: Process simplified language with tooltips")
        print("  3. Week 4 Agent 4: Calculate reading levels (before/after)")
        print()
        return 0
    elif total_passed > 0:
        print(f"{YELLOW}{'⚠️  SCHEMA MIGRATION INCOMPLETE':^80}{RESET}")
        print()
        print("Some schema changes are missing. Please execute schema-migration.sql")
        print("via Supabase SQL Editor to complete the migration.")
        print()
        print(f"Migration File: glossary-extraction/schema-migration.sql")
        print(f"Supabase Dashboard: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj")
        print()
        return 1
    else:
        print(f"{RED}{'❌ SCHEMA MIGRATION NOT STARTED':^80}{RESET}")
        print()
        print("No schema changes detected. Please execute schema-migration.sql")
        print("via Supabase SQL Editor.")
        print()
        print(f"Migration File: glossary-extraction/schema-migration.sql")
        print(f"Supabase Dashboard: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj")
        print()
        return 1


if __name__ == '__main__':
    exit(main())
