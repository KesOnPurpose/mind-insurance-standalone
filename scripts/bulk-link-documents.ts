// Bulk Document-Tactic Linking Script
// Intelligent matching with confidence scoring and auto-approval

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { findMatchingTactics, groupByConfidenceLevel, type TacticInfo } from './intelligent-matcher';
import type { GHDocument } from '../src/types/documents';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DocumentTacticLink {
  document_id: number;
  tactic_id: string;
  link_type: 'required' | 'recommended' | 'supplemental';
  display_order: number;
}

interface LinkingStats {
  totalDocuments: number;
  totalTactics: number;
  totalLinksCreated: number;
  highConfidenceLinks: number;
  mediumConfidenceLinks: number;
  lowConfidenceLinks: number;
  requiredLinks: number;
  recommendedLinks: number;
  supplementalLinks: number;
  errors: number;
}

/**
 * Main execution function
 */
async function bulkLinkDocuments() {
  console.log('🚀 Starting Bulk Document-Tactic Linking');
  console.log('=========================================\n');

  const stats: LinkingStats = {
    totalDocuments: 0,
    totalTactics: 0,
    totalLinksCreated: 0,
    highConfidenceLinks: 0,
    mediumConfidenceLinks: 0,
    lowConfidenceLinks: 0,
    requiredLinks: 0,
    recommendedLinks: 0,
    supplementalLinks: 0,
    errors: 0,
  };

  try {
    // Step 1: Fetch all documents
    console.log('📄 Fetching documents from gh_documents...');
    const { data: documents, error: docsError } = await supabase
      .from('gh_documents')
      .select('*')
      .order('created_at', { ascending: true });

    if (docsError) {
      throw new Error(`Failed to fetch documents: ${docsError.message}`);
    }

    if (!documents || documents.length === 0) {
      console.log('⚠️  No documents found in database');
      return;
    }

    stats.totalDocuments = documents.length;
    console.log(`✅ Found ${documents.length} documents\n`);

    // Step 2: Fetch all tactics
    console.log('🎯 Fetching tactics from gh_tactic_instructions...');
    const { data: tactics, error: tacticsError } = await supabase
      .from('gh_tactic_instructions')
      .select('tactic_id, tactic_name, category, parent_category, week_assignment, why_it_matters')
      .order('week_assignment', { ascending: true });

    if (tacticsError) {
      throw new Error(`Failed to fetch tactics: ${tacticsError.message}`);
    }

    if (!tactics || tactics.length === 0) {
      console.log('⚠️  No tactics found in database');
      return;
    }

    stats.totalTactics = tactics.length;
    console.log(`✅ Found ${tactics.length} tactics\n`);

    // Step 3: Apply intelligent matching
    console.log('🧠 Running intelligent matching algorithm...');
    console.log('-------------------------------------------');

    const allLinks: DocumentTacticLink[] = [];
    const reviewQueue: any[] = [];

    for (const document of documents as GHDocument[]) {
      console.log(`\n📋 Processing: ${document.document_name}`);
      console.log(`   Category: ${document.category}`);

      // Find matching tactics
      const matches = findMatchingTactics(document, tactics as TacticInfo[]);

      if (matches.length === 0) {
        console.log('   ⚠️  No matches found (confidence < 50%)');
        continue;
      }

      // Group by confidence
      const grouped = groupByConfidenceLevel(matches);

      console.log(`   ✅ Found ${matches.length} potential matches:`);
      console.log(`      - High confidence (≥85%): ${grouped.highConfidence.length}`);
      console.log(`      - Medium confidence (70-84%): ${grouped.mediumConfidence.length}`);
      console.log(`      - Low confidence (50-69%): ${grouped.lowConfidence.length}`);

      // Auto-approve high and medium confidence matches
      const autoApprove = [...grouped.highConfidence, ...grouped.mediumConfidence];

      for (let i = 0; i < autoApprove.length; i++) {
        const match = autoApprove[i];
        allLinks.push({
          document_id: document.id,
          tactic_id: match.tacticId,
          link_type: match.linkType,
          display_order: i + 1,
        });

        if (match.confidence >= 70) {
          stats.highConfidenceLinks++;
        } else {
          stats.mediumConfidenceLinks++;
        }

        if (match.linkType === 'required') stats.requiredLinks++;
        else if (match.linkType === 'recommended') stats.recommendedLinks++;
        else stats.supplementalLinks++;

        console.log(`      ✓ AUTO-LINKED: ${match.tacticName} (${match.confidence}% confidence, ${match.linkType})`);
      }

      // Add low confidence to review queue for manual approval
      for (const match of grouped.lowConfidence) {
        reviewQueue.push({
          document_id: document.id,
          document_name: document.document_name,
          tactic_id: match.tacticId,
          tactic_name: match.tacticName,
          confidence: match.confidence,
          suggested_link_type: match.linkType,
          match_reasons: match.matchReasons.join(' | '),
        });

        console.log(`      ⏸  REVIEW QUEUE: ${match.tacticName} (${match.confidence}% confidence)`);
      }

      // Log low confidence for reference only
      if (grouped.lowConfidence.length > 0) {
        console.log(`      ⓘ  ${grouped.lowConfidence.length} low-confidence matches (not linked)`);
      }
    }

    // Step 4: Check existing links to avoid duplicates
    console.log('\n\n🔍 Checking for existing links...');
    const { data: existingLinks, error: existingError } = await supabase
      .from('gh_document_tactic_links')
      .select('document_id, tactic_id');

    if (existingError) {
      console.warn('⚠️  Warning: Could not fetch existing links:', existingError.message);
    }

    const existingSet = new Set(
      (existingLinks || []).map(link => `${link.document_id}-${link.tactic_id}`)
    );

    const newLinks = allLinks.filter(link => {
      const key = `${link.document_id}-${link.tactic_id}`;
      return !existingSet.has(key);
    });

    console.log(`   Found ${existingLinks?.length || 0} existing links`);
    console.log(`   ${allLinks.length - newLinks.length} duplicates will be skipped`);
    console.log(`   ${newLinks.length} new links will be created\n`);

    // Step 5: Bulk insert new links
    if (newLinks.length > 0) {
      console.log('💾 Inserting new links into database...');

      const { data: insertedLinks, error: insertError } = await supabase
        .from('gh_document_tactic_links')
        .insert(newLinks)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert links: ${insertError.message}`);
      }

      stats.totalLinksCreated = insertedLinks?.length || 0;
      console.log(`✅ Successfully created ${stats.totalLinksCreated} links\n`);
    } else {
      console.log('ℹ️  No new links to create (all matches already exist)\n');
    }

    // Step 6: Export review queue to CSV
    if (reviewQueue.length > 0) {
      console.log('📊 Exporting review queue to CSV...');
      const csvPath = path.join(__dirname, 'review-queue.csv');

      const csvHeader = 'Document ID,Document Name,Tactic ID,Tactic Name,Confidence,Suggested Link Type,Match Reasons\n';
      const csvRows = reviewQueue.map(item =>
        `${item.document_id},"${item.document_name}",${item.tactic_id},"${item.tactic_name}",${item.confidence},${item.suggested_link_type},"${item.match_reasons}"`
      ).join('\n');

      fs.writeFileSync(csvPath, csvHeader + csvRows);
      console.log(`✅ Review queue exported to: ${csvPath}`);
      console.log(`   ${reviewQueue.length} medium-confidence matches require manual review\n`);
    }

    // Step 7: Print final statistics
    console.log('\n\n📊 FINAL STATISTICS');
    console.log('===================');
    console.log(`Total Documents Processed: ${stats.totalDocuments}`);
    console.log(`Total Tactics Available: ${stats.totalTactics}`);
    console.log(`\nLinks Created:`);
    console.log(`  - Total: ${stats.totalLinksCreated}`);
    console.log(`  - Required: ${stats.requiredLinks}`);
    console.log(`  - Recommended: ${stats.recommendedLinks}`);
    console.log(`  - Supplemental: ${stats.supplementalLinks}`);
    console.log(`\nConfidence Breakdown:`);
    console.log(`  - High Confidence (≥85%): ${stats.highConfidenceLinks} auto-approved`);
    console.log(`  - Medium Confidence (70-84%): ${reviewQueue.length} pending review`);
    console.log(`\nAverage Links per Document: ${(stats.totalLinksCreated / stats.totalDocuments).toFixed(1)}`);

    console.log('\n\n✅ Bulk linking completed successfully!');

    if (reviewQueue.length > 0) {
      console.log(`\n⚠️  Next step: Review ${reviewQueue.length} medium-confidence matches in review-queue.csv`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error instanceof Error ? error.message : String(error));
    stats.errors++;
    process.exit(1);
  }
}

// Execute the script
bulkLinkDocuments();
