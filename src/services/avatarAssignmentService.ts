/**
 * Avatar Assignment Service
 *
 * Week 4 - Maps Pattern + Sub-Pattern + Temperament to one of 15 unique Avatars.
 *
 * Avatar System Architecture:
 * - 3 Primary Patterns: past_prison, success_sabotage, compass_crisis
 * - 10 Sub-Patterns: 4 for Past Prison, 3 for Success Sabotage, 3 for Compass Crisis
 * - 4 Temperaments: warrior, sage, connector, builder
 *
 * Each Avatar has:
 * - Unique name and ID
 * - N8n protocol key for targeted protocols
 * - Detailed narrative and breakthrough path
 * - Neural rewiring principles
 * - Four-Pillar Attack breakdown
 * - Cost if Unchecked (3 consequences)
 * - Neural Rewiring Protocol with 5 practices
 * - Transformation Timeline
 */

import { supabase } from '@/integrations/supabase/client';
import type { PrimaryPattern, SubPatternType } from './subPatternAssessmentService';
import type { TemperamentType } from './temperamentAssessmentService';

// ============================================================================
// TYPES
// ============================================================================

export interface NeuralPractice {
  name: string;
  duration: string;
  frequency: string;
  instructions: string;
  expectedOutcome: string;
}

export interface EmergencyProtocol {
  trigger: string;
  steps: string[];
}

export interface FourPillarAttack {
  spiritual: string;
  mental: string;
  physical: string;
  relational: string;
}

export interface NeuralRewiringProtocol {
  practices: NeuralPractice[];
  emergencyProtocol: EmergencyProtocol;
}

export interface TransformationTimeline {
  week1: string;
  week2: string;
  day30: string;
  day90: string;
}

export interface Avatar {
  id: string;
  name: string;
  primaryPattern: PrimaryPattern;
  subPattern: SubPatternType;
  temperament: TemperamentType;
  protocolKey: string;
  shortDescription: string;
  fullDescription: string;
  breakthroughPath: string;
  neuralPrinciple: string;
  icon: string;
  // Rich content fields
  fourPillarAttack: FourPillarAttack;
  costIfUnchecked: string[];
  neuralRewiringProtocol: NeuralRewiringProtocol;
  transformationTimeline: TransformationTimeline;
  premiumTime: string;
  roi: string;
}

export interface AvatarAssignment {
  avatarId: string;
  avatarName: string;
  protocolKey: string;
  assignedAt: string;
  confidence: number;
}

export interface AssignAvatarResult {
  success: boolean;
  assignment?: AvatarAssignment;
  error?: string;
}

// ============================================================================
// AVATAR LIBRARY (15 Unique Avatars with Full Rich Content)
// ============================================================================

