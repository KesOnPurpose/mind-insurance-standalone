#!/usr/bin/env python3
"""
Run database migration to add glossary columns
"""

import os
import requests
from dotenv import load_dotenv

# Load environment
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Read SQL
with open('add-glossary-columns.sql', 'r') as f:
    sql = f.read()

print("="*80)
print("DATABASE MIGRATION: Add Glossary Columns")
print("="*80)
print()
print("This migration adds the following columns to mio_knowledge_chunks:")
print("  - simplified_text (TEXT)")
print("  - glossary_terms (JSONB)")
print("  - reading_level_before (FLOAT)")
print("  - reading_level_after (FLOAT)")
print("  - language_variant (VARCHAR(20))")
print()
print("="*80)
print()

# The Supabase Python client doesn't support direct SQL execution
# We need to use the SQL Editor in the Supabase Dashboard

print("MANUAL MIGRATION REQUIRED")
print()
print("Please follow these steps:")
print()
print("1. Go to Supabase SQL Editor:")
print(f"   https://supabase.com/dashboard/project/{SUPABASE_URL.split('//')[1].split('.')[0]}/sql/new")
print()
print("2. Copy and paste the following SQL:")
print()
print("-" * 80)
print(sql)
print("-" * 80)
print()
print("3. Click 'Run' to execute the migration")
print()
print("4. Verify the columns were added by running:")
print("   SELECT column_name FROM information_schema.columns")
print("   WHERE table_name = 'mio_knowledge_chunks'")
print("   AND column_name IN ('simplified_text', 'glossary_terms', 'reading_level_before', 'reading_level_after', 'language_variant');")
print()
print("5. After successful migration, re-run: python3 execute-week-4-agent-2.py")
print()
print("="*80)

# Save SQL to separate file for easy copying
print()
print("SQL has been saved to: add-glossary-columns.sql")
print("You can also copy it from there.")
print()
