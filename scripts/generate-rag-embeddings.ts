// ============================================================================
// RAG KNOWLEDGE BASE - EMBEDDING GENERATION SCRIPT
// ============================================================================
// Purpose: Parse all training materials and generate embeddings for Nette, MIO, ME AI agents
// 
// Usage:
// 1. Set environment variables: SUPABASE_SERVICE_KEY, OPENAI_API_KEY
// 2. Run: npx tsx scripts/generate-rag-embeddings.ts
//
// Files Processed:
// - GROUP-HOME-TACTICS-LIBRARY.md (403 tactics → Nette AI)
// - Group Home Q&A sessions x3 (Q&A pairs → Nette AI)
// - Group Home Webinars x3 (Training content → Nette AI)
// - The Lynette Story (Narrative → Nette AI)
// - Financing content (→ ME AI, extracted from above)
// - PROTECT methodology (→ MIO AI, from existing mio_knowledge_chunks)
//
// Expected Output: ~1,500-2,000 total chunks across all agents
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Chunking configuration
const MAX_CHUNK_TOKENS = 500; // ~375 words
const OVERLAP_TOKENS = 50; // Context overlap between chunks

// ============================================================================
// OPENAI EMBEDDING GENERATION
// ============================================================================

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  const data = await response.json();
  return data.data[0].embedding;
}

// Rate limiting helper
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TACTICS LIBRARY PARSER (403 tactics → Nette AI)
// ============================================================================

interface TacticChunk {
  source_file: string;
  chunk_number: number;
  chunk_text: string;
  category: string;
  subcategory: string;
  week_number?: number;
  tactic_id?: string;
  tactic_category?: string;
  target_demographics?: string[];
  tokens_approx: number;
  priority_level: number;
}