export const AVATAR_LIBRARY: Avatar[] = [
  // =========================================================================
  // PAST PRISON AVATARS (5)
  // =========================================================================
  {
    id: 'exhausted_achiever',
    name: 'The Exhausted Achiever',
    primaryPattern: 'past_prison',
    subPattern: 'identity_ceiling',
    temperament: 'warrior',
    protocolKey: 'achiever_burnout',
    shortDescription: 'High performer hitting invisible ceilings while running on empty',
    fullDescription: `You're a high-capacity person operating at 150% capacity with 50% fuel. You've built impressive things—the business is growing, the revenue is increasing, people respect what you've created. But you're running on fumes when the biggest opportunities arrive.

You hit the same income ceiling year after year. $150K. $250K. Whatever your number is, you get close to breaking through and then... something happens. You get sick. You lose a client. Your energy crashes. The opportunity passes while you're depleted.

Here's what's really happening: Your past self believes that "people like us" don't make that kind of money. Your family's money ceiling becomes your internal speed limit. And because you're a Warrior, you try to break through the ceiling by sheer force—which depletes you right at the moment you need peak performance.

You push harder. You work longer. You ignore your body's warning lights. And right when you should be executing at your highest level, you crash. The ceiling holds not because you lack capability, but because you're depleted when capability matters most.

Your body is screaming for rest, but your mind says "rest is weakness." So you operate depleted, make terrible decisions, and watch opportunities slip through exhausted fingers.`,
    breakthroughPath: 'Learning that rest is a strategy, not a reward. Your ceiling isn\'t about effort—it\'s about identity. When you upgrade who you believe you can be AND recover to conquer, the ceiling dissolves.',
    neuralPrinciple: 'Your past is data, not destiny. New evidence creates new identity.',
    icon: '🔥',
    fourPillarAttack: {
      spiritual: '"Your worth is in your output. If you rest, you\'re worthless. People like you don\'t get to make that kind of money anyway—who are you kidding? Keep pushing until you prove your worth... which you never will."',
      mental: '"Everyone else can handle this load. You\'re just weak. If you were really capable, you wouldn\'t be tired. The ceiling exists because you\'re not good enough, so work harder. That exhaustion you feel? That\'s failure knocking."',
      physical: '"Your body is a machine. Ignore the warning lights—they\'re for weak people. Sleep is for people who aren\'t serious. That chest pain? Push through it. Your worth depends on ignoring your limits."',
      relational: '"They need you performing, not recovering. Your family will understand when you make it. Just a little longer. Just push a little harder. Connection can wait until you break through... which keeps getting further away."',
    },
    costIfUnchecked: [
      'Health crisis that forces the rest you refused to take voluntarily—Heart attack, breakdown, hospitalization that makes rest mandatory when it could have been preventative',
      'Major opportunity blown because you had no fuel when it arrived—The $500K deal, the partnership, the breakthrough moment happening while you\'re too depleted to execute',
      'Divorce or family estrangement from chronic absence—They stop waiting for you to "make it" and leave while you\'re still pushing toward a ceiling you\'ll never break while depleted',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Morning Movement Stack - Recovery Edition',
          duration: '15 minutes',
          frequency: 'Daily',
          instructions: '1. 5 minutes: Gentle stretching (wake body, don\'t punish it)\n2. 5 minutes: Moderate movement (walking, tai chi, yoga flow)\n3. 5 minutes: Seated breathing practice (box breathing)\n4. End by speaking: "Recovery is my performance fuel"',
          expectedOutcome: 'Within 7 days, notice energy is HIGHER after movement. Within 21 days, body craves recovery practices.',
        },
        {
          name: 'Power Declaration Movement - Ceiling Edition',
          duration: '5 minutes',
          frequency: 'Daily',
          instructions: '1. Stand in power pose, take 3 deep breaths\n2. Speak new ceiling out loud: "I am a [new identity] who earns [new ceiling]"\n3. Do 10 jumping jacks while repeating declaration\n4. Return to power pose: "My ceiling is broken. My capacity is expanding."\n5. Close with power move',
          expectedOutcome: 'Within 7 days, decreased physical resistance when imagining higher income. Within 30 days, new ceiling feels embodied.',
        },
        {
          name: 'Midday Energy Reset - NASCAR Pit Stop',
          duration: '10 minutes',
          frequency: 'Daily',
          instructions: '1. Set non-negotiable midday alarm (around 2pm)\n2. STOP all work immediately when alarm sounds\n3. Leave workspace\n4. 5 minutes: Physical reset (walk, stretch, cold water)\n5. 5 minutes: Mental reset (box breathing, eyes closed)\n6. Return with "pit stop complete" mindset',
          expectedOutcome: 'Afternoon productivity increases 40%. Proof that rest = performance eliminates guilt.',
        },
        {
          name: 'Weekly Recovery Ritual',
          duration: '2 hours',
          frequency: 'Weekly',
          instructions: '1. Block 2 hours Sunday (non-negotiable, in calendar)\n2. Complete tech detox\n3. Hour 1: Physical recovery (massage, stretching, sauna, nature)\n4. Hour 2: Mental recovery (silence, meditation, contemplation)\n5. End with: "This recovery makes me stronger"\n6. Track completion weekly (goal: 48/52 weeks)',
          expectedOutcome: 'Weekly reset prevents monthly crash. Scheduled recovery enhances performance.',
        },
        {
          name: 'Body Scan Recovery Practice',
          duration: '10 minutes',
          frequency: 'Evening',
          instructions: '1. Lie down or sit comfortably\n2. Scan body head to feet: Where is tension? Pain? Fatigue?\n3. For each area: Breathe into it, say "I hear you. I will rest you."\n4. Rate overall energy 1-10\n5. If below 6: Tomorrow includes mandatory extra rest\n6. Journal: "My body is telling me..."',
          expectedOutcome: 'Body signals heard before crisis. Depletion pattern interrupted by early intervention.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When you\'re running on empty but feel pressure to push through, or when ceiling thoughts create guilt around rest',
        steps: [
          'STOP all activity immediately',
          'Stand and shake out entire body for 60 seconds',
          '20 jumping jacks (discharge stress)',
          '4-7-8 breathing × 5 rounds',
          'Speak: "Empty tank = poor performance. My ceiling breaks when I\'m fueled. I rest now."',
          'Take mandatory 20-minute break',
          'Power pose + "That\'s the old ceiling. I recover to conquer."',
        ],
      },
    },
    transformationTimeline: {
      week1: 'Notice decreased guilt around rest. Energy slightly higher.',
      week2: 'Afternoon crashes reduced. Beginning to trust recovery = performance.',
      day30: 'Operating with fuller tank. Ceiling thoughts losing power. Making better decisions.',
      day90: 'New income ceiling broken. Sustained energy. Recovery non-negotiable. New identity: "I am a warrior who recovers to conquer."',
    },
    premiumTime: '62 minutes daily + 2 hours weekly',
    roi: 'Ceiling broken, depletion eliminated, 10x output with half the effort',
  },
  {
    id: 'reluctant_expert',
    name: 'The Accidental Expert',
    primaryPattern: 'past_prison',
    subPattern: 'impostor_syndrome',
    temperament: 'sage',
    protocolKey: 'impostor_syndrome',
    shortDescription: 'Brilliant mind who over-prepares to hide feeling like a fraud',
    fullDescription: `You have a PhD. Published research. A seven-figure practice or business. Credentials that most people dream of. And yet, before every speaking engagement, every important meeting, every big moment, you think: "They're going to realize I don't belong here."

You grew up as "the dumb one" compared to your genius sibling, or you were told you weren't college material, or you barely scraped through early education. That label became your internal truth. Every achievement since then feels like you're getting away with something.

The worst part? You make terrible decisions when it matters most. Why? Because you're mentally exhausted from over-preparing to compensate for feeling "less than." You research everything to death. You analyze every angle. You make yourself the most prepared person in the room to hide the fact that you feel like a fraud.

But all that analysis creates decision fatigue. So when the actual important choices arrive—the strategic moves, the pivotal moments—your judgment is shot. You're operating on mental fumes. And you make the exact mistakes that confirm your impostor fears.

You're stuck in a loop: Feel like fraud → Over-prepare to compensate → Deplete mental capacity → Make poor decision when tired → "See? I AM a fraud" → Repeat.

Your competence is objectively real. Your confidence is subjectively absent. And the gap between the two is destroying your judgment capacity.`,
    breakthroughPath: 'Recognizing that expertise isn\'t about knowing everything—it\'s about knowing more than the people you serve. Your over-preparation is the fraud; your natural wisdom is real. Competent people doubt; frauds don\'t feel like frauds.',
    neuralPrinciple: 'Competence is proven through action, not accumulated through preparation.',
    icon: '📚',
    fourPillarAttack: {
      spiritual: '"You\'re not actually smart/talented/worthy. This is all an accident. God\'s grace can\'t possibly extend to someone like you—you barely graduated, remember? You\'re living on borrowed qualifications."',
      mental: '"Everyone else has it figured out except you. They actually know what they\'re doing—you\'re just faking it. That\'s why you need to analyze everything to death. If you make one wrong choice, they\'ll see through you. Your mental exhaustion proves you\'re not really capable."',
      physical: '"Your body\'s stress response is proof you don\'t belong. Real experts don\'t get nervous. That racing heart before presentations? That\'s your body telling the truth: you\'re a fraud. Ignore rest—frauds don\'t deserve it."',
      relational: '"Don\'t let anyone get too close or they\'ll see who you really are. Keep them at professional distance. That impostor feeling? That\'s wisdom telling you to hide. Connection is dangerous when you\'re living a lie."',
    },
    costIfUnchecked: [
      'Career-defining decision made while mentally exhausted—The strategic pivot, partnership choice, or opportunity assessment decided on fumes, costing you years or millions',
      'Chronic anxiety disorder from perpetual performance anxiety—Medical intervention required for anxiety that could have been addressed through impostor pattern work',
      'Isolation from inability to receive genuine connection—Dying professionally successful but personally alone because you kept everyone at arm\'s length to hide your "fraud" status',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Competence Contemplation Journal',
          duration: '15 minutes',
          frequency: 'Daily',
          instructions: '1. Morning contemplative writing session\n2. "Evidence of my competence includes..." (List 5-10 specific facts)\n3. "The gap between my competence and confidence exists because..." (Explore origins)\n4. "The truth about my capability is..." (Write until you believe it)\n5. Close with: "I am who my results say I am"',
          expectedOutcome: 'Deep processing integrates competence into identity. Fraud feelings recognized as false programming.',
        },
        {
          name: 'Lectio Divina on Identity',
          duration: '20 minutes',
          frequency: '3x/week',
          instructions: '1. Lectio: Read identity scriptures (Psalm 139, Ephesians 1:4-6, Isaiah 43:1)\n2. Meditatio: Let phrase about worth/calling emerge, repeat slowly\n3. Oratio: Dialogue with divine about impostor feelings\n4. Contemplatio: Rest in truth of who God says you are\n5. Actio: Identify one action embodying true identity',
          expectedOutcome: 'Spiritual authority replaces impostor insecurity. Divine calling > human doubt.',
        },
        {
          name: 'Morning Decision Meditation',
          duration: '20 minutes',
          frequency: 'Daily',
          instructions: '1. Morning meditation before day begins\n2. First 10 minutes: Clear all mental clutter\n3. Next 5 minutes: Hold top 3 decisions in awareness (don\'t analyze, just hold)\n4. Last 5 minutes: Receive clarity on each\n5. After meditation: Write decisions without overthinking\n6. Act on clarity within 1 hour',
          expectedOutcome: 'Decisions from stillness vs. overthinking. Wisdom access before mental fatigue.',
        },
        {
          name: 'Decision Fast',
          duration: 'Varies',
          frequency: 'Weekly',
          instructions: '1. Weekly: One "decision-free" day or half-day\n2. Pre-decide everything possible (meals, schedule, clothing, activities)\n3. During fast: Make ZERO discretionary choices\n4. Follow predetermined plan exactly\n5. Notice mental energy accumulation\n6. Journal: "When I fast from decisions, I notice..."\n7. Use replenished capacity for major decisions next day',
          expectedOutcome: 'Decision capacity replenishes. Less deciding = better judgment when needed.',
        },
        {
          name: 'The Great Silence - Competence Edition',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. Complete silence for 30 minutes\n2. First 10 minutes: Release all impostor thoughts into silence\n3. Middle 10 minutes: Ask in silence: "Who do you say I am? What is my true competence?"\n4. Last 10 minutes: Receive answer without forcing\n5. After: Journal any download received',
          expectedOutcome: 'Direct knowing replaces external validation need. Truth revealed in stillness.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When fraud thoughts hijack before performance AND important decision looms',
        steps: [
          'PAUSE immediately',
          'Close eyes, 5 deep breaths',
          'Ask: "Is this feeling truth or fear?"',
          'Recall: "Competent people doubt. Frauds don\'t feel like frauds."',
          'Ask: "Does this decision need to be made RIGHT NOW?"',
          'If yes: "What\'s the simplest, wisest choice?" Trust first quiet answer.',
          'If no: Defer to morning after rest.',
          'Speak: "I am who my results say I am. I decide from wisdom."',
        ],
      },
    },
    transformationTimeline: {
      week1: 'Notice decreased pre-performance anxiety. Decisions feel slightly clearer.',
      week2: 'Impostor thoughts losing intensity. Making one major decision from rest.',
      day30: 'Competence integrating into identity. Decision quality improving 40%.',
      day90: 'Fraud feelings occasional, not constant. Clear decisions from wisdom, not depletion. New identity: "I am competent. My doubt is proof I\'m real."',
    },
    premiumTime: '70 minutes daily + weekly practices',
    roi: 'Impostor syndrome eliminated, decision quality transformed, mental energy restored',
  },
  {
    id: 'almost_there_leader',
    name: 'The Almost-There Abandoner',
    primaryPattern: 'past_prison',
    subPattern: 'self_sabotage',
    temperament: 'warrior',
    protocolKey: 'self_sabotage_leader',
    shortDescription: 'Natural leader who burns bridges right before crossing',
    fullDescription: `You've started four businesses. Each one got to the edge of real success—first customer traction, media attention, investor interest—and then you found a reason to walk away. "The timing wasn't right." "The partner wasn't aligned." "The market shifted."

The real issue? Your dad abandoned the family when you were 10. Your past prison taught you: "People you love leave. Things that matter disappear. Don't get too attached." So every time your business becomes something you truly care about, you leave first.

You're not afraid of starting. You're terrified of finishing. You know what to do—you have the skills, the plan, the capability. But when it comes to actual execution at the critical moment, you freeze. Or worse, you blow it up.

Here's the pattern: You build something great → Get close to breakthrough → Prison alarm goes off ("You'll lose this anyway") → Unconsciously create drama or find fatal flaw → Walk away → Start something new → Repeat.

You execute brilliantly... until execution actually matters. Then you find reasons why this isn't the right time, this isn't the right path, this isn't going to work. The sabotage always has a logical explanation. But the pattern is always the same: almost there, then gone.

You're a warrior who fights hard but retreats right before victory. Why? Because your past self learned: If you win, you'll lose it anyway. Better to leave on your terms than wait to be abandoned by success.`,
    breakthroughPath: 'Understanding that self-sabotage is protection, not prediction. Your past taught you that good things don\'t last—but that was your past\'s pattern, not your future\'s truth. The alarm going off means you\'re about to break through, not break down.',
    neuralPrinciple: 'What you fear destroying, you\'re learning to protect differently.',
    icon: '⚡',
    fourPillarAttack: {
      spiritual: '"If you love it, you\'ll lose it. God took your father—what makes you think He\'ll let you keep success? Building something that matters is just setting yourself up for loss. Stay surface-level to stay safe."',
      mental: '"You know what to do but you\'re not doing it because you know it\'s pointless. Execution at breakthrough moments is dangerous—that\'s when abandonment happens. Your mental paralysis is protection. Stay stuck, stay safe."',
      physical: '"That anxiety when things get good? That\'s your body warning you: breakthrough = loss. Your nervous system is trying to save you from devastation. Listen to the alarm. Blow it up before it blows up on you."',
      relational: '"Don\'t get too attached to the team, the vision, the outcome. Attachment is weakness. Keep one foot out the door. That way when it ends—and it will—you\'ll survive. Connection at the finish line is dangerous."',
    },
    costIfUnchecked: [
      'Pattern of \'almosts\' that defines your entire career—Known as the person with "so much potential" who never quite finishes anything, reputation damaged beyond repair',
      'Financial instability from constantly starting over—Never building on previous success, always at year one of revenue, retirement impossible',
      'Relationship pattern replication—Leaving partners/friends right when things get good, dying alone because you couldn\'t stay for the breakthrough',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Breakthrough Threshold Training',
          duration: '10 minutes',
          frequency: 'Daily',
          instructions: '1. Stand in power pose\n2. Visualize being at edge of breakthrough (exact moment you normally sabotage)\n3. Let uncomfortable sensations arise (anxiety, fear, urge to quit)\n4. Stay in pose, breathe through discomfort for 3 minutes\n5. Speak: "This is the breakthrough threshold. I stay here."\n6. Do 10 jumping jacks: "I complete what I start"\n7. Return to power pose, feel calm after staying present',
          expectedOutcome: 'Within 14 days, breakthrough discomfort familiar, not threatening. Sabotage urges lose power.',
        },
        {
          name: '5-Minute Action Burst',
          duration: '5 minutes',
          frequency: 'Multiple daily',
          instructions: '1. When you notice thinking without doing: Set 5-minute timer immediately\n2. Take FIRST small action (not planning, actual doing)\n3. No overthinking allowed for 5 minutes\n4. Examples: Send first email (not draft, SEND), make first call, write first 100 words\n5. When timer ends: Often momentum carries forward\n6. Track: # of 5-minute bursts daily (goal: 5+)',
          expectedOutcome: 'Action muscle strengthens. Execution becomes reflex, not decision.',
        },
        {
          name: 'Project Completion Tracker',
          duration: '5 minutes',
          frequency: 'Daily',
          instructions: '1. Create physical board (whiteboard/poster)\n2. List current projects/goals\n3. Daily: Update progress\n4. When completed: Cross off with bold marker and celebration gesture\n5. Keep all completed items visible (don\'t erase)\n6. Weekly: Count total completions, celebrate number',
          expectedOutcome: 'Visual evidence of completion. Momentum builds with each finish.',
        },
        {
          name: 'Finish Line Walk',
          duration: '20 minutes',
          frequency: '3x/week',
          instructions: '1. Walk with purpose, imagine approaching major finish line\n2. First 5 minutes: Notice any urges to slow down, stop, divert\n3. Middle 10 minutes: Keep walking, visualizing crossing finish line\n   - Feel what success feels like\n   - Notice sabotage thoughts\n   - Keep moving forward anyway\n4. Last 5 minutes: Visualize celebrating completion\n5. End by crossing imaginary finish line with arms raised',
          expectedOutcome: 'Nervous system learns completion is safe. Finish lines become familiar.',
        },
        {
          name: 'Pattern Interrupt Protocol',
          duration: 'Varies',
          frequency: 'When sabotage urge hits',
          instructions: '1. When sabotage urge arises (want to quit, blow it up, create drama):\n2. Immediately do 20 jumping jacks or run in place 60 seconds\n3. While moving, speak: "This is sabotage, not truth"\n4. Power pose for 30 seconds\n5. Ask: "What\'s one small next step toward completion?"\n6. Do that step immediately (within 5 minutes)',
          expectedOutcome: 'Sabotage urges interrupted before action. New pathway: urge → movement → completion step.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When you feel urge to quit right before breakthrough AND can\'t seem to execute',
        steps: [
          'STOP all activity',
          '30 seconds intense movement (burpees, high knees, jumping jacks)',
          'Power pose, 5 deep breaths',
          'Speak: "The alarm is going off because I\'m about to break through. I stay."',
          'Ask: "What\'s the tiniest next action toward completion?"',
          'Set 5-minute timer',
          'Execute that micro-action before timer ends',
          'Speak: "I complete what I start. I am a finisher."',
        ],
      },
    },
    transformationTimeline: {
      week1: 'Notice sabotage urges without acting on them. Complete 3+ action bursts daily.',
      week2: 'First project completed without abandonment. Execution becoming reflex.',
      day30: 'Completion identity forming. Sabotage urges losing power. Three projects finished.',
      day90: 'Pattern broken. Known as finisher, not abandoner. New identity: "I am a warrior who completes."',
    },
    premiumTime: '45 minutes daily',
    roi: 'Sabotage eliminated, execution automatic, completion track record established',
  },
  {
    id: 'guilty_wanderer',
    name: 'The Guilty Wanderer',
    primaryPattern: 'past_prison',
    subPattern: 'identity_ceiling',
    temperament: 'sage',
    protocolKey: 'guilty_wanderer',
    shortDescription: 'The Sage lost between past and future',
    fullDescription: `You're in Past Prison AND you've lost your authentic compass. Your past self says "this isn't for people like us" so you've never actually connected with what YOU authentically want. You're following paths that look acceptable to your prison guards, not paths that light you up.

You grew up poor, or working class, or in a family where ambition was viewed with suspicion. "Don't get above your raising." "Remember where you came from." The message: stay in your lane, don't reach too high, "people like us" have our place.

So you never actually asked yourself: "What do I want?" Instead you asked: "What's acceptable for someone from my background?" You've been following a map drawn by your past, pursuing goals that won't trigger guilt or betrayal accusations.

And now? You're building toward something that feels empty. You can't remember why you started. The dream that was supposed to drive you now drains you. You're lost—not because you don't have a compass, but because your compass has always pointed toward what's acceptable rather than what's authentic.

You're a Sage who needs deep meaning. But you're pursuing shallow goals because deep goals might require breaking your ceiling and betraying your roots. So you wander—successful on paper, hollow in spirit, disconnected from authentic desire because authentic desire was never allowed.`,
    breakthroughPath: 'Honoring your roots while breaking your ceiling. Your authentic desire is valid. You can choose your own compass while respecting where you came from.',
    neuralPrinciple: 'Authentic desire doesn\'t betray your roots—it honors your potential.',
    icon: '🧭',
    fourPillarAttack: {
      spiritual: '"You have no real purpose because people like you don\'t get to have grand callings. Your purpose is to stay in your place, make a decent living, and not embarrass your family. Wanting more is greed masquerading as calling."',
      mental: '"You don\'t even know what you want because you were never allowed to want. That emptiness you feel? That\'s who you really are. People from your background don\'t get meaningful work—they get jobs. Stop pretending you\'re different."',
      physical: '"Your body\'s exhaustion is proof you\'re chasing the wrong thing. But you can\'t stop because stopping would mean admitting your whole path was wrong. So push through the fatigue. It\'s penance for reaching above your station."',
      relational: '"If you discover what you really want, you\'ll have to leave everyone behind. Your authentic path means betraying your people. Stay lost—it\'s safer than being found and alone."',
    },
    costIfUnchecked: [
      'Life lived on someone else\'s terms, realizing it at 60—Deathbed regret that you never asked what YOU wanted, only what was acceptable',
      'Complete motivation collapse leading to depression—Clinical intervention required for spiritual emptiness that could have been addressed by authentic alignment',
      'Generational pattern replication—Teaching your kids to stay small just like your parents taught you, perpetuating the prison',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Authentic Desire Meditation',
          duration: '20 minutes',
          frequency: 'Daily',
          instructions: '1. Morning meditation in complete quiet\n2. First 5 minutes: Release all external expectations\n3. Middle 10 minutes: Ask in silence:\n   - "What do I authentically desire?"\n   - "What would I pursue if no one knew?"\n   - "What makes me feel alive?"\n4. Last 5 minutes: Receive whatever emerges (don\'t judge)\n5. After: Journal what emerged without censorship',
          expectedOutcome: 'Authentic motivation revealed beneath "should." True desire emerges in stillness.',
        },
        {
          name: 'Lectio Divina on Abundance + Calling',
          duration: '20 minutes',
          frequency: '3x/week',
          instructions: '1. Lectio: Alternate between abundance (Ephesians 3:20, John 10:10) and calling scriptures (Jeremiah 29:11, Ephesians 2:10)\n2. Meditatio: Let phrase emerge about your capacity AND unique purpose\n3. Oratio: Dialogue about ceiling and lost motivation\n4. Contemplatio: Rest in divine abundance for YOUR authentic path\n5. Actio: Identify one action honoring both expanded capacity and authentic desire',
          expectedOutcome: 'Spiritual permission for ceiling break + authentic path. Both/and, not either/or.',
        },
        {
          name: 'Ceiling + Purpose Journaling',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly deep journaling\n2. "My old ceiling believed..." (Externalize inherited limits)\n3. "What I\'ve been pursuing because it looks acceptable..." (Name inauthentic goals)\n4. "What I actually want but haven\'t admitted..." (Speak hidden desires)\n5. "Permission I need to give myself..." (Both ceiling break AND authentic path)\n6. "My new ceiling honors my roots by..." (Integration, not abandonment)\n7. "My authentic path looks like..." (Describe what YOU actually want)',
          expectedOutcome: 'Truth on paper liberates. Both ceiling and compass addressed simultaneously.',
        },
        {
          name: 'Silence and Solitude - Integration Edition',
          duration: '60 minutes',
          frequency: 'Weekly',
          instructions: '1. One hour complete solitude and silence\n2. First 20 minutes: Release ceiling thoughts and should motivations\n3. Middle 20 minutes: Ask: "What am I capable of? What do I authentically want?"\n4. Last 20 minutes: Receive clarity on both\n5. After: Journal any wisdom received\n6. Honor: You can expand capacity while pursuing authentic desire',
          expectedOutcome: 'Direct knowing of both potential AND authentic direction. Integration instead of either/or.',
        },
        {
          name: 'Roots-Honoring Wisdom Practice',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly: Read story of someone who broke their background ceiling\n2. Focus on: How did they honor roots while expanding?\n3. Journal:\n   - What permission did they give themselves?\n   - How did they integrate past and future?\n   - What lesson applies to my journey?\n4. Apply one insight to your situation',
          expectedOutcome: 'Permission through example. Path shown of both/and instead of either/or.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When ceiling guilt meets motivation emptiness',
        steps: [
          'STOP all activity',
          'Hand on heart, eyes closed',
          'Breathe and ask two questions:\n   - "Am I pursuing what\'s acceptable or what\'s authentic?"\n   - "Can I expand my capacity while honoring my roots?"',
          'First quiet answers are often truth',
          'Journal them immediately',
          'Speak: "I honor my roots while breaking my ceiling. I choose my authentic path."',
          'Take one small action toward both expanded capacity AND authentic desire',
        ],
      },
    },
    transformationTimeline: {
      week1: 'First glimpses of authentic desire beneath should. Ceiling guilt decreasing.',
      week2: 'Clear distinction between acceptable goals and authentic wants. Permission forming.',
      day30: 'Authentic motivation emerging. Ceiling breaking without root betrayal. Integration forming.',
      day90: 'New compass pointing at authentic north. Expanded capacity pursuing real desires. New identity: "I honor my roots while breaking my ceiling. My authentic path is valid."',
    },
    premiumTime: '90 minutes daily + weekly practices',
    roi: 'Ceiling broken, authentic motivation discovered, roots honored while future built',
  },
  {
    id: 'outgrown_networker',
    name: 'The Outgrown Networker',
    primaryPattern: 'past_prison',
    subPattern: 'relationship_erosion',
    temperament: 'connector',
    protocolKey: 'relationship_erosion',
    shortDescription: 'The Connector losing relationships through growth',
    fullDescription: `You climbed out of poverty to build a successful business. Your old friends still work hourly jobs. Your family still lives paycheck to paycheck. And every time you go home, you feel the tension.

"You've changed." "Must be nice." "Remember where you came from." They don't say they resent your success, but you feel it. Your growth threatens their stability. Your evolution forces them to confront their stagnation.

You're a Connector—you need relationships like oxygen. But as you grow, you're losing the people who matter most. The more successful you become, the more isolated you feel. You're outgrowing your origin circle, but you don't feel like you fully belong in your new circles either.

And then the comparison hits: You scroll social media and see people in your new circles who seem more successful, more established, more "arrived" than you. You don't fit with your past anymore, but you're behind in your present. Caught between two worlds, belonging to neither.

Here's what's killing you: You're comparing yourself to people ahead while guilt-tripping about leaving people behind. Your origin relationships are eroding because you're evolving. Your new relationships feel inadequate because you're comparing. And you're a Connector—so isolation is your personal hell.

You need connection. But connection with your past triggers guilt. Connection with your present triggers comparison. So you're lonely at a level that most people won't understand, because on paper you're successful and surrounded by people.`,
    breakthroughPath: 'Evolution doesn\'t require abandonment AND comparison doesn\'t serve connection. You can honor origins while building new circles. You can celebrate others while building yourself. Bridge worlds through connection.',
    neuralPrinciple: 'You can grow beyond your roots without severing them.',
    icon: '🤝',
    fourPillarAttack: {
      spiritual: '"Success means abandoning your people. You can\'t serve God and money—and you chose money. That loneliness you feel? That\'s conviction. Your purpose was to stay humble and connected, but you chose ambition and isolation."',
      mental: '"Everyone in your old circle thinks you\'re a sellout. Everyone in your new circle thinks you\'re behind. You don\'t actually belong anywhere. Your comparison thoughts prove it—you\'re not successful enough for the new world and too successful for the old."',
      physical: '"Your body\'s stress from relational tension is punishment for choosing wrong. That anxiety before going home? That\'s your conscience. That exhaustion from maintaining two worlds? That\'s what betrayal costs physically."',
      relational: '"Your old friends will never forgive you for leaving. Your new friends don\'t actually know you. Connection is impossible now—you destroyed it through ambition. Better to stay surface-level with everyone than risk real intimacy that might reject you."',
    },
    costIfUnchecked: [
      'Complete isolation despite being surrounded by people—Successful on paper, dying inside from loneliness because true connection feels impossible',
      'Depression from chronic comparison and guilt cycle—Clinical intervention for relational void and inadequacy that could have been addressed through pattern work',
      'Self-sabotage of success to regain origin relationships—Destroying what you built just to feel like you belong somewhere again',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Evolution Storytelling Practice',
          duration: '20 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly call/video with someone from origin\n2. Share evolution as WE story, not just I:\n   - "Remember when WE..."\n   - "The foundation YOU helped build in me is now..."\n   - "I\'m becoming this BECAUSE of what WE shared"\n3. Ask: "How are YOU evolving?"\n4. Find shared growth, even if paths diverged\n5. Celebrate both journeys\n6. Make next connection date',
          expectedOutcome: 'Inclusive storytelling prevents alienation. Your growth becomes OUR story.',
        },
        {
          name: 'Mutual Celebration Practice',
          duration: '20 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly call with accountability partner (origin OR new circle)\n2. Each person shares:\n   - One win from their week\n   - One win they saw in the OTHER person\n3. Practice genuine celebration:\n   - "I\'m so proud of you for..."\n   - "Your success inspires me to..."\n4. Notice: Their win doesn\'t diminish yours\n5. Close with: "We rise together"',
          expectedOutcome: 'Competition transformed to collaboration. Others\' success becomes inspiration, not threat.',
        },
        {
          name: 'Bridge Person Practice',
          duration: 'Ongoing',
          frequency: 'Ongoing',
          instructions: '1. Ongoing: Find ways to blend origin and evolved circles\n2. Invite origin friend to new environment (with preparation)\n3. Introduce new connections to origin stories\n4. Create belonging in both worlds, not compartmentalization\n5. Show: "My worlds can coexist"\n6. Champion origin relationships in new circles',
          expectedOutcome: 'Worlds integrated. No need to choose between past and future.',
        },
        {
          name: 'Gratitude Circle - Roots Edition',
          duration: '30 minutes',
          frequency: 'Monthly',
          instructions: '1. Monthly: In current circle, speak gratitude for origin people\n2. Tell stories of how they shaped you\n3. Let new connections witness your roots\n4. Send recording/summary to origin people\n5. They hear: You honor them in new spaces\n6. Creates pride, not resentment',
          expectedOutcome: 'Origin people feel included through proxy. Evolution becomes point of pride.',
        },
        {
          name: 'Supportive Scrolling Practice',
          duration: 'Varies',
          frequency: 'Ongoing',
          instructions: '1. Before opening social media: "I\'m here to celebrate others, not compare"\n2. While scrolling: When you see success, COMMENT celebration\n3. Feel genuine happiness for them\n4. Notice shift: Celebration = connection, Comparison = isolation\n5. If comparison thought arises: Close app immediately\n6. Return only when can celebrate genuinely',
          expectedOutcome: 'Social media becomes connection tool. Engagement transforms experience.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When origin relationships trigger guilt AND new relationships trigger comparison simultaneously',
        steps: [
          'TEXT accountability partner (from either circle)',
          '"Caught between worlds. Need reminder I belong in both."',
          'While waiting, speak to yourself:\n   - "My growth doesn\'t erase my roots"\n   - "Their success doesn\'t diminish mine"\n   - "I bridge worlds through connection"',
          'When they respond, receive their reflection',
          'Speak: "I celebrate them AND I honor my journey. I belong in both worlds."',
          'Take one bridge-building action (connect someone from each world, or celebrate someone in each world)',
        ],
      },
    },
    transformationTimeline: {
      week1: 'First bridge-building conversations. Comparison thoughts decreasing when celebrating others.',
      week2: 'Origin relationships feeling less guilty. New relationships feeling less comparative.',
      day30: 'Worlds beginning to integrate. Celebration replacing comparison. Connection replacing isolation.',
      day90: 'Belonging in both worlds. Origin relationships honored. New relationships authentic. New identity: "I bridge worlds through connection. I honor my origins while building my future."',
    },
    premiumTime: '70 minutes weekly + ongoing practices',
    roi: 'Relationships restored, comparison eliminated, connection in all circles, isolation ended',
  },

  // =========================================================================
  // SUCCESS SABOTAGE AVATARS (5)
  // =========================================================================
  {
    id: 'depleted_warrior',
    name: 'The Depleted Warrior',
    primaryPattern: 'success_sabotage',
    subPattern: 'burnout_depletion',
    temperament: 'warrior',
    protocolKey: 'burnout_optimizer',
    shortDescription: 'The Action-Taker running on empty',
    fullDescription: `You're a warrior. You don't overthink—you execute. You don't analyze—you act. You've built impressive things through sheer force of will. But here's the problem: You're operating at 20% capacity because you're running on 0% fuel.

The gap between your potential and your results isn't because you lack capability. It's because you're depleted when capability matters most. You know you should be further along. You see others with less talent achieving more. And it drives you crazy because you know you're capable of more.

But you can't access your potential from an empty tank. You push harder, thinking effort will overcome exhaustion. It doesn't. You show up depleted to your biggest opportunities. You make terrible decisions because your mental gas tank is dry. You execute poorly not because you don't know how, but because you have no energy for excellence.

You're stuck in a brutal cycle: See gap between potential and performance → Push harder to close it → Deplete further → Widen the gap → Push even harder → Crash completely. You're a warrior fighting yourself into depletion, then wondering why you can't win.

Your body is screaming for rest. Your mind says "rest is for the weak." So you override every signal until something breaks—your health, your relationships, or your business. And even then, you think the solution is to push harder.`,
    breakthroughPath: 'Realizing that recovery IS the missing piece to performance, not the obstacle. The gap closes not when you push harder but when you show up fueled. You are a warrior who recovers to conquer.',
    neuralPrinciple: 'Your capacity is limited; your sustainable output requires recovery windows.',
    icon: '⚔️',
    fourPillarAttack: {
      spiritual: '"Your worth is measured by your output. Rest is laziness masquerading as wisdom. Warriors don\'t need recovery—they need victory. That gap between your potential and results? That\'s proof you\'re not pushing hard enough. God helps those who help themselves. Keep pushing."',
      mental: '"Everyone else can handle this load—you\'re just weak. That exhaustion you feel? That\'s failure. Your potential is wasted because you don\'t have what it takes to sustain. The gap exists because you lack the mental fortitude of real warriors."',
      physical: '"Your body is a machine. Those warning lights—chest pain, chronic fatigue, stress symptoms—are for people who don\'t want it bad enough. Real warriors push through. Your physical depletion is proof you\'re soft, not that you need rest."',
      relational: '"They\'ll understand later. Your family knows success requires sacrifice. Connection can wait until you close the gap. Those relationships eroding? That\'s the price of greatness. Keep sacrificing—it\'ll be worth it when you \'make it.\'"',
    },
    costIfUnchecked: [
      'Health crisis that ends your ability to perform—Heart attack, stroke, or breakdown that removes the choice to push, leaving you unable to work at all',
      'Complete family destruction while chasing performance—Divorce finalized, kids estranged, and then you realize the gap you were trying to close doesn\'t matter without them',
      'Business collapse from depleted decision-making—One terrible decision made on empty that costs you everything you built while depleted',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Potential-to-Action Bridge',
          duration: '20 minutes',
          frequency: 'Daily',
          instructions: '1. Morning: Identify one capability not being used\n   - Skill sitting dormant\n   - Knowledge not applied\n   - Strength not leveraged\n2. Ask: "What\'s ONE action that uses this potential TODAY?"\n3. Make it specific and completable\n4. Set 60-minute execution window\n5. Use the potential within that window\n6. Track: Daily potential activated\n7. Celebrate: Potential → Action conversion',
          expectedOutcome: 'Daily action closes potential gap. Unused capability becomes active contribution.',
        },
        {
          name: 'Performance Benchmark Walk',
          duration: '20 minutes',
          frequency: '3x/week',
          instructions: '1. Walk with confidence and power\n2. Visualize performing at full capacity:\n   - Using all your skills\n   - Operating at peak capability\n   - Results matching potential\n3. Feel in body what full activation feels like\n4. Notice resistance or excitement\n5. Ask while walking: "What\'s stopping full activation?"\n6. Let movement reveal blocks\n7. End with declaration: "I activate my full potential"',
          expectedOutcome: 'Physical rehearsal of full capacity. Nervous system trained for peak performance.',
        },
        {
          name: 'Strategic Rest Protocol',
          duration: '15 minutes',
          frequency: 'Daily',
          instructions: '1. Set non-negotiable rest alarm (midday)\n2. STOP work immediately when it sounds\n3. 5 minutes: Physical reset (stretching, walking)\n4. 5 minutes: Mental reset (breathing, eyes closed)\n5. 5 minutes: Speak recovery affirmation\n6. Return with "pit stop complete" mindset\n7. Track: Energy level before vs after rest',
          expectedOutcome: 'Proof that rest = performance. Rest becomes strategic advantage, not weakness.',
        },
        {
          name: 'Weekly Recovery Block',
          duration: '2 hours',
          frequency: 'Weekly',
          instructions: '1. Block 2 hours (non-negotiable, in calendar)\n2. Complete tech detox\n3. Hour 1: Physical recovery (massage, nature, stretching)\n4. Hour 2: Mental recovery (silence, meditation)\n5. End with: "This recovery makes me stronger"\n6. Track completion (goal: 48/52 weeks)',
          expectedOutcome: 'Weekly reset prevents monthly crash. Recovery becomes performance strategy.',
        },
        {
          name: 'Capability Inventory',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. List all capabilities you possess\n   - Skills learned but not using\n   - Strengths present but dormant\n   - Knowledge not applied\n2. For each, ask: "Why am I not using this?"\n3. Identify blocks: Fear? Timing? Energy?\n4. Choose 3 capabilities to activate this week\n5. Create specific action for each\n6. Execute all 3 within week\n7. Track activation rate',
          expectedOutcome: 'Systematic capability activation. Potential converts to performance.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When "I should be further along" thought paralyzes or when pushing through exhaustion',
        steps: [
          'STOP self-criticism and pushing',
          'Stand in power pose',
          'Ask: "Am I depleted right now?"',
          'If yes: "Recovery IS my performance strategy"',
          'Take mandatory 20-minute rest',
          'After rest: "What\'s ONE capability I can use RIGHT NOW?"',
          'Identify smallest potential-to-action step',
          'Set 10-minute timer and activate that potential',
          'Celebrate: Gap narrowed through fueled action',
        ],
      },
    },
    transformationTimeline: {
      week1: 'Notice decreased guilt around rest. Energy slightly higher after recovery practices.',
      week2: 'Performance improving because not depleted. Gap starting to close.',
      day30: 'Operating with fuller tank. Potential activating more consistently. Better decisions.',
      day90: 'Gap closed significantly. Potential activated through energy, not force. New identity: "I am a warrior who recovers to conquer. My rest is my competitive advantage."',
    },
    premiumTime: '77 minutes daily + weekly recovery blocks',
    roi: 'Gap closed, potential activated, performance 10x while working half as hard',
  },
  {
    id: 'analysis_paralysis_pro',
    name: 'The Analysis Paralysis Pro',
    primaryPattern: 'success_sabotage',
    subPattern: 'decision_fatigue',
    temperament: 'sage',
    protocolKey: 'decision_fatigue',
    shortDescription: 'Deep thinker who gets stuck weighing options until opportunities pass',
    fullDescription: `Your sage nature gives you extraordinary capacity for analysis. You see angles others miss, consider factors others ignore. But that gift has become a prison—every decision spawns ten more considerations, every option reveals three more alternatives. By the time you're ready to decide, the moment has often passed.

You've missed opportunities not because you didn't recognize them, but because you were still weighing the pros and cons. While you analyzed, others acted. While you perfected, others shipped. Your wisdom is real—but it's paralyzed by the need for certainty that will never come.

The cruel irony: Your analysis is exhausting you. By the time the important decisions arrive—the ones that actually need your wisdom—your mental capacity is depleted from analyzing everything else. You make terrible choices on the big things because you spent all your decision energy on the small things.

You're stuck in an endless loop: Question → Research → More questions → Deeper research → Even more questions → Decision window closes → Regret → Promise to decide faster next time → Repeat.

Your depth is real. Your capacity for seeing what others miss is genuine. But you've turned your gift into a trap. You don't need more information—you need action that creates clarity.`,
    breakthroughPath: 'Learning that good enough decided beats perfect analyzed. Your wisdom isn\'t in finding the best option; it\'s in moving with imperfect information. Clarity follows commitment, not contemplation.',
    neuralPrinciple: 'Decide fast, correct often. Analysis follows action.',
    icon: '🔍',
    fourPillarAttack: {
      spiritual: '"You need more certainty before deciding. God expects you to make the perfect choice—anything less is poor stewardship. That uncertainty you feel is a sign you\'re not ready. Keep researching until you\'re sure."',
      mental: '"Every option has hidden downsides you haven\'t discovered yet. One wrong decision could ruin everything. Your analysis paralysis is actually wisdom in disguise—only fools decide without complete information."',
      physical: '"Your mental exhaustion proves you care about quality. The stress you feel when deciding is because the stakes are high. Keep analyzing—rushing will only lead to mistakes your body will pay for."',
      relational: '"Others don\'t understand the complexity you see. They judge you for taking time, but they\'ll thank you when you finally make the right choice. Their impatience is their problem, not your wisdom."',
    },
    costIfUnchecked: [
      'Decades of missed opportunities from endless analysis—Looking back at a life of "what ifs" because you were still weighing options when doors closed',
      'Complete mental burnout from decision fatigue—Unable to function because every choice, no matter how small, requires exhausting analysis',
      'Relationships destroyed by inability to commit—Partners, friends, and collaborators who couldn\'t wait for you to finish analyzing',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Morning Decision Meditation',
          duration: '20 minutes',
          frequency: 'Daily',
          instructions: '1. Morning meditation before day begins\n2. First 10 minutes: Clear all mental clutter\n3. Next 5 minutes: Hold top 3 decisions in awareness (don\'t analyze, just hold)\n4. Last 5 minutes: Receive clarity on each\n5. After meditation: Write decisions without overthinking\n6. Act on clarity within 1 hour',
          expectedOutcome: 'Decisions from stillness vs. overthinking. Wisdom access before mental fatigue.',
        },
        {
          name: 'Decision Fast',
          duration: 'Half day to full day',
          frequency: 'Weekly',
          instructions: '1. Weekly: One "decision-free" day or half-day\n2. Pre-decide everything possible (meals, schedule, clothing)\n3. During fast: Make ZERO discretionary choices\n4. Follow predetermined plan exactly\n5. Notice mental energy accumulation\n6. Journal: "When I fast from decisions, I notice..."\n7. Use replenished capacity for major decisions next day',
          expectedOutcome: 'Decision capacity replenishes. Less deciding = better judgment when needed.',
        },
        {
          name: '2-Minute Decision Rule',
          duration: '2 minutes per decision',
          frequency: 'Ongoing',
          instructions: '1. For decisions that don\'t require deep analysis:\n2. Set 2-minute timer\n3. State options out loud\n4. Trust first instinct\n5. Decide before timer ends\n6. Move on immediately—no second-guessing\n7. Track: How many 2-minute decisions per day?',
          expectedOutcome: 'Small decisions become automatic. Mental energy preserved for important choices.',
        },
        {
          name: 'Wisdom Integration Journal',
          duration: '15 minutes',
          frequency: 'Daily',
          instructions: '1. Evening reflection\n2. "Decisions I made today:"\n3. "Decisions I delayed unnecessarily:"\n4. "What made me hesitate:"\n5. "Tomorrow I will decide quickly on:"\n6. Track: Ratio of decided vs. delayed',
          expectedOutcome: 'Self-awareness of paralysis patterns. Accountability to take action.',
        },
        {
          name: 'The Great Silence - Clarity Edition',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. Complete silence for 30 minutes\n2. First 10 minutes: Release need for certainty\n3. Middle 10 minutes: Ask: "What decision am I avoiding? What do I already know?"\n4. Last 10 minutes: Receive answer without analyzing it\n5. After: Write and act within 24 hours',
          expectedOutcome: 'Direct knowing replaces endless analysis. Truth emerges in stillness.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When analysis loop is spiraling and opportunity window is closing',
        steps: [
          'STOP researching immediately',
          'Set 5-minute timer',
          'Write: "The options are: A, B, C"',
          'Write: "My gut says: ___"',
          'Speak: "Good enough decided beats perfect analyzed"',
          'Choose the gut answer',
          'Take first action toward that choice before timer ends',
          'No second-guessing allowed for 24 hours',
        ],
      },
    },
    transformationTimeline: {
      week1: 'Notice when analysis is delaying. Make 3+ decisions using 2-minute rule daily.',
      week2: 'Mental energy preserved. Making faster decisions without regret.',
      day30: 'Decision paralysis recognized immediately. Acting on wisdom, not certainty.',
      day90: 'Analysis serves action, not prevents it. New identity: "I decide from wisdom, then correct. My action creates clarity."',
    },
    premiumTime: '55 minutes daily + weekly practices',
    roi: 'Opportunities seized, mental energy restored, analysis serving action',
  },
  {
    id: 'start_stop_specialist',
    name: 'The Start-Stop Specialist',
    primaryPattern: 'success_sabotage',
    subPattern: 'execution_breakdown',
    temperament: 'connector',
    protocolKey: 'execution_breakdown',
    shortDescription: 'Visionary who inspires others but struggles to finish what they start',
    fullDescription: `You're magnetic—people believe in your vision, buy into your ideas, want to follow you. Your connector nature creates powerful beginnings. But your track record shows a pattern: started strong, faded fast. Projects half-finished, launches that never shipped, intentions that never became actions. You know what to do; you just can't seem to do it.

The passion is real at the start. You can see the vision so clearly. You rally people around it. And then... the middle arrives. The boring parts. The details. The actual work that doesn't feel as exciting as the idea. You get distracted by the next shiny vision before finishing the current one.

Here's the pattern: Exciting new idea → Inspired launch → Team rallied → Middle phase arrives → Boredom sets in → New idea appears → Abandon current for new → Repeat. You've started dozens of things and finished almost nothing.

Your connector nature needs external energy to keep going. But the middle of any project is lonely work. There's no crowd to inspire, no new people to excite, just the grind of execution. And that's where you fade.

You're not lazy—you work hard at the start. You're not uncommitted—you believe in your visions. But you've never learned how to carry momentum through the middle, where most success is actually built.`,
    breakthroughPath: 'Understanding that execution is a separate skill from ideation. Your vision is real; you need systems that carry you through the middle. Inspiration starts; systems finish.',
    neuralPrinciple: 'Inspiration starts; systems finish.',
    icon: '🚀',
    fourPillarAttack: {
      spiritual: '"You\'re meant for visionary work, not execution drudgery. God gave you the gift of ideas—let others handle the boring details. Your purpose is to inspire, not perspire."',
      mental: '"The middle is proof this wasn\'t the right project. If it were truly meant to be, it would stay exciting. That boredom you feel? That\'s your intuition telling you to move on."',
      physical: '"Your energy drop in the middle is your body telling you this isn\'t your thing. Real passion doesn\'t fade. The fatigue is a sign to find something that keeps you energized throughout."',
      relational: '"People loved your vision—they\'ll love the next one too. Their belief was in YOU, not the project. Move on and bring them to something even better."',
    },
    costIfUnchecked: [
      'Reputation destroyed by pattern of abandoned projects—People stop believing in your visions because they\'ve seen too many die in the middle',
      'Financial ruin from endless restarts—Never building on success, always at square one, resources depleted from constant new beginnings',
      'Self-trust collapsed from broken promises—You no longer believe yourself when you commit to finishing something',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Accountability Partner Check-Ins',
          duration: '15 minutes',
          frequency: 'Daily',
          instructions: '1. Daily check-in with accountability partner\n2. Share: "What I committed to doing today"\n3. Share: "What I actually did"\n4. They witness your execution (not just inspiration)\n5. If gap exists: "What stopped me? What will I do differently tomorrow?"\n6. Their role: Hold you to action, not just vision',
          expectedOutcome: 'External accountability through the middle phase. Can\'t hide from unfinished commitments.',
        },
        {
          name: 'Execution Celebration Circle',
          duration: '20 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly call with 3-5 finishers\n2. Each shares: One thing they FINISHED this week (not started—finished)\n3. Group celebrates completions, not visions\n4. You must share a completion to celebrate others\n5. Theme: "We finish what we start"',
          expectedOutcome: 'Social reinforcement for completion, not just inspiration. Community of finishers.',
        },
        {
          name: 'Middle Phase Momentum',
          duration: '30 minutes',
          frequency: 'When boredom hits',
          instructions: '1. When boredom/distraction arrives:\n2. Call accountability partner: "I\'m in the middle and want to quit"\n3. They remind you why you started\n4. They witness your next small step\n5. Do that step while still on call\n6. Hang up only after step is complete',
          expectedOutcome: 'External energy carries you through lonely middle. Connection fuels execution.',
        },
        {
          name: 'Witness Practice - Completion Edition',
          duration: '10 minutes',
          frequency: 'Upon completion',
          instructions: '1. When you finish ANYTHING:\n2. Immediately share with witness\n3. Let them celebrate your completion\n4. Receive their acknowledgment fully\n5. Speak: "I am someone who finishes"\n6. Let their witness strengthen your finisher identity',
          expectedOutcome: 'Social validation for completing, not just inspiring. New identity as finisher.',
        },
        {
          name: 'No New Project Until Finish Protocol',
          duration: 'Ongoing',
          frequency: 'Whenever new idea appears',
          instructions: '1. When exciting new idea appears:\n2. Write it down in "future projects" list\n3. Tell accountability partner about the temptation\n4. Ask: "Is my current project finished?"\n5. If no: Return to current project\n6. If yes: THEN consider new idea\n7. Rule: No new starts until current finish',
          expectedOutcome: 'New ideas captured but not acted on. Discipline to finish before starting.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When new shiny idea is pulling you away from unfinished project',
        steps: [
          'STOP entertaining the new idea',
          'Text accountability partner: "Shiny new idea. Help me stay."',
          'Write new idea in future list (it\'s not lost)',
          'Ask: "What\'s the smallest next step on current project?"',
          'Do that step immediately (while waiting for response)',
          'Report: "Step done. Staying on current project."',
          'Speak: "I finish what I start. This vision deserves completion."',
        ],
      },
    },
    transformationTimeline: {
      week1: 'Accountability partner in place. Noticing when middle-phase boredom hits.',
      week2: 'First project pushed through the middle with external support.',
      day30: 'Multiple completions. Beginning to trust self to finish. New shiny ideas captured, not acted on.',
      day90: 'Finisher reputation established. Systems carry you through middles. New identity: "I inspire to start AND execute to finish."',
    },
    premiumTime: '45 minutes daily + weekly practices',
    roi: 'Reputation restored, visions completed, self-trust rebuilt, execution muscle developed',
  },
  {
    id: 'perfectionist_in_hiding',
    name: 'The Perfectionist in Hiding',
    primaryPattern: 'success_sabotage',
    subPattern: 'execution_breakdown',
    temperament: 'builder',
    protocolKey: 'perfectionist_paralysis',
    shortDescription: 'Skilled builder whose need for perfection prevents launching anything',
    fullDescription: `You have the technical skill to build remarkable things. Your builder nature craves completion, structure, excellence. But that same drive has become a trap—nothing is ever quite ready, every project needs "just a bit more polish," every launch feels premature. You're not procrastinating; you're perfecting into oblivion.

Your standards are high—and that's usually a virtue. But you've weaponized them against yourself. Every flaw you see becomes reason to delay. Every imperfection becomes proof you're not ready. You hold yourself to a standard that means nothing ever ships.

The world has projects of yours that could help people right now. But they're sitting in draft mode, 80% complete, waiting for a perfection that will never come. Meanwhile, competitors with lower standards are shipping and winning while you polish.

Here's the truth you're avoiding: Your perfectionism is fear in disguise. You're not actually pursuing excellence—you're avoiding judgment. If it never launches, it can never fail. If it's never finished, it can never be criticized. Your "high standards" are armor against vulnerability.

You're a builder who has forgotten that the point is to build things people use, not things that meet your impossible internal criteria. Done beats perfect. Every time.`,
    breakthroughPath: 'Embracing "done is better than perfect" as a builder\'s truth, not a compromise. The world needs your work, not your polish. Shipped beats polished. Every time.',
    neuralPrinciple: 'Shipped beats polished. Every time.',
    icon: '🛠️',
    fourPillarAttack: {
      spiritual: '"Excellence is godliness. Anything less than perfect is unworthy of your calling. God expects your best—and this isn\'t your best yet. Keep polishing until it\'s worthy."',
      mental: '"If you launch with flaws, everyone will see you\'re not as capable as they thought. Your reputation depends on perfection. That imperfection you see? Everyone else will see it too."',
      physical: '"Your stress about imperfections proves you care about quality. That tension is what separates great builders from average ones. The physical cost is worth the excellence."',
      relational: '"People are counting on you to deliver perfection. If you ship something imperfect, you\'ll disappoint them. Better to delay than to fail their expectations."',
    },
    costIfUnchecked: [
      'Lifetime of unshipped projects that could have helped thousands—Portfolio of perfect drafts that never saw daylight while imperfect competitors changed the world',
      'Paralysis extending to all areas of life—Can\'t ship work, can\'t commit to relationships, can\'t make decisions because nothing is ever good enough',
      'Identity collapse when perfection proves impossible—Breaking point when you finally realize perfection was always an illusion, and you wasted decades chasing it',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Ship It Schedule',
          duration: '10 minutes',
          frequency: 'Daily',
          instructions: '1. Morning: Identify ONE thing you will ship TODAY\n2. Set specific ship time (not "by end of day"—exact time)\n3. At ship time: Ship it regardless of state\n4. "Ship" = make it live, send it, publish it, deliver it\n5. Track: Daily shipping streak\n6. Rule: Nothing gets more than 3 days of polish',
          expectedOutcome: 'Shipping becomes daily habit. Perfection loses power to delay.',
        },
        {
          name: '80% Launch Protocol',
          duration: 'Ongoing',
          frequency: 'For every project',
          instructions: '1. Define "80% complete" criteria at project start\n2. When 80% is reached: LAUNCH IMMEDIATELY\n3. No additional polish allowed before launch\n4. Improvements happen AFTER launch, not before\n5. Document: What was launched at 80%?\n6. Track: Did the world end? (Spoiler: No)',
          expectedOutcome: 'Proof that 80% is enough. Perfectionism exposed as unnecessary.',
        },
        {
          name: 'Imperfection Exposure',
          duration: '15 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly: Intentionally ship something imperfect\n2. Make a deliberate "flaw" visible (typo, rough edge, unpolished element)\n3. Watch: Does anyone notice or care?\n4. Journal: "I shipped imperfect work and..."\n5. Build tolerance for imperfection through exposure',
          expectedOutcome: 'Fear of imperfection reduced. World doesn\'t end when things aren\'t perfect.',
        },
        {
          name: 'Builder\'s Daily Metrics',
          duration: '5 minutes',
          frequency: 'Daily',
          instructions: '1. Track daily:\n   - Things shipped (launched, delivered, published)\n   - Things perfected (still being polished)\n2. Goal: Shipped > Perfected every day\n3. If Perfected > Shipped: Emergency protocol\n4. Weekly: Calculate shipping ratio\n5. Target: 80%+ shipping ratio',
          expectedOutcome: 'Data proves perfectionism is costing you. Numbers don\'t lie about delays.',
        },
        {
          name: 'The Daily Office - Shipping Edition',
          duration: '5 minutes',
          frequency: '3x daily',
          instructions: '1. Set 3 daily alarms (Morning, Midday, Evening)\n2. At each alarm, recite:\n   - Morning: "Today I ship, not polish. Done beats perfect."\n   - Midday: "What am I about to ship? What am I delaying?"\n   - Evening: "I shipped: [list]. Tomorrow I ship: [list]."',
          expectedOutcome: 'Ritual reinforcement of shipping identity. Consistent redirection from perfectionism.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When "just one more thing" is delaying a launch that\'s already good enough',
        steps: [
          'STOP all polish activities',
          'Set 5-minute timer',
          'Ask: "If I die tomorrow, would I regret not shipping this?"',
          'Ask: "Will this extra polish actually matter to users?"',
          'Answer is almost always: "Ship it now"',
          'SHIP IT before timer ends',
          'Speak: "Shipped beats polished. I am a builder who ships."',
          'Celebrate the launch, not the perfection',
        ],
      },
    },
    transformationTimeline: {
      week1: 'Ship at least 3 things that felt "not ready." Notice world doesn\'t end.',
      week2: 'Shipping becoming more automatic. Perfectionism recognized when it appears.',
      day30: 'Multiple launches at 80%. Backlog of unshipped work clearing. Confidence in shipping.',
      day90: 'Builder identity = shipper identity. Perfectionism is recognized and overridden. New identity: "I ship. Done beats perfect. The world needs my work, not my polish."',
    },
    premiumTime: '35 minutes daily',
    roi: 'Projects finally launched, perfectionism eliminated, builder reputation established',
  },
  {
    id: 'high_functioning_burnout',
    name: 'The High-Functioning Burnout',
    primaryPattern: 'success_sabotage',
    subPattern: 'burnout_depletion',
    temperament: 'sage',
    protocolKey: 'high_functioning_burnout',
    shortDescription: 'Wise mentor running on fumes while helping everyone else',
    fullDescription: `Everyone comes to you for wisdom. Your sage nature makes you the person people trust to think clearly, guide wisely, and hold space. But you've given so much that you're running on empty. You know about self-care (you probably teach it), but you've exempted yourself from your own advice. You're depleted and nobody knows because you're too good at appearing fine.

The irony is painful: You counsel others on rest. You teach boundaries. You guide people toward balance. And then you go home and operate completely contrary to everything you know. Your wisdom is real—you just don't apply it to yourself.

You've built an identity around being the wise, available, grounded presence. But that identity has become a prison. Taking rest feels like abandoning your role. Setting boundaries feels like failing the people who need you. So you keep giving from an empty cup, and the quality of what you offer is secretly declining.

Here's what you won't admit: You use other people's problems to avoid your own. Being the wise helper is easier than being the one who needs help. Your sage identity has become a shield against your own vulnerability. And it's killing you slowly.

You're the most burnout expert on burnout. But expertise hasn't translated to practice. You need to apply your own wisdom to yourself—or you'll burn out teaching others how to avoid burnout.`,
    breakthroughPath: 'Applying your own wisdom to yourself. The same advice you give others—rest, boundaries, recovery—is not optional for you. You can\'t pour from an empty cup. Your wisdom becomes authentic when you live it.',
    neuralPrinciple: 'Your wisdom becomes authentic when you live it.',
    icon: '🦉',
    fourPillarAttack: {
      spiritual: '"They need you. How can you rest when others are suffering? Your calling is to serve. Self-care is selfish when there are people who depend on your wisdom."',
      mental: '"You\'re fine. You\'ve survived this long. The tiredness you feel is normal—everyone\'s tired. Your ability to keep functioning proves you don\'t really need rest."',
      physical: '"Your body can handle it. You\'ve pushed through before. Those warning signs are just stress—everyone has stress. Real burnout looks different from this."',
      relational: '"If you set boundaries, they\'ll find someone else. Your value is in your availability. The moment you say no, they\'ll see you\'re not as wise as they thought."',
    },
    costIfUnchecked: [
      'Complete collapse requiring forced sabbatical—Unable to serve anyone because you ignored every warning sign, leaving those who depend on you without support',
      'Wisdom quality declining without noticing—Giving advice from depletion that actually harms instead of helps, reputation damaged',
      'Spiritual crisis when empty cup finally shatters—Questioning everything you taught when you realize you never practiced it yourself',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Authentic Wisdom Journaling',
          duration: '20 minutes',
          frequency: 'Daily',
          instructions: '1. Morning contemplative writing\n2. "The advice I give others that I\'m not taking:"\n3. "Why I exempt myself from my own wisdom:"\n4. "What I would tell a client in my exact situation:"\n5. "The one thing I must do today to practice what I preach:"\n6. Take that action before noon',
          expectedOutcome: 'Hypocrisy exposed gently. Self-application of wisdom begins.',
        },
        {
          name: 'Lectio Divina on Rest',
          duration: '20 minutes',
          frequency: '3x/week',
          instructions: '1. Lectio: Read rest scriptures (Matthew 11:28-30, Psalm 23, Mark 6:31)\n2. Meditatio: Let phrase about divine rest emerge\n3. Oratio: Dialogue about your resistance to rest\n4. Contemplatio: Rest in divine permission to not be needed\n5. Actio: Take one restorative action as spiritual practice',
          expectedOutcome: 'Spiritual permission to rest. Rest becomes holy, not selfish.',
        },
        {
          name: 'Boundary Practice',
          duration: 'Ongoing',
          frequency: 'Daily',
          instructions: '1. Say "no" to one request per day\n2. Not emergencies—just requests you would normally say yes to\n3. Notice: Does the world end?\n4. Track: Nos said this week\n5. Goal: Average 1 no per day\n6. Observe: Energy preserved from each no',
          expectedOutcome: 'Proof that boundaries work. Others survive your no. Energy preserved.',
        },
        {
          name: 'Sabbath Practice',
          duration: '4 hours to full day',
          frequency: 'Weekly',
          instructions: '1. Weekly: Block 4+ hours of non-work, non-helping time\n2. No advice-giving allowed during this time\n3. No being "on" for anyone\n4. Complete rest: nature, silence, pleasure, play\n5. When guilt arises: "This is practicing what I preach"\n6. Track: Hours of true sabbath per week',
          expectedOutcome: 'Regular recovery. Walking the talk on rest. Wisdom becoming lived.',
        },
        {
          name: 'Empty Cup Awareness',
          duration: '5 minutes',
          frequency: 'Before each helping interaction',
          instructions: '1. Before giving wisdom/help:\n2. Pause and check: "What\'s my cup level right now?" (1-10)\n3. If below 5: "I cannot give from empty"\n4. Either: Delay the help, give less than asked, or take care of self first\n5. Track: Cup level throughout day\n6. Rule: No helping below cup level 5',
          expectedOutcome: 'Self-awareness before giving. Only pour from full-enough cup.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When you feel completely depleted but someone is asking for your wisdom',
        steps: [
          'PAUSE before responding',
          'Check cup level: "Am I above 5?"',
          'If no: "I need to take care of myself before I can help you properly"',
          'Reschedule or refer them to someone else',
          'Immediately take 20 minutes of restorative activity',
          'Speak: "I am not abandoning them. I am being honest about my capacity."',
          'Journal: "I set a boundary and the world didn\'t end."',
        ],
      },
    },
    transformationTimeline: {
      week1: 'First "no" said without catastrophe. Noticing depletion patterns.',
      week2: 'Sabbath practice established. Guilt around rest decreasing.',
      day30: 'Boundaries becoming natural. Wisdom quality improving because giving from fuller cup.',
      day90: 'Authentic integration of wisdom and practice. Others see you resting and are inspired. New identity: "I live my wisdom. My rest is part of my teaching."',
    },
    premiumTime: '45 minutes daily + weekly sabbath',
    roi: 'Burnout reversed, authentic wisdom, sustainable service, boundaries established',
  },

  // =========================================================================
  // COMPASS CRISIS AVATARS (5)
  // =========================================================================
  {
    id: 'comparison_trap_victim',
    name: 'The Comparison Trap Victim',
    primaryPattern: 'compass_crisis',
    subPattern: 'comparison_catastrophe',
    temperament: 'warrior',
    protocolKey: 'comparison_catastrophe',
    shortDescription: 'Competitive driver who measures wins against everyone else\'s highlight reels',
    fullDescription: `Your warrior nature makes you competitive—you want to win. But you've turned that drive against yourself. Every win is immediately compared to someone else's bigger win. Every achievement is discounted because someone somewhere has done more. Social media is a torture device disguised as inspiration. You're running a race where the finish line keeps moving.

You can't enjoy your victories because the moment you achieve something, your eyes shift to what others have. Made $200K? Someone made $500K. Launched a successful product? Someone launched a bigger one. Got featured in a publication? Someone got featured in a better one.

The competitive fire that could fuel you is instead burning you alive. You're never satisfied, never at rest, never at peace—because there's always someone ahead. Your warrior nature needs competition to thrive, but you've aimed that competition at an unwinnable game.

Here's the trap: You're comparing your behind-the-scenes to everyone else's highlight reel. You're comparing your current chapter to someone else's finale. You're competing against a fiction while dismissing your reality.

Your progress is real. Your growth is genuine. Your wins matter. But you can't see any of it because you're too busy looking at someone else's scoreboard.`,
    breakthroughPath: 'Learning that your only competition is who you were yesterday. The comparison trap is a game you cannot win—and do not need to play. Your progress is personal. The only scoreboard that matters is your own.',
    neuralPrinciple: 'Your progress is personal. The only scoreboard that matters is your own.',
    icon: '🏆',
    fourPillarAttack: {
      spiritual: '"You\'re not special. Others are more blessed. Your calling pales next to theirs. God gave them more talent, more opportunity, more favor. You\'re behind spiritually too."',
      mental: '"Look at where they are compared to you. Same age, same industry, better results. Your achievement is mediocre at best. The gap proves you\'re not as capable as you thought."',
      physical: '"They\'re working harder than you. They\'re more disciplined. Your body isn\'t performing at their level because you\'re not at their level. Push harder to catch up."',
      relational: '"Their relationships look better than yours. Their network is stronger. Their team is more impressive. You\'re surrounded by people who can\'t help you catch up."',
    },
    costIfUnchecked: [
      'Lifetime of joyless achievement—Winning constantly but never feeling satisfied because the comparison treadmill never stops',
      'Depression from chronic inadequacy—Clinical intervention for the mental health crisis caused by perpetual not-enough-ness',
      'Relationships destroyed by competition—Treating partners, friends, and collaborators as rivals instead of allies',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Personal Best Tracking',
          duration: '10 minutes',
          frequency: 'Daily',
          instructions: '1. Create "Personal Best" tracking board (physical/visible)\n2. Categories: Daily wins, Skills improving, Progress made, Personal records\n3. Daily: Add today\'s personal best\n4. "Better than yesterday in [specific way]"\n5. No comparison to others allowed\n6. Only you vs. you metrics\n7. Weekly: Review progress trajectory\n8. Speak daily: "My only competition is yesterday\'s me"',
          expectedOutcome: 'Competition redirected internally. Others\' success becomes irrelevant when racing self.',
        },
        {
          name: 'Blinder Walk Practice',
          duration: '20 minutes',
          frequency: '3x/week',
          instructions: '1. Walk with purpose, eyes forward only\n2. Actively practice NOT looking at others:\n   - No comparing pace to other walkers\n   - No comparing possessions\n3. When comparison thought arises:\n   - Notice it: "There\'s comparison"\n   - Return eyes forward\n4. Speak while walking: "I stay in my lane"\n5. Last 5 minutes: Feel the freedom of not comparing',
          expectedOutcome: 'Physical training creates mental habit. Forward focus becomes automatic.',
        },
        {
          name: 'Social Media Detox Protocol',
          duration: 'Varies',
          frequency: 'Ongoing',
          instructions: '1. Identify comparison trigger platforms/accounts\n2. Implement boundaries:\n   - No social media before 12pm\n   - Time limit: 20 minutes max daily\n   - Unfollow/mute comparison triggers\n3. Before opening any platform: State purpose\n4. Complete purpose, close app\n5. After use: Check internal state (Inspired vs Inadequate)\n6. Track: Days without comparison spiral',
          expectedOutcome: 'Environmental control eliminates triggers. Comparison opportunities reduced 80%.',
        },
        {
          name: 'Victory Rehearsal Practice',
          duration: '10 minutes',
          frequency: 'Daily',
          instructions: '1. Visualize YOUR victories in vivid detail:\n   - Achieving your specific goals\n   - Celebrating your unique wins\n   - Others celebrating YOU (not comparing to them)\n2. Feel the emotions of YOUR success\n3. Notice: Your wins don\'t require anyone else losing\n4. Speak: "My success is not dependent on their failure"\n5. Let yourself want what YOU want (not what they have)',
          expectedOutcome: 'Internal validation strengthens. External comparison loses power.',
        },
        {
          name: 'Gratitude for Your Journey',
          duration: '5 minutes',
          frequency: 'Evening',
          instructions: '1. Write 3 things you\'re grateful for about YOUR journey today\n2. Not compared to anyone else\'s\n3. Specific to your progress, your circumstances, your path\n4. End with: "My journey is unique and worthy"\n5. Track: Days of journey gratitude',
          expectedOutcome: 'Appreciation for own path grows. Others\' paths become irrelevant.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When you catch yourself in comparison spiral feeling inadequate',
        steps: [
          'STOP scrolling/looking immediately',
          '20 jumping jacks (break the thought pattern)',
          'Speak out loud: "Their highlight reel isn\'t my movie"',
          'Name 3 personal wins from this week (any size)',
          'Power pose for 30 seconds',
          'Declare: "I\'m exactly where I need to be"',
          'Return to YOUR work, not their showcase',
        ],
      },
    },
    transformationTimeline: {
      week1: 'Notice comparison thoughts without acting on them. Personal Best tracking started.',
      week2: 'Social media triggers reduced. Beginning to celebrate own wins without discounting.',
      day30: 'Comparison spirals rare. Personal progress visible. Joy in own achievements.',
      day90: 'Comparison trap escaped. Racing only against yesterday\'s self. New identity: "I compete with myself. My progress is personal. Others\' success is irrelevant to my journey."',
    },
    premiumTime: '45 minutes daily',
    roi: 'Joy restored, comparison eliminated, victories celebrated, personal progress visible',
  },
  {
    id: 'purpose_seeker',
    name: 'The Purpose Seeker',
    primaryPattern: 'compass_crisis',
    subPattern: 'motivation_collapse',
    temperament: 'sage',
    protocolKey: 'motivation_collapse',
    shortDescription: 'Deep thinker who\'s lost the fire for goals that once excited them',
    fullDescription: `You used to be driven by a clear vision. Your sage nature loved the depth and meaning of your mission. But somewhere along the way, the fire went out. The goal that once excited you now feels like obligation. You're going through the motions, wondering if you're building toward the wrong thing entirely. The motivation isn't low—it's collapsed.

You wake up and don't want to work on the thing you used to be passionate about. Meetings that used to energize you now drain you. The vision that was crystal clear has become foggy. You're not burned out—you're burned through the meaning.

Here's what happened: Somewhere along the way, you disconnected from the "why." Maybe the original reason became buried under success. Maybe the goal evolved but you didn't update your motivation. Maybe you achieved what you wanted and found it empty. Whatever the cause, you're now running on obligation rather than inspiration.

Your sage nature needs deep meaning to function. You can't just grind through—you need to know it matters. Without that meaning, the motivation collapses entirely. You're not lazy; you're disconnected from purpose.

The goal might need to change, or your relationship to it might need to change. But something needs to shift, because you can't sustain work that doesn't connect to meaning.`,
    breakthroughPath: 'Reconnecting with the "why" beneath the "what." Your motivation collapsed because you lost the meaning, not the method. Purpose isn\'t found; it\'s created through aligned action. Find what actually matters to you now.',
    neuralPrinciple: 'Purpose isn\'t found; it\'s created through aligned action.',
    icon: '🧭',
    fourPillarAttack: {
      spiritual: '"You never had a real calling—that was just enthusiasm. Real purpose doesn\'t fade. If this was meant to be, you\'d still feel it. Maybe you\'re not called to anything significant."',
      mental: '"Everyone else seems so clear about their purpose. Your confusion proves you\'re not cut out for meaningful work. Just accept that some people have purpose and some don\'t."',
      physical: '"Your body\'s exhaustion is proof you\'re on the wrong path. Real purpose energizes. This fatigue is your body telling you to give up and do something easier."',
      relational: '"The people around you seem fulfilled. You\'re the only one feeling lost. Better to hide your purposelessness than admit you don\'t know what you\'re doing."',
    },
    costIfUnchecked: [
      'Decades of meaningless achievement—Success on paper, hollow in soul, never finding what actually matters to you',
      'Clinical depression from chronic purposelessness—Medical intervention for existential crisis that could have been addressed through purpose work',
      'Life on autopilot until it\'s too late—Waking up at 60 realizing you never asked what you actually wanted',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Authentic Desire Meditation',
          duration: '20 minutes',
          frequency: 'Daily',
          instructions: '1. Morning meditation in complete quiet\n2. First 5 minutes: Release all external expectations\n   - What you think you should want\n   - What looks impressive\n   - What others expect\n3. Middle 10 minutes: Ask in silence:\n   - "What do I authentically desire?"\n   - "What would I pursue if no one knew?"\n   - "What makes me feel alive?"\n4. Last 5 minutes: Receive whatever emerges\n5. After: Journal what emerged without censorship',
          expectedOutcome: 'Authentic motivation revealed beneath layers of "should." True desire emerges in stillness.',
        },
        {
          name: 'Lectio Divina on Calling',
          duration: '20 minutes',
          frequency: '3x/week',
          instructions: '1. Lectio: Read calling scriptures (Jeremiah 29:11, Ephesians 2:10, Proverbs 16:9)\n2. Meditatio: Let phrase about your unique purpose emerge\n3. Oratio: Dialogue about lost motivation\n   - "Why have I lost fire?"\n   - "What am I meant to do?"\n   - "Give me eyes to see my true calling"\n4. Contemplatio: Rest in divine purpose for your life\n5. Actio: Take one action aligned with authentic calling',
          expectedOutcome: 'Divine clarity on authentic purpose. Permission to release inauthentic goals.',
        },
        {
          name: 'Purpose Journaling - Uncensored',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly deep journaling session\n2. Prompts:\n   - "What I\'m building toward feels empty because..."\n   - "If I\'m brutally honest, I don\'t actually want..."\n   - "What I would do if no one was watching..."\n   - "The life that would actually fulfill me..."\n   - "Permission I need to give myself..."\n3. Write until truth emerges\n4. Honor what\'s revealed without judgment',
          expectedOutcome: 'Truth on paper reveals motivation collapse source. Authentic desires identified.',
        },
        {
          name: 'Wisdom Literature Study',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly: Read about others who found authentic purpose\n2. Focus on: Journey from lost to found\n3. Questions while reading:\n   - How did they reconnect to authentic desire?\n   - What permission did they give themselves?\n   - What shifted for them?\n4. Journal insights and apply to your situation',
          expectedOutcome: 'Others\' stories illuminate path. Inspiration reignites possibility.',
        },
        {
          name: 'The Great Silence - Purpose Edition',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. Complete silence for 30 minutes\n2. First 10 minutes: Release all should motivations\n3. Middle 10 minutes: Ask: "What do I authentically want?"\n4. Last 10 minutes: Listen for your true voice\n5. After: Journal whatever emerged\n6. Honor what YOUR heart wants, not what impresses others',
          expectedOutcome: 'Authentic desires revealed. Comparison-driven goals recognized and released.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When complete disconnection from purpose threatens',
        steps: [
          'STOP all activity',
          'Close eyes, hand on heart',
          'Breathe and ask: "What do I authentically want?"',
          'Don\'t analyze, just listen',
          'First quiet answer is often truth',
          'Journal it immediately',
          'Honor that truth with one small action',
        ],
      },
    },
    transformationTimeline: {
      week1: 'First glimpses of authentic desire. Permission to question current path.',
      week2: 'Clarity on what you DON\'T want. Space opening for what you DO want.',
      day30: 'Authentic motivation emerging. Either renewed commitment to current path or clarity on new one.',
      day90: 'Purpose reconnected. Fire restored. Work connected to meaning. New identity: "I pursue what authentically matters to me. My purpose is clear and lived."',
    },
    premiumTime: '60 minutes daily + weekly practices',
    roi: 'Purpose restored, motivation renewed, authentic path clarified, meaning reconnected',
  },
  {
    id: 'jack_of_all_trades',
    name: 'The Jack of All Trades',
    primaryPattern: 'compass_crisis',
    subPattern: 'performance_liability',
    temperament: 'connector',
    protocolKey: 'performance_liability',
    shortDescription: 'Multi-talented connector who\'s good at everything but great at nothing',
    fullDescription: `Your connector nature means you adapt to whoever you're with, whatever's needed. You can do a lot of things well—and that's become your problem. You're spread across so many skills, interests, and possibilities that you've never gone deep enough to become truly excellent at any one thing. Others see your potential; you see a scattered mess.

You're the person people call when they need something done—anything done. You can handle sales, operations, marketing, customer service. You're competent at everything. But competence isn't mastery, and deep down, you know you're a mile wide and an inch deep.

Your adaptability was an asset early on. Now it's a trap. Every time you start to go deep on one skill, another opportunity calls you away. Every time you're about to become truly excellent, you get pulled to be "good enough" at something else.

Here's the gap: You have more potential than results. You know you're capable of more. You see others with less raw talent achieving more because they focused. But your connector nature keeps you flexible, keeps you adapting, keeps you spreading yourself thin.

The world doesn't reward generalists at the level you're capable of. It rewards specialists who are truly excellent at one thing. You have the capacity for excellence—but you've distributed it across too many domains to achieve it anywhere.`,
    breakthroughPath: 'Choosing mastery over versatility. You don\'t need more options; you need fewer. Depth beats breadth when you\'re building something that matters. Excellence requires commitment to one path, not competence across many.',
    neuralPrinciple: 'Excellence requires commitment to one path, not competence across many.',
    icon: '🎭',
    fourPillarAttack: {
      spiritual: '"Your versatility is a gift. You\'re meant to serve in multiple ways. Focusing on one thing would waste all your other talents. God made you adaptable for a reason."',
      mental: '"What if you pick the wrong thing to focus on? Better to keep options open. Your generalism is actually wisdom—specialists are one-trick ponies."',
      physical: '"Your body is designed for variety. Doing one thing would bore you into depression. That restlessness you feel when focusing too long is your body telling you to diversify."',
      relational: '"People need you for so many things. If you specialize, you\'ll lose connections. Your value is in your versatility—that\'s what makes you indispensable."',
    },
    costIfUnchecked: [
      'Lifetime of unfulfilled potential—Being "pretty good" at everything but excellent at nothing, watching specialists achieve what you could have',
      'Career stagnation from lack of depth—Passed over for promotions, partnerships, and opportunities because you never became truly excellent at anything',
      'Identity crisis as generalism stops working—Market shifts toward specialization, leaving your jack-of-all-trades approach obsolete',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Potential Partnership Calls',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly call with potential activation partner\n2. Each person shares:\n   - One capability not being fully used\n   - Why it\'s sitting dormant\n   - One activation action for this week\n   - Support needed to activate\n3. Partner reflects:\n   - "I see this potential in you: [specific]"\n   - "Your activation matters because..."\n   - "I\'ll hold you accountable to..."',
          expectedOutcome: 'Partnership accountability activates dormant potential. Can\'t hide unused gifts.',
        },
        {
          name: 'Focus Declaration',
          duration: '10 minutes',
          frequency: 'Daily',
          instructions: '1. Morning: Name the ONE thing you\'re going deep on\n2. Write: "Today I focus on [skill/domain]"\n3. When other opportunities call:\n   - "Not right now. I\'m going deep on [focus]"\n4. Track: Hours spent on focus area vs. distractions\n5. Goal: 80%+ of work time on focus area',
          expectedOutcome: 'Depth over breadth practiced daily. Specialist identity forming.',
        },
        {
          name: 'Activation Circle',
          duration: '60 minutes',
          frequency: 'Monthly',
          instructions: '1. Monthly gathering of 4-6 high-capacity people\n2. Theme: "Activating our full potential"\n3. Round 1: Each shares unused capability\n4. Round 2: Group reflects potential they see\n5. Round 3: Each commits to one activation action\n6. Group holds them accountable\n7. Next gathering: Report on activation',
          expectedOutcome: 'Tribe sees potential you can\'t see. Collective witness creates activation obligation.',
        },
        {
          name: 'Say No to Good',
          duration: 'Ongoing',
          frequency: 'Daily',
          instructions: '1. When good opportunity arises (but not focus area):\n2. Ask: "Is this aligned with my focus?"\n3. If no: "I appreciate the opportunity, but I\'m going deep on [focus]"\n4. Track: Nos said to good opportunities\n5. Celebrate: Each no is focus preserved',
          expectedOutcome: 'Good opportunities declined in service of great mastery. Focus protected.',
        },
        {
          name: 'Public Commitment to Focus',
          duration: '15 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly: Tell someone your focus area\n2. "I\'m building mastery in [specific skill]"\n3. Ask: "Will you hold me accountable to staying focused?"\n4. Let them ask: "How\'s the focus going?"\n5. Report progress on depth, not breadth',
          expectedOutcome: 'Social accountability for specialization. Others witness your depth commitment.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When potential-performance gap creates overwhelm or when tempted to scatter',
        steps: [
          'TEXT accountability partner: "Need activation support"',
          'Share: "I have [capability] but I\'m not using it because..."',
          'Ask: "Remind me why focus matters"',
          'When they respond, receive their belief in your potential',
          'Let their vision activate yours',
          'Take one activation action within hour',
          'Report back: "I focused. I went deep."',
        ],
      },
    },
    transformationTimeline: {
      week1: 'Focus area identified. First week of intentional depth over breadth.',
      week2: 'Saying no to good opportunities. Hours on focus area increasing.',
      day30: 'Noticeable improvement in focus area. Generalist temptation decreasing. Known for one thing.',
      day90: 'Mastery visible in focus area. Specialist identity formed. New identity: "I am excellent at [focus]. Depth beats breadth. I chose mastery over versatility."',
    },
    premiumTime: '55 minutes daily + monthly practices',
    roi: 'Mastery achieved, potential activated, focus established, excellence in one domain',
  },
  {
    id: 'waiting_for_clarity',
    name: 'The Waiting-for-Clarity',
    primaryPattern: 'compass_crisis',
    subPattern: 'motivation_collapse',
    temperament: 'builder',
    protocolKey: 'clarity_seeker',
    shortDescription: 'Systematic builder waiting for certainty that will never come',
    fullDescription: `Your builder nature craves structure—a clear plan, defined steps, measurable outcomes. But you've been stuck waiting for clarity that keeps not arriving. You don't want to build the wrong thing, so you're building nothing. Every path has risks, so you've chosen no path. The motivation hasn't failed; it's frozen in indecision.

You know you need to move, but you can't move without knowing where you're going. And you can't know where you're going without moving. You're trapped in a paradox that your builder brain can't solve through analysis.

Here's what you're not admitting: Clarity doesn't precede commitment—it follows it. You're waiting for a certainty that comes only after you start moving. But your builder nature needs the plan before the action, creating a loop that keeps you stuck.

You have the capacity to build remarkable things. Your systematic mind is an asset. But you've made it a prerequisite to have perfect clarity before building anything. And perfect clarity is a fantasy.

The most successful builders started with incomplete information and figured it out along the way. They didn't wait for the whole staircase to be visible—they took the first step in partial darkness. You need to learn to build while uncertain.`,
    breakthroughPath: 'Understanding that clarity comes from commitment, not contemplation. You don\'t need to see the whole staircase; you need to take the first step. Clarity follows commitment. Act, then adjust.',
    neuralPrinciple: 'Clarity follows commitment. Act, then adjust.',
    icon: '📐',
    fourPillarAttack: {
      spiritual: '"You can\'t build the wrong thing—that would dishonor God\'s plan for you. Wait until He makes it clear. Acting without clarity is presumption, not faith."',
      mental: '"What if you invest years in the wrong direction? Better to wait for certainty. Your hesitation is wisdom, not weakness. Clear thinkers wait for clear plans."',
      physical: '"Your body freezing is its way of protecting you from wasting energy on the wrong thing. That paralysis is preservation, not procrastination."',
      relational: '"If you act without clarity and fail, everyone will see. Better to wait and be seen as thoughtful than act and be seen as foolish."',
    },
    costIfUnchecked: [
      'Lifetime of waiting while others build—Watching people with less capacity create what you could have because they started without perfect clarity',
      'Builder identity dies unused—The systematic capacity that could have created something remarkable sits dormant because the plan was never perfect enough',
      'Paralysis spreads to all decisions—Can\'t commit to relationships, locations, or opportunities because none of them offer the certainty you demand',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Purpose Audit System',
          duration: '60 minutes',
          frequency: 'Quarterly',
          instructions: '1. Complete purpose audit\n2. Create assessment spreadsheet:\n   - Current goals/projects\n   - Alignment with authentic desire (1-10)\n   - Energy level when working on each (1-10)\n   - "Would I do this for free?" (Yes/No)\n   - Keep/Pivot/Delete decision\n3. Calculate: Alignment score for whole life\n4. Goals below 6 alignment = reconsider\n5. Make decisions based on data, then ACT',
          expectedOutcome: 'Data reveals misalignment. Systematic course correction toward action.',
        },
        {
          name: 'First Step Protocol',
          duration: '15 minutes',
          frequency: 'Daily',
          instructions: '1. Morning: Identify ONE thing you\'ve been waiting on clarity for\n2. Ask: "What\'s the smallest first step I can take TODAY?"\n3. Not planning, not researching—actual first step\n4. Take that step before noon\n5. Track: First steps taken this week\n6. Observe: Does clarity increase AFTER the step?',
          expectedOutcome: 'Proof that action creates clarity. Movement reveals information waiting doesn\'t.',
        },
        {
          name: 'Clarity-Through-Action Experiments',
          duration: '30 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly: Run one small experiment on an uncertain path\n2. Low stakes, limited time investment\n3. Goal: LEARN, not succeed\n4. After experiment:\n   - "What did this teach me?"\n   - "Am I clearer now than before?"\n5. Let experiments create clarity rather than waiting for clarity to permit experiments',
          expectedOutcome: 'Experiments prove clarity comes from doing. Action is information gathering.',
        },
        {
          name: 'Energy Tracking - Purpose Edition',
          duration: '10 minutes',
          frequency: 'Daily',
          instructions: '1. Create energy/motivation dashboard:\n   - Activity/Task\n   - Time spent\n   - Energy level after (1-10)\n   - Genuine interest level (1-10)\n2. Daily: Log all significant activities\n3. Weekly: Review patterns\n   - What consistently energizes? (Do more)\n   - What consistently drains? (Do less)\n4. Let data guide direction rather than waiting for perfect clarity',
          expectedOutcome: 'Data-driven realignment toward authentic interests. Energy follows genuine motivation.',
        },
        {
          name: 'The Daily Office - Action Edition',
          duration: '5 minutes',
          frequency: '3x daily',
          instructions: '1. Set 3 daily alarms (Morning, Midday, Evening)\n2. At each alarm, recite:\n   - Morning: "Today I act without perfect clarity. Movement creates understanding."\n   - Midday: "Have I taken a first step? What\'s next?"\n   - Evening: "Today\'s action taught me: [lesson]. Tomorrow: [next step]."',
          expectedOutcome: 'Ritual reinforcement of action over waiting. Consistent redirection toward movement.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When facing complete paralysis waiting for clarity',
        steps: [
          'OPEN purpose audit spreadsheet',
          'Look at alignment scores for current options',
          'Identify: "Which path scores highest even at 70% clarity?"',
          'Ask: "What\'s the tiniest first step on that path?"',
          'Set 10-minute timer',
          'Take that step before timer ends',
          'Speak: "Clarity follows commitment. I moved. I will learn."',
          'Journal: "What did that step teach me?"',
        ],
      },
    },
    transformationTimeline: {
      week1: 'First steps taken on things you\'ve been waiting on. Clarity slightly increasing.',
      week2: 'Experiments running. Proof emerging that action creates clarity.',
      day30: 'Movement becoming natural. Waiting for clarity recognized as procrastination in disguise.',
      day90: 'Building even in uncertainty. Clarity following commitment consistently. New identity: "I build while uncertain. Clarity comes from action, not waiting."',
    },
    premiumTime: '50 minutes daily + quarterly audit',
    roi: 'Paralysis broken, building capacity activated, clarity through action, commitment made',
  },
  {
    id: 'people_pleaser',
    name: 'The People Pleaser',
    primaryPattern: 'past_prison',
    subPattern: 'relationship_erosion',
    temperament: 'connector',
    protocolKey: 'people_pleaser',
    shortDescription: 'Natural connector who\'s lost themselves trying to keep everyone happy',
    fullDescription: `Your connector nature makes you exquisitely attuned to what others need. You feel their expectations, sense their disappointments, and work tirelessly to keep everyone satisfied. But you've lost yourself in the process. You can't remember the last decision you made purely for yourself. Your identity has become a reflection of others' preferences.

You say yes when you mean no. You adapt to whoever you're with. You shape-shift to avoid conflict. And somewhere along the way, the real you—your actual desires, preferences, and needs—got buried so deep you're not sure it still exists.

Here's the trap: Your people-pleasing feels like connection, but it's actually erosion. Every time you abandon yourself to keep someone happy, you erode the relationship you have with yourself. And ironically, the relationships you're trying to protect become less authentic because they're based on a performance, not a person.

You're exhausted because maintaining everyone else's happiness is an impossible job. You're resentful because your needs never get met. And you're lonely because no one actually knows the real you—they only know the version of you that was designed to please them.

Your connector nature is a gift. But it's been corrupted into a survival mechanism. You can be attuned to others AND connected to yourself. That's not selfishness—it's the foundation of authentic relationship.`,
    breakthroughPath: 'Reconnecting with your own wants, even when they disappoint others. Your people-pleasing is relationship erosion in disguise—you\'re eroding the relationship with yourself. Healthy relationships require two whole people, not one person shaped by the other.',
    neuralPrinciple: 'Healthy relationships require two whole people, not one person shaped by the other.',
    icon: '🎭',
    fourPillarAttack: {
      spiritual: '"Serving others is godly. Putting yourself first is selfish. Your discomfort is the cost of love. Keep sacrificing—that\'s what good people do."',
      mental: '"If you stop adapting, they\'ll leave. Your value is in your accommodation. Without pleasing others, what do you even have to offer?"',
      physical: '"Your exhaustion is proof you\'re a good person. That stress is the price of keeping everyone happy. Rest would be selfish when others still need you."',
      relational: '"The moment you stop pleasing, the relationships end. They love the pleasing version of you. The real you? They might not want that."',
    },
    costIfUnchecked: [
      'Complete loss of self—Unable to identify personal preferences, desires, or needs because they were suppressed for so long',
      'Resentment that destroys relationships—The very connections you protected by pleasing eventually break from the accumulated resentment of self-abandonment',
      'Physical breakdown from chronic self-neglect—Health crisis from consistently putting everyone else\'s needs before your own body\'s',
    ],
    neuralRewiringProtocol: {
      practices: [
        {
          name: 'Self-Preference Practice',
          duration: '10 minutes',
          frequency: 'Daily',
          instructions: '1. Morning: "What do I actually want today?"\n2. Not what others expect—what YOU want\n3. Write 3 preferences (food, activity, how to spend time)\n4. Honor at least 1 preference today even if it inconveniences someone\n5. Track: Preferences identified and honored this week\n6. Notice: Do relationships actually suffer?',
          expectedOutcome: 'Self-awareness of own desires restored. Proof that having preferences doesn\'t destroy relationships.',
        },
        {
          name: 'No Practice',
          duration: 'Ongoing',
          frequency: 'Daily',
          instructions: '1. Say "no" to at least one request per day\n2. Not emergencies—requests you would normally say yes to\n3. No need to justify or explain\n4. Simply: "No, I can\'t do that"\n5. Observe: Does the world end?\n6. Track: Nos said this week\n7. Notice: Do they still love you after the no?',
          expectedOutcome: 'Proof that no doesn\'t destroy relationships. Boundaries established.',
        },
        {
          name: 'Authentic Expression Practice',
          duration: '15 minutes',
          frequency: 'Daily',
          instructions: '1. Share one genuine opinion, feeling, or preference with someone\n2. Not what you think they want to hear\n3. What you actually think/feel\n4. Let them respond\n5. Notice: Is their response as bad as you feared?\n6. Track: Authentic shares per day',
          expectedOutcome: 'Practice being real instead of pleasing. Relationships based on authenticity, not performance.',
        },
        {
          name: 'Connection Partner Calls',
          duration: '20 minutes',
          frequency: 'Weekly',
          instructions: '1. Weekly call with someone who knows your people-pleasing pattern\n2. Share: "This week I abandoned myself when..."\n3. Share: "This week I honored myself when..."\n4. They witness your journey toward authenticity\n5. Ask: "What\'s the real me that you see?"',
          expectedOutcome: 'External accountability for authenticity. Someone witnesses the real you emerging.',
        },
        {
          name: 'Self-Connection Time',
          duration: '30 minutes',
          frequency: 'Daily',
          instructions: '1. Daily time ALONE (no others\' needs to attend to)\n2. Ask: "What do I need right now?"\n3. Provide it for yourself\n4. Not caretaking others—caretaking yourself\n5. Track: Minutes of self-connection per day\n6. Goal: Minimum 30 minutes daily',
          expectedOutcome: 'Relationship with self restored. Self-care becomes non-negotiable.',
        },
      ],
      emergencyProtocol: {
        trigger: 'When you\'re about to abandon your own needs to please someone',
        steps: [
          'PAUSE before responding',
          'Ask yourself: "What do I actually want here?"',
          'Feel the desire to please—don\'t act on it yet',
          'Speak: "I need a moment to think about this"',
          'Check: "If I say yes, am I abandoning myself?"',
          'If yes: "I can\'t do that, but thank you for thinking of me"',
          'Let them respond—don\'t rescue them from disappointment',
          'Celebrate: "I honored myself and the relationship survived."',
        ],
      },
    },
    transformationTimeline: {
      week1: 'First "nos" spoken. Identifying personal preferences feels strange but possible.',
      week2: 'Authentic expressions increasing. Relationships not destroyed by honesty.',
      day30: 'Regular self-connection time. People-pleasing recognized when it appears. Choosing self more often.',
      day90: 'Authentic relationships based on real you. People-pleasing is old pattern, not current identity. New identity: "I show up as myself. I have preferences and needs. Healthy relationships include my whole self."',
    },
    premiumTime: '75 minutes daily',
    roi: 'Self restored, authentic relationships, boundaries established, exhaustion ended',
  },
];

