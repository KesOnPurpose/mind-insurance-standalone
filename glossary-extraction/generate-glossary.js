/**
 * Neuroscience Glossary Generator
 * Transforms clinical neuroscience terms into 8th-grade level explanations
 * Uses Claude API for AI-powered simplification
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory's .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Validate API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY not found in environment variables');
  console.error('   Please ensure .env file exists in parent directory with ANTHROPIC_API_KEY');
  process.exit(1);
}

console.log('✅ Anthropic API key loaded successfully');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Core neuroscience terms to transform
 * Organized by category for better structure
 */
const NEUROSCIENCE_TERMS = {
  brain_structures: [
    {
      term: "amygdala",
      clinical_definition: "Almond-shaped structure in the limbic system responsible for processing emotions, particularly fear and threat detection. Part of the brain's survival mechanisms."
    },
    {
      term: "prefrontal cortex",
      clinical_definition: "The anterior part of the frontal lobes, responsible for executive functions including decision-making, planning, impulse control, and emotional regulation."
    },
    {
      term: "hippocampus",
      clinical_definition: "A seahorse-shaped structure in the medial temporal lobe crucial for memory formation, consolidation, and spatial navigation."
    },
    {
      term: "basal ganglia",
      clinical_definition: "A group of subcortical nuclei involved in motor control, procedural learning, habit formation, and reward processing."
    },
    {
      term: "anterior cingulate cortex",
      clinical_definition: "Brain region involved in error detection, conflict monitoring, emotional regulation, and decision-making under uncertainty."
    },
    {
      term: "insula",
      clinical_definition: "Cortical structure involved in interoception (sensing internal body states), emotional awareness, and subjective feelings."
    },
    {
      term: "thalamus",
      clinical_definition: "Relay station that processes and transmits sensory and motor signals to the cerebral cortex, also involved in consciousness and alertness."
    },
    {
      term: "hypothalamus",
      clinical_definition: "Small brain region that regulates homeostasis, including hunger, thirst, body temperature, sleep-wake cycles, and hormone release."
    },
    {
      term: "cerebellum",
      clinical_definition: "Brain structure primarily responsible for motor coordination, balance, precision, and timing of movements, also involved in some cognitive functions."
    },
    {
      term: "brainstem",
      clinical_definition: "The posterior part of the brain connecting to the spinal cord, controlling vital functions like breathing, heart rate, and consciousness."
    }
  ],

  neurochemicals: [
    {
      term: "dopamine",
      clinical_definition: "Neurotransmitter involved in reward processing, motivation, pleasure, motor control, and reinforcement learning. Dysregulation linked to addiction and Parkinson's disease."
    },
    {
      term: "serotonin",
      clinical_definition: "Neurotransmitter that regulates mood, appetite, sleep, memory, and social behavior. Low levels associated with depression and anxiety disorders."
    },
    {
      term: "cortisol",
      clinical_definition: "Stress hormone released by the adrenal glands that increases blood sugar, suppresses immune system, and aids metabolism. Chronic elevation causes health problems."
    },
    {
      term: "oxytocin",
      clinical_definition: "Neuropeptide hormone involved in social bonding, trust, empathy, childbirth, and lactation. Sometimes called the 'bonding hormone' or 'love hormone'."
    },
    {
      term: "norepinephrine",
      clinical_definition: "Neurotransmitter and hormone that increases alertness, arousal, and attention. Part of the fight-or-flight stress response system."
    },
    {
      term: "GABA",
      clinical_definition: "Gamma-aminobutyric acid, the primary inhibitory neurotransmitter that reduces neuronal excitability and promotes calmness and relaxation."
    },
    {
      term: "glutamate",
      clinical_definition: "The most abundant excitatory neurotransmitter in the nervous system, crucial for learning, memory, and neural plasticity."
    },
    {
      term: "endorphins",
      clinical_definition: "Endogenous opioid peptides that function as neurotransmitters, producing pain relief and feelings of pleasure or euphoria during exercise or stress."
    },
    {
      term: "acetylcholine",
      clinical_definition: "Neurotransmitter involved in muscle activation, attention, learning, memory, and arousal. Reduced levels associated with Alzheimer's disease."
    },
    {
      term: "adrenaline",
      clinical_definition: "Hormone and neurotransmitter (also called epinephrine) that triggers fight-or-flight response, increasing heart rate, blood pressure, and energy availability."
    }
  ],

  neural_processes: [
    {
      term: "neuroplasticity",
      clinical_definition: "The brain's ability to reorganize itself by forming new neural connections throughout life in response to learning, experience, or injury."
    },
    {
      term: "neural pathways",
      clinical_definition: "Networks of interconnected neurons that transmit information throughout the nervous system, strengthened through repeated activation."
    },
    {
      term: "synaptic pruning",
      clinical_definition: "Process of eliminating weak or unused neural connections while strengthening frequently used ones, optimizing brain efficiency."
    },
    {
      term: "long-term potentiation",
      clinical_definition: "Persistent strengthening of synapses based on recent patterns of activity, underlying learning and memory formation at the cellular level."
    },
    {
      term: "myelination",
      clinical_definition: "Formation of myelin sheath around nerve fibers, increasing the speed and efficiency of neural signal transmission."
    },
    {
      term: "action potential",
      clinical_definition: "Rapid electrical signal that travels along a neuron's axon when the neuron is activated, enabling communication between neurons."
    },
    {
      term: "neurotransmission",
      clinical_definition: "Process by which chemical messengers (neurotransmitters) cross synapses to transmit signals from one neuron to another."
    },
    {
      term: "habituation",
      clinical_definition: "Decreased response to a stimulus after repeated exposure, representing the simplest form of learning and adaptive behavior."
    },
    {
      term: "sensitization",
      clinical_definition: "Increased response to a stimulus after repeated or intense exposure, often involving emotional or threatening stimuli."
    },
    {
      term: "neurogenesis",
      clinical_definition: "The birth of new neurons in the brain, occurring throughout life primarily in the hippocampus and influencing learning and mood."
    }
  ],

  cognitive_processes: [
    {
      term: "cognitive dissonance",
      clinical_definition: "Mental discomfort experienced when holding two or more contradictory beliefs, values, or attitudes simultaneously, motivating attitude change."
    },
    {
      term: "working memory",
      clinical_definition: "Limited-capacity system for temporarily holding and manipulating information in mind for complex cognitive tasks like reasoning and comprehension."
    },
    {
      term: "executive function",
      clinical_definition: "Set of mental skills including planning, focus, instruction following, task management, and emotional control, mediated by prefrontal cortex."
    },
    {
      term: "attentional bias",
      clinical_definition: "Tendency to pay more attention to emotionally salient stimuli while ignoring others, often maintaining anxiety and depression."
    },
    {
      term: "confirmation bias",
      clinical_definition: "Tendency to search for, interpret, favor, and recall information that confirms pre-existing beliefs or hypotheses."
    },
    {
      term: "cognitive load",
      clinical_definition: "Total amount of mental effort being used in working memory, affecting learning capacity and decision-making quality."
    },
    {
      term: "mental schema",
      clinical_definition: "Cognitive framework or concept that helps organize and interpret information, influencing perception and behavior based on past experiences."
    },
    {
      term: "automaticity",
      clinical_definition: "Ability to perform tasks without conscious attention or effort after extensive practice, freeing cognitive resources for other activities."
    },
    {
      term: "metacognition",
      clinical_definition: "Awareness and understanding of one's own thought processes, including the ability to monitor and regulate cognitive activities."
    },
    {
      term: "priming",
      clinical_definition: "Phenomenon where exposure to one stimulus influences response to a subsequent stimulus without conscious awareness of the connection."
    }
  ],

  emotional_regulation: [
    {
      term: "emotional dysregulation",
      clinical_definition: "Inability to manage emotional responses effectively, characterized by intense, prolonged emotional reactions that interfere with functioning."
    },
    {
      term: "affect",
      clinical_definition: "Observable expression of emotion, including facial expressions, tone of voice, and body language reflecting internal emotional state."
    },
    {
      term: "limbic system",
      clinical_definition: "Set of brain structures including amygdala, hippocampus, and hypothalamus involved in emotion, motivation, memory, and behavior."
    },
    {
      term: "stress response",
      clinical_definition: "Physiological and psychological reaction to perceived threats, activating fight-or-flight mechanisms via sympathetic nervous system and HPA axis."
    },
    {
      term: "emotional contagion",
      clinical_definition: "Phenomenon where people automatically mimic and synchronize with the emotions, expressions, and behaviors of others around them."
    },
    {
      term: "alexithymia",
      clinical_definition: "Difficulty identifying and describing one's own emotions, often associated with reduced emotional awareness and expression."
    },
    {
      term: "interoception",
      clinical_definition: "Sense of the internal state of the body, including awareness of heartbeat, breathing, hunger, and other physiological signals."
    },
    {
      term: "reappraisal",
      clinical_definition: "Emotion regulation strategy involving reinterpreting the meaning of an emotional stimulus to change emotional response."
    },
    {
      term: "rumination",
      clinical_definition: "Repetitive, passive focus on negative emotions and their causes and consequences without engaging in active problem-solving."
    },
    {
      term: "emotional granularity",
      clinical_definition: "Ability to make fine-grained distinctions among similar emotional states, associated with better emotional regulation and mental health."
    }
  ],

  behavioral_psychology: [
    {
      term: "operant conditioning",
      clinical_definition: "Learning process where behavior is modified by consequences (reinforcement or punishment), discovered by B.F. Skinner."
    },
    {
      term: "classical conditioning",
      clinical_definition: "Learning process where a neutral stimulus becomes associated with a meaningful stimulus through repeated pairing, eliciting conditioned response."
    },
    {
      term: "reinforcement",
      clinical_definition: "Any consequence that strengthens or increases the likelihood of a behavior recurring, either by adding something pleasant or removing something unpleasant."
    },
    {
      term: "extinction",
      clinical_definition: "Gradual weakening and disappearance of a learned behavior when reinforcement is no longer provided."
    },
    {
      term: "generalization",
      clinical_definition: "Tendency for learned responses to occur in situations similar to the original learning context, even without identical conditions."
    },
    {
      term: "discrimination",
      clinical_definition: "Ability to distinguish between similar stimuli and respond differently based on specific features or contexts."
    },
    {
      term: "shaping",
      clinical_definition: "Behavior modification technique using successive approximations, reinforcing progressively closer versions of the target behavior."
    },
    {
      term: "intermittent reinforcement",
      clinical_definition: "Reinforcement schedule where behavior is rewarded only some of the time, creating stronger and more persistent behavioral patterns."
    },
    {
      term: "learned helplessness",
      clinical_definition: "Condition where repeated exposure to uncontrollable stressors leads to passive acceptance and failure to escape even when escape becomes possible."
    },
    {
      term: "behavioral activation",
      clinical_definition: "Therapeutic approach involving engagement in valued activities to increase positive reinforcement and reduce depression symptoms."
    }
  ],

  trauma_stress: [
    {
      term: "fight-or-flight response",
      clinical_definition: "Physiological reaction to perceived harmful events, attacks, or threats to survival, activating sympathetic nervous system for defensive action."
    },
    {
      term: "freeze response",
      clinical_definition: "Involuntary immobility response to overwhelming threat when fight or flight are not viable, involving parasympathetic nervous system activation."
    },
    {
      term: "hypervigilance",
      clinical_definition: "State of increased alertness and scanning for threats in the environment, common in anxiety disorders and post-traumatic stress."
    },
    {
      term: "dissociation",
      clinical_definition: "Disconnection between thoughts, memories, feelings, actions, or sense of identity, often occurring during or after trauma."
    },
    {
      term: "flashback",
      clinical_definition: "Vivid, intrusive re-experiencing of a traumatic event where the person feels as if the trauma is happening again in the present moment."
    },
    {
      term: "hyperarousal",
      clinical_definition: "State of increased psychological and physiological tension, including elevated heart rate, jumpiness, and difficulty concentrating."
    },
    {
      term: "window of tolerance",
      clinical_definition: "Optimal arousal zone where the nervous system can function effectively, process information, and regulate emotions without becoming overwhelmed."
    },
    {
      term: "trauma bonding",
      clinical_definition: "Strong emotional attachment that develops between abuser and victim through cycles of abuse, devaluation, and positive reinforcement."
    },
    {
      term: "somatic experiencing",
      clinical_definition: "Body-oriented therapeutic approach focusing on physical sensations to release traumatic stress stored in the nervous system."
    },
    {
      term: "polyvagal theory",
      clinical_definition: "Framework explaining how the vagus nerve regulates physiological state in response to safety, danger, or life-threat through three neural circuits."
    }
  ],

  addiction_reward: [
    {
      term: "reward pathway",
      clinical_definition: "Neural circuit primarily involving ventral tegmental area and nucleus accumbens that processes pleasure, motivation, and reinforcement."
    },
    {
      term: "tolerance",
      clinical_definition: "Decreased response to a drug or behavior over time, requiring increased amounts to achieve the same effect."
    },
    {
      term: "withdrawal",
      clinical_definition: "Physical and psychological symptoms that occur when stopping or reducing a substance or behavior after dependence has developed."
    },
    {
      term: "craving",
      clinical_definition: "Intense desire or urge to engage in a behavior or consume a substance, often triggered by environmental cues or emotional states."
    },
    {
      term: "dopamine spike",
      clinical_definition: "Rapid increase in dopamine levels in response to rewarding stimuli, reinforcing associated behaviors and creating motivation to repeat them."
    },
    {
      term: "nucleus accumbens",
      clinical_definition: "Brain region central to reward, pleasure, addiction, and motivation, receiving dopamine from ventral tegmental area."
    },
    {
      term: "incentive salience",
      clinical_definition: "Process where reward-associated stimuli become attractive and 'wanted', driving motivated behavior even without pleasure."
    },
    {
      term: "behavioral addiction",
      clinical_definition: "Compulsive engagement in rewarding non-substance behaviors despite negative consequences, sharing neural mechanisms with substance addiction."
    },
    {
      term: "relapse",
      clinical_definition: "Return to substance use or problematic behavior after a period of abstinence or improvement, often triggered by stress or cues."
    },
    {
      term: "neuroadaptation",
      clinical_definition: "Brain changes that occur in response to repeated drug use or behavior, altering baseline neurochemistry and neural circuit function."
    }
  ]
};