function parseTacticsLibrary(content: string): TacticChunk[] {
  const chunks: TacticChunk[] = [];
  const lines = content.split('\n');
  
  let currentCategory = '';
  let currentSubcategory = '';
  let weekNumber = 1;
  let chunkNumber = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect main category (## CATEGORY X:)
    if (line.match(/^##\s+CATEGORY\s+\d+:/i)) {
      currentCategory = line.replace(/^##\s+CATEGORY\s+\d+:\s*/i, '').trim();
      
      // Extract week number from category
      const weekMatch = currentCategory.match(/Week[s]?\s+(\d+)[-–]?(\d+)?/i);
      if (weekMatch) {
        weekNumber = parseInt(weekMatch[1]);
      }
      continue;
    }
    
    // Detect subcategory (###)
    if (line.match(/^###\s+/)) {
      currentSubcategory = line.replace(/^###\s+/, '').trim();
      continue;
    }
    
    // Detect tactic (- **T###**: Description)
    const tacticMatch = line.match(/^-\s+\*\*(T\d{3})\*\*:\s+(.+)/);
    if (tacticMatch) {
      const [, tacticId, description] = tacticMatch;
      
      chunks.push({
        source_file: 'GROUP-HOME-TACTICS-LIBRARY.md',
        chunk_number: ++chunkNumber,
        chunk_text: `${tacticId}: ${description}\n\nCategory: ${currentCategory}\nSubcategory: ${currentSubcategory}`,
        category: 'tactic',
        subcategory: currentSubcategory,
        week_number: weekNumber,
        tactic_id: tacticId,
        tactic_category: currentCategory,
        tokens_approx: Math.ceil((description.length + currentCategory.length) / 4),
        priority_level: 1 // Tactics are high priority
      });
    }
  }
  
  console.log(`   ✅ Parsed ${chunks.length} tactics`);
  return chunks;
}

// ============================================================================
// Q&A SESSION PARSER (Conversational Q&A → Nette AI)
// ============================================================================

function parseQASession(content: string, filename: string): TacticChunk[] {
  const chunks: TacticChunk[] = [];
  const lines = content.split('\n');
  
  let currentChunk = '';
  let chunkNumber = 0;
  let lineBuffer: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    lineBuffer.push(line);
    
    // Create chunk every ~400-500 tokens (semantic breaks at questions)
    const estimatedTokens = lineBuffer.join(' ').length / 4;
    
    if (estimatedTokens >= 400 || i === lines.length - 1) {
      const chunkText = lineBuffer.join('\n');
      
      // Extract questions (usually start with capital letter followed by "?")
      const questions = chunkText.match(/[A-Z][^?.!]*\?/g) || [];
      const mainQuestion = questions[0] || 'General Q&A';
      
      chunks.push({
        source_file: filename,
        chunk_number: ++chunkNumber,
        chunk_text: chunkText,
        category: 'qa_session',
        subcategory: mainQuestion.substring(0, 100),
        tokens_approx: Math.ceil(estimatedTokens),
        priority_level: 2
      });
      
      // Keep last 50 tokens for context overlap
      const overlapLines = lineBuffer.slice(-10);
      lineBuffer = overlapLines;
    }
  }
  
  console.log(`   ✅ Parsed ${chunks.length} Q&A chunks from ${filename}`);
  return chunks;
}

// ============================================================================
// WEBINAR PARSER (Training sessions → Nette AI)
// ============================================================================

function parseWebinar(content: string, filename: string): TacticChunk[] {
  const chunks: TacticChunk[] = [];
  const lines = content.split('\n');
  
  let currentSection: string[] = [];
  let chunkNumber = 0;
  let currentTopic = 'General Training';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Detect section breaks (speaker changes, topic shifts)
    const isSpeakerChange = line.match(/^\[Speaker \d+\]/) || line.match(/^[A-Z][a-z]+:/);
    const isTopicMarker = line.match(/^(All right|Okay|So|Now)/i) && line.length < 100;
    
    currentSection.push(line);
    
    // Chunk at natural breaks
    const estimatedTokens = currentSection.join(' ').length / 4;
    
    if ((estimatedTokens >= 450 && (isSpeakerChange || isTopicMarker)) || i === lines.length - 1) {
      const chunkText = currentSection.join('\n');
      
      // Try to extract topic from first meaningful sentence
      const firstSentence = currentSection.find(l => l.length > 50 && !l.match(/^\[Speaker/));
      if (firstSentence) {
        currentTopic = firstSentence.substring(0, 100);
      }
      
      chunks.push({
        source_file: filename,
        chunk_number: ++chunkNumber,
        chunk_text: chunkText,
        category: 'webinar_training',
        subcategory: currentTopic,
        tokens_approx: Math.ceil(estimatedTokens),
        priority_level: 2
      });
      
      // Keep overlap
      currentSection = currentSection.slice(-8);
    }
  }
  
  console.log(`   ✅ Parsed ${chunks.length} webinar chunks from ${filename}`);
  return chunks;
}

// ============================================================================
// LYNETTE STORY PARSER (Narrative → Nette AI)
// ============================================================================

function parseLynetteStory(content: string): TacticChunk[] {
  const chunks: TacticChunk[] = [];
  const lines = content.split('\n');
  
  let currentStory: string[] = [];
  let chunkNumber = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    currentStory.push(line);
    
    const estimatedTokens = currentStory.join(' ').length / 4;
    
    // Chunk at story breaks or token limit
    if (estimatedTokens >= 400 || i === lines.length - 1) {
      const chunkText = currentStory.join('\n');
      const storyArc = currentStory[0].substring(0, 100);
      
      chunks.push({
        source_file: 'The_Lynette_Story_7_19_2024.md',
        chunk_number: ++chunkNumber,
        chunk_text: chunkText,
        category: 'success_story',
        subcategory: storyArc,
        tokens_approx: Math.ceil(estimatedTokens),
        priority_level: 3
      });
      
      currentStory = currentStory.slice(-8);
    }
  }
  
  console.log(`   ✅ Parsed ${chunks.length} story chunks`);
  return chunks;
}

// ============================================================================
// FINANCING CONTENT EXTRACTOR (→ ME AI)
// ============================================================================

function extractFinancingChunks(allChunks: TacticChunk[]): any[] {
  const financingKeywords = [
    'financing', 'funding', 'capital', 'money', 'roi', 'cash flow',
    'investment', 'loan', 'credit', 'seller finance', 'subject-to',
    'creative financing', 'wholesale', 'rental arbitrage', 'purchase',
    'down payment', 'startup cost', 'budget', 'revenue', 'profit'
  ];
  
  const meChunks = allChunks
    .filter(chunk => {
      const text = chunk.chunk_text.toLowerCase();
      return financingKeywords.some(keyword => text.includes(keyword));
    })
    .map((chunk, index) => ({
      source_file: chunk.source_file,
      chunk_number: index + 1,
      chunk_text: chunk.chunk_text,
      category: 'financing_strategy',
      subcategory: chunk.subcategory,
      financing_type: detectFinancingType(chunk.chunk_text),
      capital_range: detectCapitalRange(chunk.chunk_text),
      tokens_approx: chunk.tokens_approx,
      priority_level: 2
    }));
  
  console.log(`   ✅ Extracted ${meChunks.length} financing chunks for ME AI`);
  return meChunks;
}

function detectFinancingType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('seller finance')) return 'seller_finance';
  if (lower.includes('subject-to') || lower.includes('subject to')) return 'subject_to';
  if (lower.includes('creative financing')) return 'creative_financing';
  if (lower.includes('rental arbitrage')) return 'rental_arbitrage';
  if (lower.includes('wholesale')) return 'wholesale';
  if (lower.includes('conventional') || lower.includes('bank loan')) return 'conventional';
  return 'general';
}