// ============================================================================
// AVATAR MAPPING LOGIC
// ============================================================================

/**
 * Get all avatars for a specific primary pattern
 */
export function getAvatarsForPattern(primaryPattern: PrimaryPattern): Avatar[] {
  return AVATAR_LIBRARY.filter((avatar) => avatar.primaryPattern === primaryPattern);
}

/**
 * Find the best matching avatar based on pattern, sub-pattern, and temperament
 */
export function findMatchingAvatar(
  primaryPattern: PrimaryPattern,
  primarySubPattern: SubPatternType,
  temperament: TemperamentType
): Avatar | null {
  console.log('[findMatchingAvatar] Searching for:', { primaryPattern, primarySubPattern, temperament });
  console.log('[findMatchingAvatar] Library size:', AVATAR_LIBRARY.length);

  // Priority 1: Exact match (pattern + sub-pattern + temperament)
  const exactMatch = AVATAR_LIBRARY.find(
    (avatar) =>
      avatar.primaryPattern === primaryPattern &&
      avatar.subPattern === primarySubPattern &&
      avatar.temperament === temperament
  );
  if (exactMatch) {
    console.log('[findMatchingAvatar] Priority 1 - Exact match found:', exactMatch.name);
    return exactMatch;
  }

  // Priority 2: Pattern + sub-pattern match (any temperament)
  const subPatternMatch = AVATAR_LIBRARY.find(
    (avatar) =>
      avatar.primaryPattern === primaryPattern &&
      avatar.subPattern === primarySubPattern
  );
  if (subPatternMatch) {
    console.log('[findMatchingAvatar] Priority 2 - Sub-pattern match found:', subPatternMatch.name);
    return subPatternMatch;
  }

  // Priority 3: Pattern + temperament match (any sub-pattern)
  const temperamentMatch = AVATAR_LIBRARY.find(
    (avatar) =>
      avatar.primaryPattern === primaryPattern &&
      avatar.temperament === temperament
  );
  if (temperamentMatch) {
    console.log('[findMatchingAvatar] Priority 3 - Temperament match found:', temperamentMatch.name);
    return temperamentMatch;
  }

  // Priority 4: Pattern match only (first avatar for that pattern)
  const patternMatch = AVATAR_LIBRARY.find(
    (avatar) => avatar.primaryPattern === primaryPattern
  );
  if (patternMatch) {
    console.log('[findMatchingAvatar] Priority 4 - Pattern match found:', patternMatch.name);
    return patternMatch;
  }

  console.log('[findMatchingAvatar] No match found!');
  return null;
}

