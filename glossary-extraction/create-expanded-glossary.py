#!/usr/bin/env python3
"""
Week 4 Optimization - Glossary Expansion
Expands glossary from 40 → 100+ terms to increase tooltip density

Target: 0.34 avg → 1.5+ avg tooltips per protocol
"""

import json
import sys
import re
from pathlib import Path

# Import from validation-framework.py (using importlib for hyphenated filename)
import importlib.util
spec = importlib.util.spec_from_file_location("validation_framework", "validation-framework.py")
validation_framework = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validation_framework)
calculate_flesch_kincaid_grade = validation_framework.calculate_flesch_kincaid_grade
analyze_text_complexity = validation_framework.analyze_text_complexity

# Load existing glossary
with open('neuroscience-glossary.json', 'r') as f:
    existing_glossary = json.load(f)

print(f"Loaded {len(existing_glossary)} existing terms")

# New terms to add (60+ terms across 6 new categories)
new_terms = [
    # ========== MEDITATION & MINDFULNESS (15 terms) ==========
    {
        "term": "mindfulness",
        "category": "meditation_mindfulness",
        "clinical_definition": "Non-judgmental awareness of present moment experience",
        "user_friendly": "Paying attention to right now without judging it",
        "analogy": "Like watching clouds pass in the sky - you notice them but don't try to change them",
        "why_it_matters": "When you're mindful, your brain isn't stuck in past regrets or future worries. You can respond to what's actually happening instead of reacting to old patterns.",
        "example_sentence": "Mindfulness helps you notice when you're spiraling into anxiety before it takes over completely."
    },
    {
        "term": "presence",
        "category": "meditation_mindfulness",
        "clinical_definition": "Full attention and awareness in the current moment",
        "user_friendly": "Being fully here and now",
        "analogy": "Like a spotlight focused on this exact second, not dimmed by yesterday or tomorrow",
        "why_it_matters": "Presence pulls your mind out of loops about the past or future. It's where peace lives.",
        "example_sentence": "When you practice presence during meditation, worries about work tomorrow fade away."
    },
    {
        "term": "awareness",
        "category": "meditation_mindfulness",
        "clinical_definition": "Conscious perception of internal and external states",
        "user_friendly": "Noticing what's happening inside and around you",
        "analogy": "Like turning on lights in a dark room - suddenly you can see what was always there",
        "why_it_matters": "Awareness is the first step to change. You can't fix what you don't notice.",
        "example_sentence": "Body awareness helps you catch tension in your shoulders before it becomes a headache."
    },
    {
        "term": "breath work",
        "category": "meditation_mindfulness",
        "clinical_definition": "Intentional control of breathing patterns for physiological or psychological effects",
        "user_friendly": "Changing how you breathe to change how you feel",
        "analogy": "Like having a remote control for your nervous system - breath is the button",
        "why_it_matters": "Breathing is the only part of your nervous system you can consciously control. Change your breath, change your state.",
        "example_sentence": "Simple breath work like box breathing can calm panic attacks in minutes."
    },
    {
        "term": "body scan",
        "category": "meditation_mindfulness",
        "clinical_definition": "Systematic attention to physical sensations throughout the body",
        "user_friendly": "Noticing how each part of your body feels, head to toe",
        "analogy": "Like doing a security check of your whole house, room by room",
        "why_it_matters": "Body scans help you locate hidden tension and reconnect with physical sensations you've been ignoring.",
        "example_sentence": "A bedtime body scan helps you release the day's stress stored in your muscles."
    },
    {
        "term": "loving-kindness",
        "category": "meditation_mindfulness",
        "clinical_definition": "Meditation practice cultivating unconditional benevolence toward self and others",
        "user_friendly": "Wishing yourself and others well on purpose",
        "analogy": "Like watering seeds of compassion until they grow into a garden",
        "why_it_matters": "Loving-kindness rewires your brain to default to compassion instead of criticism.",
        "example_sentence": "Loving-kindness meditation can soften your inner critic and boost empathy for others."
    },
    {
        "term": "compassion meditation",
        "category": "meditation_mindfulness",
        "clinical_definition": "Practice of generating compassion for suffering, starting with self and extending to others",
        "user_friendly": "Learning to feel kindness toward pain - yours and others'",
        "analogy": "Like strengthening a muscle - the more you practice compassion, the stronger it gets",
        "why_it_matters": "Compassion meditation reduces shame and increases connection with others.",
        "example_sentence": "Compassion meditation helps you respond to your mistakes with understanding instead of self-attack."
    },
    {
        "term": "anchor point",
        "category": "meditation_mindfulness",
        "clinical_definition": "Focal point of attention during meditation (breath, sensation, sound)",
        "user_friendly": "Something to come back to when your mind wanders",
        "analogy": "Like a home base in a game - you can explore but you always return there",
        "why_it_matters": "Anchor points give your wandering mind a place to rest and reset.",
        "example_sentence": "Using your breath as an anchor point helps you notice when you've drifted into thought."
    },
    {
        "term": "mental noting",
        "category": "meditation_mindfulness",
        "clinical_definition": "Labeling thoughts, sensations, or emotions as they arise during mindfulness practice",
        "user_friendly": "Quietly naming what you notice without getting caught in it",
        "analogy": "Like a nature guide pointing out birds without chasing them",
        "why_it_matters": "Noting creates distance between you and your thoughts, preventing you from getting swept away.",
        "example_sentence": "Mental noting like 'thinking' or 'feeling' helps you observe your mind without judgment."
    },
    {
        "term": "non-judgment",
        "category": "meditation_mindfulness",
        "clinical_definition": "Observing experience without evaluation or categorization as good/bad",
        "user_friendly": "Noticing things without calling them good or bad",
        "analogy": "Like a scientist observing data - just facts, no opinions",
        "why_it_matters": "Judgment creates suffering. Non-judgment creates space for things to be as they are.",
        "example_sentence": "Non-judgment means noticing you're anxious without adding 'I shouldn't feel this way.'"
    },
    {
        "term": "acceptance",
        "category": "meditation_mindfulness",
        "clinical_definition": "Willingness to experience present-moment reality without resistance",
        "user_friendly": "Letting things be as they are right now",
        "analogy": "Like opening your hand instead of clenching your fist - it doesn't mean you approve, just that you stop fighting",
        "why_it_matters": "Acceptance reduces suffering. Fighting reality creates more pain than the thing you're fighting.",
        "example_sentence": "Acceptance of difficult emotions actually helps them pass faster than avoidance does."
    },
    {
        "term": "detachment",
        "category": "meditation_mindfulness",
        "clinical_definition": "Non-clinging relationship to thoughts, emotions, and outcomes",
        "user_friendly": "Holding things lightly instead of gripping them",
        "analogy": "Like watching a river flow instead of damming it up",
        "why_it_matters": "Detachment isn't not caring - it's caring without being controlled by the outcome.",
        "example_sentence": "Detachment lets you work hard for goals without your worth depending on results."
    },
    {
        "term": "observer mind",
        "category": "meditation_mindfulness",
        "clinical_definition": "Metacognitive awareness that watches thoughts without identifying with them",
        "user_friendly": "The part of you that notices you're thinking",
        "analogy": "Like sitting in a theater watching a movie of your thoughts instead of being in the movie",
        "why_it_matters": "Observer mind creates space between you and your thoughts, proving you're not your thoughts.",
        "example_sentence": "When your observer mind kicks in, you realize 'I'm having the thought I'm worthless' instead of 'I am worthless.'"
    },
    {
        "term": "equanimity",
        "category": "meditation_mindfulness",
        "clinical_definition": "Mental calmness and evenness of temper in face of changing circumstances",
        "user_friendly": "Staying steady when life gets rocky",
        "analogy": "Like a mountain that doesn't move when storms pass over it",
        "why_it_matters": "Equanimity lets you ride life's ups and downs without being thrown off course.",
        "example_sentence": "Equanimity means you can stay calm during both wins and losses."
    },
    {
        "term": "centering",
        "category": "meditation_mindfulness",
        "clinical_definition": "Process of returning attention to one's core or present moment",
        "user_friendly": "Coming back to yourself when you feel scattered",
        "analogy": "Like a spinning top finding its balance point",
        "why_it_matters": "Centering is how you recover from stress and reconnect with what matters.",
        "example_sentence": "A quick centering practice before a meeting helps you show up fully present."
    },

    # ========== VISUALIZATION & MENTAL IMAGERY (12 terms) ==========
    {
        "term": "mental imagery",
        "category": "visualization_imagery",
        "clinical_definition": "Internal representation of sensory experience without external stimulation",
        "user_friendly": "Pictures, sounds, or feelings you create in your mind",
        "analogy": "Like a movie projector in your head - you're the director",
        "why_it_matters": "Your brain responds to vivid mental images almost like real experiences, rewiring itself accordingly.",
        "example_sentence": "Mental imagery of success activates the same brain regions as actual success."
    },
    {
        "term": "visualization",
        "category": "visualization_imagery",
        "clinical_definition": "Deliberate creation of mental images to achieve specific outcomes",
        "user_friendly": "Imagining something on purpose to make it more likely",
        "analogy": "Like rehearsing in your mind before the big performance",
        "why_it_matters": "Visualization primes your brain to recognize and pursue the future you're imagining.",
        "example_sentence": "Athletes use visualization to mentally practice perfect performance before competition."
    },
    {
        "term": "guided imagery",
        "category": "visualization_imagery",
        "clinical_definition": "Structured mental visualization led by verbal instructions or scripts",
        "user_friendly": "Someone guiding you through imaginary scenes",
        "analogy": "Like a GPS for your imagination - it tells you where to go",
        "why_it_matters": "Guided imagery helps you access powerful mental states you might not reach on your own.",
        "example_sentence": "Guided imagery for healing can reduce pain and speed recovery."
    },
    {
        "term": "mental rehearsal",
        "category": "visualization_imagery",
        "clinical_definition": "Cognitive practice of skills or behaviors through mental simulation",
        "user_friendly": "Practicing something in your mind before doing it for real",
        "analogy": "Like a pilot using a flight simulator - same mental practice, no risk",
        "why_it_matters": "Mental rehearsal builds neural pathways just like physical practice does.",
        "example_sentence": "Mental rehearsal of a difficult conversation helps you respond better when it happens."
    },
    {
        "term": "future self",
        "category": "visualization_imagery",
        "clinical_definition": "Imagined representation of oneself at a future point in time",
        "user_friendly": "The version of you that exists months or years from now",
        "analogy": "Like meeting your future self in a time machine",
        "why_it_matters": "Connecting with your future self makes you more likely to make choices that serve them.",
        "example_sentence": "Visualizing your future self helps you save money and resist temptation today."
    },
    {
        "term": "ideal outcome",
        "category": "visualization_imagery",
        "clinical_definition": "Mental representation of optimal result or achievement",
        "user_friendly": "Picture of how you want things to turn out",
        "analogy": "Like the finished puzzle on the box - it shows you what you're building toward",
        "why_it_matters": "Ideal outcomes focus your brain on solutions and opportunities that match your vision.",
        "example_sentence": "Holding your ideal outcome in mind helps you spot chances to move toward it."
    },
    {
        "term": "vision boarding",
        "category": "visualization_imagery",
        "clinical_definition": "Creation of visual collages representing goals and desired outcomes",
        "user_friendly": "Making a poster of your dreams and goals",
        "analogy": "Like a treasure map you create for your own life",
        "why_it_matters": "Vision boards keep your goals visible and emotionally connected to daily life.",
        "example_sentence": "Looking at your vision board daily keeps your brain focused on what matters most."
    },
    {
        "term": "mental anchoring",
        "category": "visualization_imagery",
        "clinical_definition": "Association of mental images with desired emotional or physical states",
        "user_friendly": "Linking a mental picture to a feeling you want",
        "analogy": "Like saving a bookmark - you can return to that state anytime",
        "why_it_matters": "Mental anchors let you access resourceful states on demand.",
        "example_sentence": "Anchoring an image of the beach to calm helps you find peace in stressful moments."
    },
    {
        "term": "sensory detail",
        "category": "visualization_imagery",
        "clinical_definition": "Inclusion of sight, sound, touch, taste, and smell in mental imagery",
        "user_friendly": "Adding all five senses to your mental pictures",
        "analogy": "Like turning a black and white sketch into full-color 3D",
        "why_it_matters": "Rich sensory details make visualizations more real to your brain, increasing their power.",
        "example_sentence": "Adding sensory details like smells and sounds makes your visualization feel more authentic."
    },
    {
        "term": "first-person perspective",
        "category": "visualization_imagery",
        "clinical_definition": "Mental imagery experienced through one's own eyes",
        "user_friendly": "Seeing it as if you're doing it yourself",
        "analogy": "Like a video game where you're the character, not watching from above",
        "why_it_matters": "First-person perspective creates stronger emotional connection and embodiment.",
        "example_sentence": "Visualizing from first-person perspective helps you feel the confidence of success."
    },
    {
        "term": "third-person perspective",
        "category": "visualization_imagery",
        "clinical_definition": "Mental imagery viewed from external observer position",
        "user_friendly": "Watching yourself from outside like a movie",
        "analogy": "Like seeing yourself on a screen instead of through your own eyes",
        "why_it_matters": "Third-person perspective helps you analyze and adjust your mental images objectively.",
        "example_sentence": "Third-person visualization lets you see yourself succeeding from an observer's view."
    },
    {
        "term": "mental priming",
        "category": "visualization_imagery",
        "clinical_definition": "Exposure to stimuli that influences subsequent thoughts or behaviors",
        "user_friendly": "Setting up your mind to expect certain outcomes",
        "analogy": "Like priming a pump - the first input makes the next flow easier",
        "why_it_matters": "Mental priming shapes what you notice and how you respond before you're consciously aware.",
        "example_sentence": "Priming yourself with success images before a presentation boosts confidence."
    },

    # ========== EMOTIONAL REGULATION (15 terms) ==========
    {
        "term": "grounding",
        "category": "emotional_regulation",
        "clinical_definition": "Techniques to reconnect with present moment and physical reality",
        "user_friendly": "Bringing yourself back to right now when you feel overwhelmed",
        "analogy": "Like dropping an anchor to stop drifting in a storm",
        "why_it_matters": "Grounding stops emotional flooding and panic by redirecting attention to the present.",
        "example_sentence": "Grounding techniques like naming five things you can see help stop anxiety spirals."
    },
    {
        "term": "container technique",
        "category": "emotional_regulation",
        "clinical_definition": "Visualization of placing difficult emotions in an imaginary container for later processing",
        "user_friendly": "Mentally putting feelings away until you're ready to deal with them",
        "analogy": "Like a filing cabinet where you can store things safely and retrieve them when needed",
        "why_it_matters": "Containment lets you function when emotions threaten to overwhelm, without suppressing them permanently.",
        "example_sentence": "Using a container technique before work lets you address grief later when you have support."
    },
    {
        "term": "emotional flooding",
        "category": "emotional_regulation",
        "clinical_definition": "Overwhelming intensity of emotion that impairs cognitive function",
        "user_friendly": "When feelings get so big they shut down your thinking brain",
        "analogy": "Like a flood that covers everything - you can't see the ground or find your footing",
        "why_it_matters": "Flooding makes problem-solving impossible. Recognizing it helps you pause instead of react.",
        "example_sentence": "When you're in emotional flooding, taking a 20-minute break lets your brain come back online."
    },
    {
        "term": "affect regulation",
        "category": "emotional_regulation",
        "clinical_definition": "Ability to modulate emotional experiences and expressions",
        "user_friendly": "Managing your emotional intensity and expression",
        "analogy": "Like a thermostat for feelings - turning them up or down as needed",
        "why_it_matters": "Good affect regulation lets you feel emotions without being controlled by them.",
        "example_sentence": "Affect regulation skills help you stay calm in conflict instead of exploding."
    },
    {
        "term": "window of tolerance",
        "category": "emotional_regulation",
        "clinical_definition": "Optimal arousal zone where the nervous system can function effectively",
        "user_friendly": "Your sweet spot for handling stress",
        "analogy": "Like Goldilocks - not too activated (anxious) or too shut down (numb), but just right",
        "why_it_matters": "Inside your window, you can think clearly and manage emotions. Outside it, you can't.",
        "example_sentence": "Trauma shrinks your window of tolerance, making everyday stress feel overwhelming."
    },
    {
        "term": "co-regulation",
        "category": "emotional_regulation",
        "clinical_definition": "Mutual regulation of nervous system states between individuals",
        "user_friendly": "Calming down or energizing through connection with others",
        "analogy": "Like tuning forks vibrating together - one person's calm can help another find theirs",
        "why_it_matters": "Co-regulation is how we first learn to manage emotions as babies, and we never outgrow the need.",
        "example_sentence": "A calm parent's presence helps a distressed child's nervous system settle through co-regulation."
    },
    {
        "term": "self-soothing",
        "category": "emotional_regulation",
        "clinical_definition": "Self-directed behaviors that reduce distress and promote comfort",
        "user_friendly": "Calming yourself down when upset",
        "analogy": "Like being your own good parent when things get hard",
        "why_it_matters": "Self-soothing is essential for emotional independence and resilience.",
        "example_sentence": "Self-soothing strategies like warm baths or gentle music help you recover from stress."
    },
    {
        "term": "distress tolerance",
        "category": "emotional_regulation",
        "clinical_definition": "Capacity to withstand difficult emotions without resorting to destructive behaviors",
        "user_friendly": "Handling pain without making things worse",
        "analogy": "Like riding out a wave instead of fighting it or drowning",
        "why_it_matters": "Distress tolerance keeps you from impulsive decisions that create more problems.",
        "example_sentence": "Building distress tolerance helps you resist binge eating when you're sad."
    },
    {
        "term": "emotional granularity",
        "category": "emotional_regulation",
        "clinical_definition": "Ability to differentiate between similar emotional states with precision",
        "user_friendly": "Telling the difference between similar feelings",
        "analogy": "Like having a big box of crayons instead of just 'red' - more specific colors available",
        "why_it_matters": "Precise emotion words help your brain know exactly what you need to feel better.",
        "example_sentence": "Emotional granularity helps you distinguish frustrated from disappointed from angry."
    },
    {
        "term": "feeling wheel",
        "category": "emotional_regulation",
        "clinical_definition": "Visual tool for identifying and naming emotions with increasing specificity",
        "user_friendly": "Chart that helps you name your exact feeling",
        "analogy": "Like a map of emotion territory with specific landmarks",
        "why_it_matters": "The feeling wheel expands your emotional vocabulary, increasing regulation ability.",
        "example_sentence": "Using a feeling wheel, you might realize you're not just sad but specifically lonely."
    },
    {
        "term": "pendulation",
        "category": "emotional_regulation",
        "clinical_definition": "Oscillation between distress and safety to gradually process trauma",
        "user_friendly": "Moving back and forth between hard feelings and comfort",
        "analogy": "Like dipping a toe in cold water, then warming up, then dipping again",
        "why_it_matters": "Pendulation lets you process trauma in doses small enough to handle.",
        "example_sentence": "Pendulation between talking about trauma and feeling grounded prevents overwhelm."
    },
    {
        "term": "titration",
        "category": "emotional_regulation",
        "clinical_definition": "Gradual, measured exposure to distressing material",
        "user_friendly": "Taking things in small, manageable doses",
        "analogy": "Like adding spice drop by drop instead of dumping it in",
        "why_it_matters": "Titration prevents re-traumatization while still allowing healing to happen.",
        "example_sentence": "Titration means spending just 30 seconds thinking about your fear before taking a break."
    },
    {
        "term": "resourcing",
        "category": "emotional_regulation",
        "clinical_definition": "Accessing internal or external sources of strength and stability",
        "user_friendly": "Connecting with things that make you feel strong and safe",
        "analogy": "Like filling up your tank before a long journey",
        "why_it_matters": "Resources help you stay grounded when processing difficult emotions.",
        "example_sentence": "Resourcing might include thinking of a safe place or person who supports you."
    },
    {
        "term": "safe place imagery",
        "category": "emotional_regulation",
        "clinical_definition": "Visualization of a real or imagined location associated with safety and calm",
        "user_friendly": "Picturing a place where you feel completely safe",
        "analogy": "Like a mental refuge you can visit anytime",
        "why_it_matters": "Safe place imagery gives you an anchor point for calming your nervous system.",
        "example_sentence": "Imagining your safe place - maybe a childhood treehouse - can reduce anxiety quickly."
    },
    {
        "term": "bilateral stimulation",
        "category": "emotional_regulation",
        "clinical_definition": "Alternating sensory input to both sides of the body to process trauma",
        "user_friendly": "Left-right patterns that help your brain process hard memories",
        "analogy": "Like toggling a switch back and forth to reset a system",
        "why_it_matters": "Bilateral stimulation helps stuck traumatic memories become unstuck and integrated.",
        "example_sentence": "Tapping alternating knees while thinking of trauma is a form of bilateral stimulation."
    },

    # ========== BEHAVIORAL PATTERNS (10 terms) ==========
    {
        "term": "habit loop",
        "category": "behavioral_patterns",
        "clinical_definition": "Three-part cycle of cue, routine, and reward that forms habits",
        "user_friendly": "The trigger-action-payoff pattern that creates automatic behaviors",
        "analogy": "Like a record that keeps playing the same song when you drop the needle",
        "why_it_matters": "Understanding habit loops lets you interrupt and rewire automatic behaviors.",
        "example_sentence": "Breaking a habit loop means changing either the cue, routine, or reward."
    },
    {
        "term": "trigger-response",
        "category": "behavioral_patterns",
        "clinical_definition": "Automatic behavioral reaction to environmental or internal stimulus",
        "user_friendly": "When something sets off an instant reaction",
        "analogy": "Like a knee-jerk reflex - it happens before you think",
        "why_it_matters": "Noticing triggers gives you a chance to choose your response instead of reacting automatically.",
        "example_sentence": "Recognizing that criticism triggers defensiveness lets you pause before responding."
    },
    {
        "term": "automatic behavior",
        "category": "behavioral_patterns",
        "clinical_definition": "Actions performed without conscious awareness or decision-making",
        "user_friendly": "Things you do without thinking",
        "analogy": "Like autopilot in an airplane - it runs without constant input",
        "why_it_matters": "Most of your day runs on autopilot. Awareness brings choice back.",
        "example_sentence": "Scrolling social media is often automatic behavior you don't consciously choose."
    },
    {
        "term": "behavior chain",
        "category": "behavioral_patterns",
        "clinical_definition": "Sequence of linked behaviors leading to a target action",
        "user_friendly": "Connected steps that lead to a final behavior",
        "analogy": "Like dominoes - each one knocks over the next until you reach the end",
        "why_it_matters": "Interrupting early links in a behavior chain prevents unwanted outcomes.",
        "example_sentence": "The behavior chain of stress eating might start hours before with skipping lunch."
    },
    {
        "term": "pattern interrupt",
        "category": "behavioral_patterns",
        "clinical_definition": "Deliberate disruption of automatic behavioral sequence",
        "user_friendly": "Breaking an automatic pattern on purpose",
        "analogy": "Like hitting pause on a movie that's been playing the same scene over and over",
        "why_it_matters": "Pattern interrupts create space for new choices where old habits used to be.",
        "example_sentence": "Clapping loudly is a pattern interrupt that can stop rumination."
    },
    {
        "term": "replacement behavior",
        "category": "behavioral_patterns",
        "clinical_definition": "Alternative action substituted for unwanted behavior",
        "user_friendly": "New habit you do instead of the old one",
        "analogy": "Like putting a healthy snack where junk food used to be",
        "why_it_matters": "Replacement behaviors are easier than just stopping - they fill the gap.",
        "example_sentence": "Drinking water is a replacement behavior for stress snacking."
    },
    {
        "term": "extinction burst",
        "category": "behavioral_patterns",
        "clinical_definition": "Temporary increase in unwanted behavior when reinforcement is removed",
        "user_friendly": "When a bad habit gets worse right before it gets better",
        "analogy": "Like a dying lightbulb flickering brighter before it burns out",
        "why_it_matters": "Expecting extinction bursts keeps you from giving up when change gets temporarily harder.",
        "example_sentence": "When you stop responding to tantrums, an extinction burst means they get worse for a few days first."
    },
    {
        "term": "shaping",
        "category": "behavioral_patterns",
        "clinical_definition": "Reinforcing successive approximations toward a target behavior",
        "user_friendly": "Rewarding small steps toward your goal",
        "analogy": "Like teaching a dog tricks one tiny piece at a time",
        "why_it_matters": "Shaping makes impossible-seeming changes achievable through tiny steps.",
        "example_sentence": "Shaping helps you build a meditation habit by starting with just one minute."
    },
    {
        "term": "successive approximation",
        "category": "behavioral_patterns",
        "clinical_definition": "Gradual steps that progressively resemble the desired behavior",
        "user_friendly": "Getting closer and closer to your goal in small increments",
        "analogy": "Like climbing stairs instead of trying to leap to the top floor",
        "why_it_matters": "Successive approximations make change sustainable by avoiding overwhelm.",
        "example_sentence": "Learning piano through successive approximations means mastering one scale before moving on."
    },
    {
        "term": "behavioral momentum",
        "category": "behavioral_patterns",
        "clinical_definition": "Tendency for behavior to continue once initiated through compliance with easy requests",
        "user_friendly": "Getting started makes it easier to keep going",
        "analogy": "Like pushing a boulder - hard to start rolling but easier to keep moving",
        "why_it_matters": "Behavioral momentum is why 'just start' works - action creates more action.",
        "example_sentence": "Building behavioral momentum by doing one push-up makes the second one easier."
    },

    # ========== COGNITIVE PROCESSES (8 terms) ==========
    {
        "term": "cognitive load",
        "category": "cognitive_processes",
        "clinical_definition": "Total amount of mental effort being used in working memory",
        "user_friendly": "How much your brain is juggling at once",
        "analogy": "Like computer RAM - too many programs open and everything slows down",
        "why_it_matters": "High cognitive load makes decisions harder and mistakes more likely.",
        "example_sentence": "Reducing cognitive load by writing things down frees up mental energy for hard tasks."
    },
    {
        "term": "mental bandwidth",
        "category": "cognitive_processes",
        "clinical_definition": "Cognitive capacity available for processing information and making decisions",
        "user_friendly": "How much mental energy you have available",
        "analogy": "Like internet bandwidth - stress and worry eat it up before you can use it for important things",
        "why_it_matters": "Limited bandwidth explains why poverty, stress, and trauma impair decision-making.",
        "example_sentence": "Financial stress consumes mental bandwidth, making it harder to focus at work."
    },
    {
        "term": "decision fatigue",
        "category": "cognitive_processes",
        "clinical_definition": "Deteriorating quality of decisions after long period of decision-making",
        "user_friendly": "Getting worse at choosing after making too many choices",
        "analogy": "Like a muscle that gets tired - your decision-making strength runs out",
        "why_it_matters": "Decision fatigue is why you make poor choices at night and snap at loved ones after work.",
        "example_sentence": "Decision fatigue makes you more likely to binge-watch TV instead of exercising after a long day."
    },
    {
        "term": "analysis paralysis",
        "category": "cognitive_processes",
        "clinical_definition": "Inability to make decisions due to overthinking options",
        "user_friendly": "Getting so stuck thinking about choices that you can't choose",
        "analogy": "Like standing at a crossroads analyzing every path until darkness falls",
        "why_it_matters": "Analysis paralysis prevents action and creates suffering through indecision.",
        "example_sentence": "Analysis paralysis keeps you researching perfect workout plans instead of just starting."
    },
    {
        "term": "cognitive flexibility",
        "category": "cognitive_processes",
        "clinical_definition": "Ability to adapt thinking and switch between different concepts or perspectives",
        "user_friendly": "How easily you can change your mind or see things differently",
        "analogy": "Like being able to bend instead of breaking when the wind blows",
        "why_it_matters": "Cognitive flexibility helps you solve problems creatively and recover from setbacks.",
        "example_sentence": "Cognitive flexibility lets you find a new approach when your first plan doesn't work."
    },
    {
        "term": "mental model",
        "category": "cognitive_processes",
        "clinical_definition": "Internal representation of how something works in the world",
        "user_friendly": "Your brain's working theory about how things work",
        "analogy": "Like a map of reality you carry in your head - it's not reality, just your version",
        "why_it_matters": "Mental models shape what you notice and how you interpret everything. Wrong models lead you astray.",
        "example_sentence": "If your mental model says 'people can't change,' you won't notice when they do."
    },
    {
        "term": "confirmation bias",
        "category": "cognitive_processes",
        "clinical_definition": "Tendency to search for and interpret information that confirms existing beliefs",
        "user_friendly": "Seeing only what you already believe",
        "analogy": "Like wearing glasses that filter out anything that doesn't match your expectations",
        "why_it_matters": "Confirmation bias keeps you stuck in wrong beliefs even when evidence says otherwise.",
        "example_sentence": "Confirmation bias makes you notice every time someone proves your stereotype right."
    },
    {
        "term": "availability heuristic",
        "category": "cognitive_processes",
        "clinical_definition": "Mental shortcut using ease of recalling examples to judge probability",
        "user_friendly": "Thinking something is more common because you can easily remember it",
        "analogy": "Like judging how dangerous flying is by how easily you remember plane crashes",
        "why_it_matters": "Availability heuristic distorts risk assessment and keeps you afraid of unlikely things.",
        "example_sentence": "The availability heuristic makes people fear shark attacks more than heart disease."
    }
]

