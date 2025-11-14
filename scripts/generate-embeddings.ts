// Knowledge Base Import Script - Generate Embeddings for MIO Intelligence
// Run this once to populate mio_knowledge_chunks with protocols, avatars, and practices

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Generate embeddings using OpenAI
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

// Parse neural rewiring protocols
function parseProtocols(content: string) {
  const chunks = [];
  const protocols = content.split('###').filter(p => p.trim());
  
  for (const protocol of protocols) {
    const lines = protocol.split('\n');
    const title = lines[0].trim();
    
    // Extract pattern and temperament from title
    const match = title.match(/(\w+)\s*\+\s*(\w+)/i);
    if (!match) continue;
    
    const [_, pattern, temperament] = match;
    
    // Split into practices
    const practices = protocol.split('#### Practice').filter(p => p.trim());
    
    for (let i = 0; i < practices.length; i++) {
      const practice = practices[i];
      if (!practice.trim()) continue;
      
      chunks.push({
        source_file: 'neural_rewiring_protocols.txt',
        chunk_text: practice,
        category: 'protocol',
        subcategory: pattern.toLowerCase(),
        applicable_patterns: [pattern.toLowerCase()],
        applicable_practice_types: ['R', 'O'], // Reinforce Identity, Outcome
        chunk_number: i + 1,
        tokens_approx: Math.ceil(practice.length / 4),
        protocol_ids: [`${pattern}_${temperament}`.toLowerCase()],
        priority_level: 1
      });
    }
  }
  
  return chunks;
}

// Parse avatar library
function parseAvatars(content: string) {
  const chunks = [];
  const avatars = content.split('## AVATAR').filter(a => a.trim());
  
  for (let i = 0; i < avatars.length; i++) {
    const avatar = avatars[i];
    const lines = avatar.split('\n');
    const titleLine = lines.find(l => l.includes(':'));
    if (!titleLine) continue;
    
    const title = titleLine.replace(/\d+:/, '').trim();
    
    // Extract pattern from avatar text
    const patternMatch = avatar.match(/Primary Pattern.*?:\s*(\w+\s*\w*)/i);
    const temperamentMatch = avatar.match(/Temperament.*?:\s*(\w+)/i);
    
    const pattern = patternMatch ? patternMatch[1].toLowerCase().replace(/\s+/g, '_') : 'unknown';
    const temperament = temperamentMatch ? temperamentMatch[1].toLowerCase() : 'unknown';
    
    chunks.push({
      source_file: 'avatar_library.txt',
      chunk_text: avatar,
      category: 'avatar_narrative',
      subcategory: title.toLowerCase().replace(/\s+/g, '_'),
      applicable_patterns: [pattern],
      applicable_contexts: [temperament],
      chunk_number: i + 1,
      tokens_approx: Math.ceil(avatar.length / 4),
      priority_level: 2
    });
  }
  
  return chunks;
}

// Parse daily deductible practices
function parsePractices(content: string) {
  const chunks = [];
  const practices = content.split('####').filter(p => p.trim());
  
  for (let i = 0; i < practices.length; i++) {
    const practice = practices[i];
    const lines = practice.split('\n');
    const title = lines[0].replace(/\*\*/g, '').trim();
    
    // Extract blocker types from practice content
    const blockerTypes = [];
    if (practice.match(/procrastinat/i)) blockerTypes.push('procrastination');
    if (practice.match(/anxiety|stress|overwhelm/i)) blockerTypes.push('anxiety');
    if (practice.match(/energy|depletion|burnout/i)) blockerTypes.push('energy_crash');
    if (practice.match(/identity|self-worth/i)) blockerTypes.push('identity_collision');
    if (practice.match(/focus|distraction/i)) blockerTypes.push('focus_issues');
    if (practice.match(/comparison/i)) blockerTypes.push('comparison');
    if (practice.match(/motivation/i)) blockerTypes.push('motivation_collapse');
    
    chunks.push({
      source_file: 'daily_deductible_library.md',
      chunk_text: practice,
      category: 'practice_instruction',
      subcategory: title.toLowerCase().replace(/\s+/g, '_'),
      applicable_practice_types: ['P', 'R', 'O', 'T', 'E', 'C', 'T2'], // All PROTECT practices
      chunk_number: i + 1,
      tokens_approx: Math.ceil(practice.length / 4),
      priority_level: 1,
      // Store blocker types in metadata for filtering
      metadata: { blocker_types: blockerTypes }
    });
  }
  
  return chunks;
}

async function main() {
  console.log('🚀 Starting knowledge base import...\n');
  
  // Read files from user-uploads directory
  const protocolsPath = path.join(__dirname, '../user-uploads/neural_rewiring_protocols.txt');
  const avatarsPath = path.join(__dirname, '../user-uploads/avatar_library.txt');
  const practicesPath = path.join(__dirname, '../user-uploads/📚_Daily_Deductible_Library_Complete_Practice_Collection.md');
  
  const protocolsContent = fs.readFileSync(protocolsPath, 'utf-8');
  const avatarsContent = fs.readFileSync(avatarsPath, 'utf-8');
  const practicesContent = fs.readFileSync(practicesPath, 'utf-8');
  
  // Parse all content
  console.log('📚 Parsing protocols...');
  const protocolChunks = parseProtocols(protocolsContent);
  console.log(`   ✅ Parsed ${protocolChunks.length} protocol chunks\n`);
  
  console.log('👤 Parsing avatars...');
  const avatarChunks = parseAvatars(avatarsContent);
  console.log(`   ✅ Parsed ${avatarChunks.length} avatar chunks\n`);
  
  console.log('🛠️  Parsing practices...');
  const practiceChunks = parsePractices(practicesContent);
  console.log(`   ✅ Parsed ${practiceChunks.length} practice chunks\n`);
  
  const allChunks = [...protocolChunks, ...avatarChunks, ...practiceChunks];
  
  // Generate embeddings and insert
  console.log('🧠 Generating embeddings and inserting to database...\n');
  let processed = 0;
  
  for (const chunk of allChunks) {
    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk.chunk_text);
      
      // Insert to database
      const { error } = await supabase
        .from('mio_knowledge_chunks')
        .insert({
          ...chunk,
          embedding: `[${embedding.join(',')}]`,
          file_number: 1,
          is_active: true,
          version: '1.0',
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`   ❌ Error inserting chunk: ${error.message}`);
      } else {
        processed++;
        console.log(`   ✅ ${processed}/${allChunks.length} - ${chunk.category} - ${chunk.subcategory}`);
      }
      
      // Rate limit: 3 requests per second for OpenAI
      await new Promise(resolve => setTimeout(resolve, 350));
      
    } catch (error) {
      console.error(`   ❌ Error processing chunk: ${error}`);
    }
  }
  
  console.log(`\n🎉 Import complete! Processed ${processed}/${allChunks.length} chunks`);
  console.log('   MIO knowledge base is ready for intelligent coaching! 🧠');
}

main().catch(console.error);