/**
 * Calculate confidence score for an avatar match
 */
export function calculateMatchConfidence(
  avatar: Avatar,
  primaryPattern: PrimaryPattern,
  primarySubPattern: SubPatternType,
  temperament: TemperamentType
): number {
  let score = 0;

  // Pattern match: 40 points
  if (avatar.primaryPattern === primaryPattern) score += 40;

  // Sub-pattern match: 35 points
  if (avatar.subPattern === primarySubPattern) score += 35;

  // Temperament match: 25 points
  if (avatar.temperament === temperament) score += 25;

  return score;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Assign avatar to user based on their assessments
 */
export async function assignAvatarToUser(userId: string): Promise<AssignAvatarResult> {
  try {
    // Fetch user's assessment data
    const { data: assessmentData, error: fetchError } = await supabase
      .from('avatar_assessments')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError || !assessmentData) {
      return {
        success: false,
        error: 'No assessment data found. Complete Temperament and Sub-Pattern assessments first.',
      };
    }

    // Fetch collision pattern
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('collision_patterns')
      .eq('id', userId)
      .maybeSingle();

    const collisionPatterns = profileData?.collision_patterns as {
      primary_pattern?: PrimaryPattern;
      sub_patterns?: { primary?: SubPatternType };
    } | null;

    // Get pattern data
    const primaryPattern = (assessmentData.primary_pattern ||
      collisionPatterns?.primary_pattern) as PrimaryPattern | undefined;
    const temperament = assessmentData.temperament as TemperamentType | undefined;
    const subPatternScores = assessmentData.sub_pattern_scores as Record<string, number> | null;

    // Determine primary sub-pattern from scores
    let primarySubPattern: SubPatternType | undefined;
    if (subPatternScores) {
      const sortedSubPatterns = Object.entries(subPatternScores)
        .sort(([, a], [, b]) => (b || 0) - (a || 0));
      primarySubPattern = sortedSubPatterns[0]?.[0] as SubPatternType | undefined;
    }

    // Also check collision_patterns for sub-pattern
    if (!primarySubPattern && collisionPatterns?.sub_patterns?.primary) {
      primarySubPattern = collisionPatterns.sub_patterns.primary;
    }

    // Validate required data
    if (!primaryPattern || !temperament || !primarySubPattern) {
      return {
        success: false,
        error: `Missing assessment data: ${!primaryPattern ? 'pattern ' : ''}${!temperament ? 'temperament ' : ''}${!primarySubPattern ? 'sub-pattern' : ''}`,
      };
    }

    // Find matching avatar
    const avatar = findMatchingAvatar(primaryPattern, primarySubPattern, temperament);
    if (!avatar) {
      return {
        success: false,
        error: 'No matching avatar found for your profile.',
      };
    }

    // Calculate confidence
    const confidence = calculateMatchConfidence(
      avatar,
      primaryPattern,
      primarySubPattern,
      temperament
    );

    // Update avatar_assessments with assignment
    const { error: updateError } = await supabase
      .from('avatar_assessments')
      .update({
        avatar_type: avatar.id,
        avatar_narrative: avatar.fullDescription,
        breakthrough_path: avatar.breakthroughPath,
        neural_protocol: {
          key: avatar.protocolKey,
          principle: avatar.neuralPrinciple,
          assigned_at: new Date().toISOString(),
          confidence,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[AvatarAssignment] Error updating assessment:', updateError);
      return { success: false, error: updateError.message };
    }

    // Update user_profiles with avatar assignment timestamp
    await supabase
      .from('user_profiles')
      .update({
        avatar_type: avatar.id,
        avatar_assigned_at: new Date().toISOString(),
      })
      .eq('id', userId);

    const assignment: AvatarAssignment = {
      avatarId: avatar.id,
      avatarName: avatar.name,
      protocolKey: avatar.protocolKey,
      assignedAt: new Date().toISOString(),
      confidence,
    };

    console.log('[AvatarAssignment] Avatar assigned:', assignment);
    return { success: true, assignment };
  } catch (error) {
    console.error('[AvatarAssignment] Unexpected error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get user's current avatar assignment
 */
export async function getUserAvatar(userId: string): Promise<Avatar | null> {
  try {
    const { data, error } = await supabase
      .from('avatar_assessments')
      .select('avatar_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data?.avatar_type) return null;

    return AVATAR_LIBRARY.find((a) => a.id === data.avatar_type) || null;
  } catch (error) {
    console.error('[AvatarAssignment] Error fetching avatar:', error);
    return null;
  }
}

/**
 * Check if user can be assigned an avatar (has all required assessments)
 */
export async function canAssignAvatar(userId: string): Promise<{
  canAssign: boolean;
  missingAssessments: string[];
}> {
  try {
    // Check avatar_assessments
    const { data: assessment } = await supabase
      .from('avatar_assessments')
      .select('temperament, sub_pattern_scores, primary_pattern')
      .eq('user_id', userId)
      .maybeSingle();

    // Check collision patterns
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('collision_patterns')
      .eq('id', userId)
      .maybeSingle();

    const missing: string[] = [];

    // Check temperament
    if (!assessment?.temperament) {
      missing.push('Temperament Assessment');
    }

    // Check sub-pattern
    if (!assessment?.sub_pattern_scores || Object.keys(assessment.sub_pattern_scores).length === 0) {
      missing.push('Sub-Pattern Assessment');
    }

    // Check primary pattern
    const collisionPatterns = profile?.collision_patterns as { primary_pattern?: string } | null;
    if (!assessment?.primary_pattern && !collisionPatterns?.primary_pattern) {
      missing.push('Identity Collision Assessment');
    }

    return {
      canAssign: missing.length === 0,
      missingAssessments: missing,
    };
  } catch (error) {
    console.error('[AvatarAssignment] Error checking eligibility:', error);
    return {
      canAssign: false,
      missingAssessments: ['Unable to verify assessments'],
    };
  }
}

export default {
  AVATAR_LIBRARY,
  getAvatarsForPattern,
  findMatchingAvatar,
  calculateMatchConfidence,
  assignAvatarToUser,
  getUserAvatar,
  canAssignAvatar,
};