/**
 * Calculate Flesch-Kincaid reading level
 * @param {string} text - Text to analyze
 * @returns {number} Grade level
 */
function calculateReadingLevel(text) {
  // Remove extra whitespace
  const cleanText = text.trim().replace(/\s+/g, ' ');

  // Count sentences (approximation)
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  // Count words
  const words = cleanText.split(/\s+/).filter(w => w.length > 0).length;

  // Count syllables (approximation)
  const syllables = cleanText.toLowerCase()
    .replace(/[^a-z]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .reduce((count, word) => {
      // Simple syllable counting algorithm
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      const matches = word.match(/[aeiouy]{1,2}/g);
      return count + (matches ? matches.length : 1);
    }, 0);

  if (sentences === 0 || words === 0) return 0;

  // Flesch-Kincaid Grade Level Formula
  const gradeLevel = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;

  return Math.round(gradeLevel * 10) / 10;
}

/**
 * Generate user-friendly explanation using Claude API
 * @param {Object} termData - Term and clinical definition
 * @returns {Promise<Object>} Enhanced glossary entry
 */
async function generateUserFriendlyExplanation(termData) {
  const prompt = `Transform this neuroscience term into an 8th-grade explanation:

Term: ${termData.term}
Clinical Definition: ${termData.clinical_definition}

Provide a JSON response with:
1. user_friendly: One clear sentence (<15 words) explaining what it is
2. analogy: An everyday comparison that makes it concrete and relatable
3. why_it_matters: Why this is important for behavior change (1-2 sentences)
4. example_sentence: A real-world example showing the concept in action

Requirements:
- Use simple, everyday words (avoid jargon)
- Keep sentences short and clear
- Make it conversational but not patronizing
- Target 8th-grade reading level or below
- Be accurate but accessible

Return ONLY valid JSON in this exact format:
{
  "user_friendly": "...",
  "analogy": "...",
  "why_it_matters": "...",
  "example_sentence": "..."
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    // Extract JSON from response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const explanation = JSON.parse(jsonMatch[0]);

    // Calculate reading level for user_friendly definition
    const readingLevel = calculateReadingLevel(explanation.user_friendly);

    return {
      term: termData.term,
      clinical_definition: termData.clinical_definition,
      user_friendly: explanation.user_friendly,
      analogy: explanation.analogy,
      why_it_matters: explanation.why_it_matters,
      reading_level: readingLevel,
      example_sentence: explanation.example_sentence
    };
  } catch (error) {
    console.error(`Error processing term "${termData.term}":`, error.message);
    return {
      term: termData.term,
      clinical_definition: termData.clinical_definition,
      user_friendly: `[Error generating explanation: ${error.message}]`,
      analogy: "",
      why_it_matters: "",
      reading_level: 0,
      example_sentence: ""
    };
  }
}

/**
 * Main glossary generation function
 */
async function generateGlossary() {
  console.log('🧠 Starting Neuroscience Glossary Generation...\n');

  const glossary = [];
  const glossaryByCategory = {};
  const readingLevelStats = {
    total_terms: 0,
    avg_reading_level: 0,
    below_grade_8: 0,
    grade_8_to_10: 0,
    above_grade_10: 0,
    reading_levels: []
  };

  // Process each category
  for (const [category, terms] of Object.entries(NEUROSCIENCE_TERMS)) {
    console.log(`\n📚 Processing category: ${category} (${terms.length} terms)`);
    glossaryByCategory[category] = [];

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      console.log(`  [${i + 1}/${terms.length}] ${term.term}...`);

      const entry = await generateUserFriendlyExplanation(term);
      glossary.push(entry);
      glossaryByCategory[category].push(entry);

      // Update stats
      readingLevelStats.total_terms++;
      readingLevelStats.reading_levels.push(entry.reading_level);

      if (entry.reading_level <= 8) {
        readingLevelStats.below_grade_8++;
      } else if (entry.reading_level <= 10) {
        readingLevelStats.grade_8_to_10++;
      } else {
        readingLevelStats.above_grade_10++;
      }

      // Rate limiting: wait 1 second between API calls
      if (i < terms.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Calculate average reading level
  readingLevelStats.avg_reading_level =
    readingLevelStats.reading_levels.reduce((a, b) => a + b, 0) / readingLevelStats.total_terms;
  readingLevelStats.avg_reading_level =
    Math.round(readingLevelStats.avg_reading_level * 10) / 10;

  console.log('\n✅ Glossary generation complete!');
  console.log(`   Total terms: ${readingLevelStats.total_terms}`);
  console.log(`   Average reading level: ${readingLevelStats.avg_reading_level}`);
  console.log(`   ≤ Grade 8: ${readingLevelStats.below_grade_8} (${Math.round(readingLevelStats.below_grade_8 / readingLevelStats.total_terms * 100)}%)`);
  console.log(`   Grade 8-10: ${readingLevelStats.grade_8_to_10} (${Math.round(readingLevelStats.grade_8_to_10 / readingLevelStats.total_terms * 100)}%)`);
  console.log(`   > Grade 10: ${readingLevelStats.above_grade_10} (${Math.round(readingLevelStats.above_grade_10 / readingLevelStats.total_terms * 100)}%)`);

  // Save files
  console.log('\n💾 Saving output files...');

  // Full glossary JSON
  fs.writeFileSync(
    path.join(__dirname, 'neuroscience-glossary.json'),
    JSON.stringify(glossary, null, 2)
  );

  // Glossary by category JSON
  fs.writeFileSync(
    path.join(__dirname, 'glossary-by-category.json'),
    JSON.stringify(glossaryByCategory, null, 2)
  );

  // Reading level report JSON
  fs.writeFileSync(
    path.join(__dirname, 'reading-level-report.json'),
    JSON.stringify(readingLevelStats, null, 2)
  );

  // Simple explanations Markdown
  let markdownContent = '# Neuroscience Glossary - Simple Explanations\n\n';
  markdownContent += `*Generated: ${new Date().toISOString()}*\n\n`;
  markdownContent += `**Total Terms**: ${readingLevelStats.total_terms} | `;
  markdownContent += `**Average Reading Level**: Grade ${readingLevelStats.avg_reading_level}\n\n`;
  markdownContent += '---\n\n';

  for (const [category, terms] of Object.entries(glossaryByCategory)) {
    markdownContent += `## ${category.replace(/_/g, ' ').toUpperCase()}\n\n`;

    for (const entry of terms) {
      markdownContent += `### ${entry.term}\n\n`;
      markdownContent += `**Simple Definition**: ${entry.user_friendly}\n\n`;
      markdownContent += `**Think of it like**: ${entry.analogy}\n\n`;
      markdownContent += `**Why it matters**: ${entry.why_it_matters}\n\n`;
      markdownContent += `**Example**: ${entry.example_sentence}\n\n`;
      markdownContent += `*Reading Level: Grade ${entry.reading_level}*\n\n`;
      markdownContent += '---\n\n';
    }
  }

  fs.writeFileSync(
    path.join(__dirname, 'simple-explanations.md'),
    markdownContent
  );

  console.log('✅ Files saved successfully:');
  console.log('   - neuroscience-glossary.json');
  console.log('   - glossary-by-category.json');
  console.log('   - reading-level-report.json');
  console.log('   - simple-explanations.md');

  return {
    glossary,
    glossaryByCategory,
    readingLevelStats
  };
}

// Run if called directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  generateGlossary().catch(error => {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  });
}

export { generateGlossary, calculateReadingLevel };
