// ============================================================================
// ADD SESSION 1 MENTORSHIP CONTENT TO NETTE_KNOWLEDGE_CHUNKS
// ============================================================================
// Purpose: Parse Session 1 transcript and add to nette_knowledge_chunks with embeddings
//
// Usage:
// 1. Set environment variables: SUPABASE_SERVICE_KEY, OPENAI_API_KEY
// 2. Run: npx tsx scripts/add-session1-to-nette-rag.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

if (!SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('   Set SUPABASE_SERVICE_KEY and OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SOURCE_FILE = 'Lynette Wheaton - Session 1 - Mastering the Unlicensed Group Home Business Model for Success.md';

// ============================================================================
// SESSION 1 CONTENT - Pre-chunked by topic
// ============================================================================

interface ChunkData {
  topic: string;
  category: string;
  subcategory: string;
  content: string;
  timestamp_start: string;
  timestamp_end: string;
  tactic_ids?: string[];
  priority_level: number;
}

const SESSION_1_CHUNKS: ChunkData[] = [
  {
    topic: "Mentorship Introduction & Mindset",
    category: "mentorship_training",
    subcategory: "Week 1 - Introduction",
    content: `Welcome to mentorship! Over the next six weeks, I'm going to teach you how to be successful with the unlicensed group home strategy. The information is designed for you to take action - we're going to implement everything week by week. Each lesson phases into the next.

You cannot be successful on this journey if you don't implement the things we talk about each week. Take notes, implement, ask questions. We will meet after each lesson for live Q&A.

This is NOT a get-rich-quick scheme. Everybody moves at a different pace. Stay focused on your goals. Don't think you'll become a millionaire overnight - that's not reality when building a real business. But I will give you everything you need to scale your business and reach your income goals.`,
    timestamp_start: "00:00",
    timestamp_end: "01:31",
    priority_level: 1
  },
  {
    topic: "Understanding the Unlicensed Model - Housing Only",
    category: "mentorship_training",
    subcategory: "Week 1 - Legal Foundation",
    content: `THE UNLICENSED MODEL: We provide HOUSING ONLY. We don't do any services.

As long as you provide housing only, you don't have to worry about the state coming in trying to shut you down. It's only illegal when you're providing care and services that a licensed home provides to people who need 24-hour care and supervision.

Key rules:
- House people who are able to live independently
- Semi-independent residents can have services provided by THIRD-PARTY organizations (home care, home health, hospice)
- We are NOT assisted living, NOT personal care, NOT licensed, NOT behavioral health
- No medical services, no daily care - ONLY housing
- Double room occupancy or single room - it's still only housing

The minute you start providing services, care, or bringing people who are cognitively impaired or not able to ambulate without assistance - you are operating an illegal unlicensed home.

Owner responsibilities: Manage the home, rules, cleanliness, payments
Resident responsibilities: Cooking, hygiene, cleaning, medications, all activities of daily living

This is why you don't need a license - residents manage themselves. If they need assistance, outsource it to another agency. Even if you own another business that provides services, it cannot operate under the same LLC.

This rule applies to ALL 50 STATES. Don't overcomplicate it.`,
    timestamp_start: "01:31",
    timestamp_end: "06:12",
    tactic_ids: ["M001"],
    priority_level: 1
  },
  {
    topic: "Fair Housing Act Protection",
    category: "mentorship_training",
    subcategory: "Week 1 - Legal Foundation",
    content: `THE FAIR HOUSING ACT protects people in the community against discrimination due to disabilities, mental health conditions, or people in recovery.

This protection extends to YOUR home - the unlicensed group home model. As long as individuals fall under protected class citizens, the city, HOAs, and neighbors CANNOT discriminate against your residents.

Key points:
- Understand the Fair Housing Act for yourself
- If anyone gives you grief about operating, you understand the laws protecting you and your residents
- Local laws may require zoning or permitting - just get in compliance if they exist
- If there's nothing in black and white, utilize the Fair Housing Act

IMPORTANT: Anyone wanting to tell you what you can and cannot do MUST show it to you in writing. If they can't show you the section and code, continue with your business. Hearsay does not stand up in court. Clerks at the city - if it's not written, what they say doesn't matter.`,
    timestamp_start: "07:00",
    timestamp_end: "09:08",
    tactic_ids: ["M002"],
    priority_level: 1
  },
  {
    topic: "Creating Your Compliance Binder (Peace of Mind Binder)",
    category: "mentorship_training",
    subcategory: "Week 1 - Legal Foundation",
    content: `CREATE A COMPLIANCE BINDER - Your "Peace of Mind Binder"

Include:
- State occupancy rules
- Fair Housing Act summaries
- Relevant city guidelines
- Local ordinances
- State laws
- Federal laws

Look up:
- Fair Housing Act
- Your county/city website for permitting and zoning
- Boarding homes, lodging facilities, short-term rentals, long-term rentals
- State website for homes that need licensing - highlight the definitions

If anyone comes to ask what you're doing, you have your compliance binder to support what you're doing and not doing.

"Stay ready so you ain't gotta get ready."

Nine times out of ten, as long as you're housing the right people and not bending rules, you won't have anything to worry about. If someone reports you, officials may investigate - that's just part of the process. As long as you have your compliance binder ready, you're fine.`,
    timestamp_start: "09:08",
    timestamp_end: "11:30",
    tactic_ids: ["M003"],
    priority_level: 1
  },
  {
    topic: "Resident Rights and Protecting Your Business",
    category: "mentorship_training",
    subcategory: "Week 1 - Legal Foundation",
    content: `RESIDENT RIGHTS PROTOCOL:

Your residents do NOT have to answer questions from anybody. Everyone has the right to remain silent. Nobody can go into your home and search without a warrant.

Even if city or state officials come to your home - if you have policies and procedures in place for visitors, they won't come in without you allowing them to do so.

My residents know: If somebody comes in, do not answer questions - call me. You don't want somebody speaking on behalf of your business when they don't know what's going on. One wrong answer can compromise things.

YOU are the person, YOU are the voice. Anyone wanting to ask questions or investigate - your house manager or house leader should know to NOT allow anyone in and contact you immediately.

Safeguard your business.`,
    timestamp_start: "11:30",
    timestamp_end: "13:03",
    tactic_ids: ["M004"],
    priority_level: 1
  },
  {
    topic: "Business Formation - LLC and EIN Setup",
    category: "mentorship_training",
    subcategory: "Week 1 - Business Setup",
    content: `BUSINESS FORMATION - This needs to be done this week!

1. LLC FORMATION:
   - Choose a business name
   - Check availability
   - Form the LLC on your Secretary of State website (don't use LegalZoom - save costs)
   - Look up "how to form an LLC [your state]" on YouTube for step-by-step guidance

2. EIN (Employer Identification Number):
   - Get your EIN on irs.gov - it's free

This makes you official and protects you legally.`,
    timestamp_start: "13:03",
    timestamp_end: "14:16",
    tactic_ids: ["M005"],
    priority_level: 1
  },
  {
    topic: "Professional Business Infrastructure - 7 Point Setup",
    category: "mentorship_training",
    subcategory: "Week 1 - Business Setup",
    content: `PROFESSIONAL BUSINESS INFRASTRUCTURE (7-Point Setup):

1. Domain Name - Your business name.com for professional email
   Example: info@yourbusiness.com, clientservices@yourbusiness.com

2. Business Bank Account - Keep personal and business separate

3. Merchant Account - How you'll accept payments (I use QuickBooks)

4. General Liability Insurance:
   - Go to companies with general liability policies
   - Tell them "bed and breakfast" or "social services"
   - Don't say "group home" - they don't understand and will charge more

5. Business Address - Virtual office, in-person office, or one of your group home addresses

6. Business Phone Number - Use second-line apps:
   - OpenPhone
   - Grasshopper
   - Google Voice
   - Many software options that work on your current phone

7. Professional Email - Use your domain name

When someone researches you, they need to see this is a legitimate business.`,
    timestamp_start: "14:16",
    timestamp_end: "16:14",
    tactic_ids: ["M006"],
    priority_level: 1
  },
  {
    topic: "Multi-Demographic Population Strategy",
    category: "mentorship_training",
    subcategory: "Week 1 - Population Strategy",
    content: `CHOOSE YOUR POPULATION - Cast a Wide Net

Choose based on:
- Demand in your city
- Access to referrals
- Payment consistency

You need VARIETY to be successful. Don't put yourself in a box targeting only one demographic.

I've scaled my business by having variety - I target MULTIPLE demographics to keep my referral pipeline going and never have empty beds.

Example: One veteran can file under multiple demographics:
- Seniors
- Returning citizens (prison)
- Sex-related crimes
- Mental disability
- Physical disability

My 3 qualifying criteria:
1. Cognitively aware of what's going on
2. Ambulatory (can move without assistance from me or anyone in the home)
3. Guaranteed income

I don't care if you're a senior, veteran, man, woman, or have sex-related crimes - if you meet those three boxes, we can talk.

Keep it open at first. Build relationships with everyone. Get the referral pipeline flowing. THEN you can be choosy later.

Even now, almost 5 years in, I'm still not particular about demographics. I still stand behind those 3 criteria.`,
    timestamp_start: "16:14",
    timestamp_end: "20:00",
    tactic_ids: ["M007"],
    priority_level: 1
  },
  {
    topic: "Populations to Avoid - Red Flags",
    category: "mentorship_training",
    subcategory: "Week 1 - Population Strategy",
    content: `POPULATIONS TO AVOID:

People requiring:
- Medical care
- Behavior stabilization
- 24-hour supervision

We can only serve people who are INDEPENDENT or SEMI-INDEPENDENT.

Semi-independent: People who need someone to come in for checks and balances (maybe an hour), paid by their insurance/Medicaid - NOT you, NOT your business.

BEHAVIORAL HEALTH WARNING:
If someone is manic or has severe mental health challenges - even if cognitively aware and ambulatory - if they have extreme bizarre or manic behaviors, they should NOT be in an unlicensed home. They could potentially harm themselves, others, or your neighbors.

THE RULE: If they can NEVER live alone, they're not appropriate for your home.

Example: Someone in a wheelchair with their own apartment - they're semi-independent. They may need help, but they have their own team coming in for cooking, cleaning, bathing, laundry, medication management, hair, grocery shopping, doctor appointments. That's home care services, NOT medical, NOT 24-hour. Insurance pays for it.

All you do is provide the housing.`,
    timestamp_start: "20:00",
    timestamp_end: "22:43",
    tactic_ids: ["M008"],
    priority_level: 1
  },
  {
    topic: "8 Types of Guaranteed Income Sources",
    category: "mentorship_training",
    subcategory: "Week 1 - Revenue Strategy",
    content: `GUARANTEED INCOME TYPES - Research ALL of these:

1. Social Security
2. SSI (Supplemental Security Income)
3. SSDI (Social Security Disability Insurance)
4. Retirement
5. Pension
6. Railroad benefits
7. Survivor/Spouse benefits
8. Disabled Adult Child benefits
9. Veterans benefits

Research each one to understand:
- Income range
- When they get paid
- Who qualifies

When you get a lead, you'll know their income type, how much money they have, why they're getting it, and who can get approved.

Example: SSI is for 65 years and older, US citizens, regardless of where in the country.

Social Security: Person worked for quarters (around 10 years) of work history.

When someone comes to you with no income, YOU can determine if they qualify for one of these sources and help get them on benefits.

Don't just take it from me - do your own research. Own it for yourself so you can have these conversations confidently.`,
    timestamp_start: "22:43",
    timestamp_end: "25:37",
    tactic_ids: ["M009"],
    priority_level: 1
  },
  {
    topic: "Market Research - Competitive Pricing Analysis",
    category: "mentorship_training",
    subcategory: "Week 1 - Revenue Strategy",
    content: `MARKET RESEARCH FORMULA:

Look for in your area:
- Other shared homes
- Sober living
- Supportive homes
- Room rentals

This gives you a price range so your numbers are competitive AND profitable.

How to research:
- Cold call and ask "What's your starting rate?"
- Set up scenarios: "I got a mom with X, Y, Z going on - how much to place her?"
- Get starting rates from unlicensed homes, licensed homes, nursing homes

Example: If licensed assisted living facilities charge $2,500-$3,500, ask yourself - what happens to people who can't afford that?

Base your range on:
- What's the next level UP from you
- What's the next level DOWN from you

Stay competitive. Know your target audience can afford you.`,
    timestamp_start: "25:37",
    timestamp_end: "27:02",
    tactic_ids: ["M010"],
    priority_level: 1
  },
  {
    topic: "Dual Pricing Strategy - Market Rate vs Subsidized Housing",
    category: "mentorship_training",
    subcategory: "Week 1 - Revenue Strategy",
    content: `MARKET RATE vs SUBSIDIZED RATE - My Secret Strategy

This is why I made $500,000/year with 7 homes, 47 beds, starting at $750/bed:

NOT all beds are priced the same!

MARKET RATE:
- $1,500 for shared room
- $2,000-$2,500 for private room

SUBSIDIZED RATE (low income, can't afford market):
- $750-$1,200

The Fair Housing Act talks about race, gender, disability - but NOT income. You're not discriminating or breaking laws with income determination.

My sliding scale works because:
- Not everybody pays the same
- Different rates based on verified income
- This is LEGAL and FHA compliant

Example: Someone paying $750 knows market rate is $1,500. They get a "subsidized housing voucher" to stay there. People making more money pay market rent.

Research "subsidized housing" - apartments do this all the time. They have market value, 80%, 50%, 60% rates. I duplicated that system for group homes.

As long as everyone gets the same housing, same services, same rules - you're not discriminating within the home.`,
    timestamp_start: "27:02",
    timestamp_end: "32:39",
    tactic_ids: ["M011"],
    priority_level: 1
  },
  {
    topic: "Profit Calculation Formula - Price Per Bed",
    category: "mentorship_training",
    subcategory: "Week 1 - Revenue Strategy",
    content: `PROFIT CALCULATION FORMULA:

Goal Profit + Expenses = Required Income
Required Income ÷ Number of Beds = Price Per Bed

EXAMPLE:
- Goal profit: $4,000/month
- Expenses (house, utilities, Wi-Fi, cleaning supplies): $3,500
- Required income: $7,500
- 4BR/2BA, 1600 sq ft = 8 beds
- $7,500 ÷ 8 = $938 per bed (round to $940)

Most SSI recipients get $967/month. Take $750-$800, leaving them pocket money.

Cost of Living Adjustment (COLA): Beginning of each year, everyone on government income gets an increase.

Some states pay more (NY, NJ around $1,100/month - you can charge ~$900).

THE STRATEGY:
- Calculate everything based on everyone paying $750
- At $750 each, you still profit $3,500-$4,000/month
- When people pay market rent ($1,500), everything over $750 MAXIMIZES your profit margin

This is why I can have a starting rate of $750 and still make $500K/year - the sliding scale with market rent payers increases the average.

If you want $10,000/house, you'll need to target Social Security and pension recipients instead of SSI.`,
    timestamp_start: "32:39",
    timestamp_end: "38:43",
    tactic_ids: ["M012"],
    priority_level: 1
  },
  {
    topic: "Week 1 Action Checklist and Accountability",
    category: "mentorship_training",
    subcategory: "Week 1 - Implementation",
    content: `WEEK 1 NEXT STEPS - Your Action Checklist:

1. Watch Lesson 1 as many times as needed to grasp the information

2. Post in our School community: "I just finished Lesson 1" - This is accountability!

3. Write down questions for the Q&A session

4. Complete these business formation tasks:
   □ Form your LLC
   □ Get your EIN
   □ Secure your domain name
   □ Set up professional email
   □ Open business bank account
   □ Get general liability insurance
   □ Get business address
   □ Set up business phone number

5. Research:
   □ Fair Housing Act
   □ All 8 income types
   □ Market rates in your area
   □ Subsidized housing laws

Each lesson prepares you for the next phase. Don't multitask while watching - go back and understand everything.

We have homes to open, financial freedom to chase, and income goals to meet. Maximize these 6 weeks!

See you on the next call.`,
    timestamp_start: "38:43",
    timestamp_end: "40:32",
    tactic_ids: ["M013"],
    priority_level: 1
  }
];

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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

async function main() {
  console.log('\n🚀 ADDING SESSION 1 MENTORSHIP CONTENT TO NETTE_KNOWLEDGE_CHUNKS\n');
  console.log('═'.repeat(70));

  // Check if chunks already exist
  console.log('\n📋 Checking for existing Session 1 chunks...');
  const { data: existing, error: checkError } = await supabase
    .from('nette_knowledge_chunks')
    .select('id, source_file')
    .ilike('source_file', '%Session 1%');

  if (checkError) {
    console.error('❌ Error checking existing chunks:', checkError.message);
  } else if (existing && existing.length > 0) {
    console.log(`⚠️  Found ${existing.length} existing Session 1 chunks. Deleting them first...`);

    const { error: deleteError } = await supabase
      .from('nette_knowledge_chunks')
      .delete()
      .ilike('source_file', '%Session 1%');

    if (deleteError) {
      console.error('❌ Error deleting existing chunks:', deleteError.message);
      process.exit(1);
    }
    console.log('✅ Existing chunks deleted');
  } else {
    console.log('✅ No existing Session 1 chunks found');
  }

  console.log(`\n📚 Processing ${SESSION_1_CHUNKS.length} chunks...\n`);

  let processed = 0;
  let errors = 0;

  for (const chunk of SESSION_1_CHUNKS) {
    try {
      console.log(`   Processing: ${chunk.topic.substring(0, 50)}...`);

      // Generate embedding
      const embedding = await generateEmbedding(chunk.content);

      // Prepare the record
      const record = {
        source_file: SOURCE_FILE,
        chunk_number: processed + 1,
        chunk_text: chunk.content,
        chunk_summary: chunk.topic,
        category: chunk.category,
        subcategory: chunk.subcategory,
        week_number: 1,
        tactic_id: chunk.tactic_ids ? chunk.tactic_ids[0] : null,
        tactic_category: 'Mentorship Week 1',
        tokens_approx: Math.ceil(chunk.content.length / 4),
        priority_level: chunk.priority_level,
        embedding: `[${embedding.join(',')}]`,
        is_active: true,
        version: '1.0'
      };

      // Insert to database
      const { error: insertError } = await supabase
        .from('nette_knowledge_chunks')
        .insert(record);

      if (insertError) {
        console.error(`   ❌ Error inserting: ${insertError.message}`);
        errors++;
      } else {
        processed++;
        console.log(`   ✅ Chunk ${processed}/${SESSION_1_CHUNKS.length} inserted`);
      }

      // Rate limit for OpenAI
      await sleep(350);

    } catch (error) {
      console.error(`   ❌ Error processing chunk:`, error);
      errors++;
    }
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  console.log('\n═'.repeat(70));
  console.log('\n✅ SESSION 1 CONTENT ADDED TO NETTE_KNOWLEDGE_CHUNKS!\n');
  console.log('📊 RESULTS:');
  console.log(`   • Chunks processed: ${processed}/${SESSION_1_CHUNKS.length}`);
  console.log(`   • Errors: ${errors}`);
  console.log(`   • Source: ${SOURCE_FILE}`);
  console.log('\n🎉 Nette AI can now answer questions about Week 1 Mentorship content!');
  console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