# Combine with existing glossary
expanded_glossary = existing_glossary + new_terms

print(f"Added {len(new_terms)} new terms")
print(f"Total glossary size: {len(expanded_glossary)} terms")

# Calculate reading levels for all new terms
print("\nCalculating reading levels for new terms...")
for entry in new_terms:
    user_friendly_text = entry['user_friendly']
    word_count, sentence_count, syllable_count = analyze_text_complexity(user_friendly_text)
    reading_level = calculate_flesch_kincaid_grade(
        user_friendly_text, word_count, sentence_count, syllable_count
    )
    entry['reading_level'] = round(reading_level, 1)

# Sort alphabetically by term
expanded_glossary.sort(key=lambda x: x['term'].lower())

# Save expanded glossary
output_path = Path('neuroscience-glossary-expanded.json')
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(expanded_glossary, f, indent=2, ensure_ascii=False)

print(f"\n✓ Saved expanded glossary to {output_path}")

# Generate statistics
categories = {}
total_reading_level = 0
for entry in expanded_glossary:
    cat = entry['category']
    categories[cat] = categories.get(cat, 0) + 1
    total_reading_level += entry.get('reading_level', 0)

avg_reading_level = total_reading_level / len(expanded_glossary)

stats = {
    "original_count": len(existing_glossary),
    "new_count": len(new_terms),
    "total_count": len(expanded_glossary),
    "expansion_percentage": round((len(new_terms) / len(existing_glossary)) * 100, 1),
    "average_reading_level": round(avg_reading_level, 2),
    "categories": categories
}

# Save statistics
stats_path = Path('glossary-expansion-stats.json')
with open(stats_path, 'w', encoding='utf-8') as f:
    json.dump(stats, f, indent=2)

print(f"✓ Saved statistics to {stats_path}")

# Print summary
print("\n" + "=" * 80)
print("GLOSSARY EXPANSION COMPLETE")
print("=" * 80)
print(f"\nOriginal terms: {stats['original_count']}")
print(f"New terms added: {stats['new_count']}")
print(f"Total terms: {stats['total_count']}")
print(f"Expansion: {stats['expansion_percentage']}%")
print(f"Average reading level: {stats['average_reading_level']} (Target: ≤8.0)")

print("\nCategory distribution:")
for cat, count in sorted(categories.items()):
    print(f"  {cat}: {count} terms")

print("\n" + "=" * 80)