function detectCapitalRange(text: string): string {
  const amounts = text.match(/\$[\d,]+k?/g);
  if (!amounts) return 'unknown';
  
  const maxAmount = Math.max(...amounts.map(a => {
    const num = parseInt(a.replace(/[$,k]/g, ''));
    return a.includes('k') ? num * 1000 : num;
  }));
  
  if (maxAmount < 10000) return '$0-10k';
  if (maxAmount < 50000) return '$10k-50k';
  if (maxAmount < 100000) return '$50k-100k';
  return '$100k+';
}

// ============================================================================
// MAIN PROCESSING PIPELINE
// ============================================================================

async function main() {
  console.log('\n🚀 STARTING RAG KNOWLEDGE BASE GENERATION\n');
  console.log('═'.repeat(70));
  
  const uploadsDir = path.join(__dirname, '../user-uploads');
  
  // ============================================================================
  // STEP 1: Parse all files
  // ============================================================================
  
  console.log('\n📚 STEP 1: PARSING ALL TRAINING MATERIALS\n');
  
  // Parse Tactics Library
  console.log('1️⃣  Parsing Tactics Library...');
  const tacticsContent = fs.readFileSync(path.join(uploadsDir, 'GROUP-HOME-TACTICS-LIBRARY.md'), 'utf-8');
  const tacticsChunks = parseTacticsLibrary(tacticsContent);
  
  // Parse Q&A Sessions
  console.log('\n2️⃣  Parsing Q&A Sessions...');
  const qaFiles = [
    'Group_Home_for_newbies_Q_A_5_20_25.md',
    'Group_home_for_Newbies_Q_A_7_4_25.md'
  ];
  const qaChunks = qaFiles.flatMap(file => {
    const content = fs.readFileSync(path.join(uploadsDir, file), 'utf-8');
    return parseQASession(content, file);
  });
  
  // Parse Webinars
  console.log('\n3️⃣  Parsing Webinar Trainings...');
  const webinarFiles = [
    'Group_Home_Webinar_recording_8_13_25.md',
    'Group_home_webinar_recording_9_11_25.md',
    'Goup_home_Newbies_training_7_22_25.md'
  ];
  const webinarChunks = webinarFiles.flatMap(file => {
    const content = fs.readFileSync(path.join(uploadsDir, file), 'utf-8');
    return parseWebinar(content, file);
  });
  
  // Parse Lynette Story
  console.log('\n4️⃣  Parsing The Lynette Story...');
  const storyContent = fs.readFileSync(path.join(uploadsDir, 'The_Lynette_Story_7_19_2024.md'), 'utf-8');
  const storyChunks = parseLynetteStory(storyContent);
  
  // Combine all Nette chunks
  const allNetteChunks = [...tacticsChunks, ...qaChunks, ...webinarChunks, ...storyChunks];
  
  // Extract ME AI financing chunks
  console.log('\n5️⃣  Extracting Financing Content for ME AI...');
  const meChunks = extractFinancingChunks(allNetteChunks);
  
  console.log('\n📊 PARSING SUMMARY:');
  console.log(`   • Nette AI: ${allNetteChunks.length} chunks`);
  console.log(`   • ME AI: ${meChunks.length} chunks`);
  console.log(`   • Total: ${allNetteChunks.length + meChunks.length} chunks`);
  
  // ============================================================================
  // STEP 2: Generate embeddings and insert to database
  // ============================================================================
  
  console.log('\n═'.repeat(70));
  console.log('\n🧠 STEP 2: GENERATING EMBEDDINGS & INSERTING TO DATABASE\n');
  
  let netteProcessed = 0;
  let meProcessed = 0;
  let errors = 0;
  
  // Process Nette AI chunks
  console.log('🔵 Processing Nette AI chunks...\n');
  for (const chunk of allNetteChunks) {
    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk.chunk_text);
      
      // Insert to database
      const { error } = await supabase
        .from('nette_knowledge_chunks')
        .insert({
          source_file: chunk.source_file,
          chunk_number: chunk.chunk_number,
          chunk_text: chunk.chunk_text,
          category: chunk.category,
          subcategory: chunk.subcategory,
          week_number: chunk.week_number,
          tactic_id: chunk.tactic_id,
          tactic_category: chunk.tactic_category,
          target_demographics: chunk.target_demographics,
          tokens_approx: chunk.tokens_approx,
          priority_level: chunk.priority_level,
          embedding: `[${embedding.join(',')}]`,
          is_active: true,
          version: '1.0'
        });
      
      if (error) {
        console.error(`   ❌ Error inserting Nette chunk ${chunk.chunk_number}: ${error.message}`);
        errors++;
      } else {
        netteProcessed++;
        if (netteProcessed % 50 === 0) {
          console.log(`   ✅ ${netteProcessed}/${allNetteChunks.length} Nette chunks processed`);
        }
      }
      
      // Rate limit: 3 requests per second for OpenAI
      await sleep(350);
      
    } catch (error) {
      console.error(`   ❌ Error processing Nette chunk ${chunk.chunk_number}:`, error);
      errors++;
    }
  }
  
  // Process ME AI chunks
  console.log(`\n💰 Processing ME AI chunks...\n`);
  for (const chunk of meChunks) {
    try {
      const embedding = await generateEmbedding(chunk.chunk_text);
      
      const { error } = await supabase
        .from('me_knowledge_chunks')
        .insert({
          source_file: chunk.source_file,
          chunk_number: chunk.chunk_number,
          chunk_text: chunk.chunk_text,
          category: chunk.category,
          subcategory: chunk.subcategory,
          financing_type: chunk.financing_type,
          capital_range: chunk.capital_range,
          tokens_approx: chunk.tokens_approx,
          priority_level: chunk.priority_level,
          embedding: `[${embedding.join(',')}]`,
          is_active: true,
          version: '1.0'
        });
      
      if (error) {
        console.error(`   ❌ Error inserting ME chunk ${chunk.chunk_number}: ${error.message}`);
        errors++;
      } else {
        meProcessed++;
        if (meProcessed % 20 === 0) {
          console.log(`   ✅ ${meProcessed}/${meChunks.length} ME chunks processed`);
        }
      }
      
      await sleep(350);
      
    } catch (error) {
      console.error(`   ❌ Error processing ME chunk ${chunk.chunk_number}:`, error);
      errors++;
    }
  }
  
  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  
  console.log('\n═'.repeat(70));
  console.log('\n✅ RAG KNOWLEDGE BASE GENERATION COMPLETE!\n');
  console.log('📊 FINAL STATISTICS:');
  console.log(`   • Nette AI: ${netteProcessed}/${allNetteChunks.length} chunks inserted`);
  console.log(`   • ME AI: ${meProcessed}/${meChunks.length} chunks inserted`);
  console.log(`   • Total Successful: ${netteProcessed + meProcessed}`);
  console.log(`   • Errors: ${errors}`);
  console.log('\n🎉 All agents are now RAG-powered!');
  console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
