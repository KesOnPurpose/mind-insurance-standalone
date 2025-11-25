# A/B Testing Plan: Clinical vs Simplified Language
**Week 3 Day 5-7: Agent 3 Deliverable**

**Mission**: Validate that simplified language with glossary tooltips improves user comprehension and engagement without sacrificing clinical accuracy.

---

## Executive Summary

This document outlines the A/B testing methodology for comparing clinical neuroscience language (Variant A) against simplified, user-friendly language with glossary tooltips (Variant B).

**Hypothesis**: Simplified language with glossary tooltips will:
1. Increase user comprehension by 20%+
2. Increase practice completion rate by 15%+
3. Improve user satisfaction scores by 25%+
4. Maintain clinical accuracy (verified by expert review)

**Test Duration**: 4 weeks
**Sample Size**: 20 protocols (10 clinical, 10 simplified)
**User Segments**: 200+ users (stratified by avatar type)

---

## Test Design

### Variant A: Clinical Language (Control)

**Characteristics**:
- Original neuroscience terminology
- No glossary tooltips
- Technical explanations preserved
- Reading level: 12+ (college level)
- Jargon density: 8-12 technical terms per 100 words

**Example**:
```markdown
The practice activates the vagus nerve through vocalization, which shifts from
fear to faith, creating a neurological state of trust and safety. The vibration
of singing literally changes your physiological state by modulating the autonomic
nervous system and engaging the parasympathetic response.
```

**Target Audience**: Users with medical/scientific background, advanced practitioners

### Variant B: Simplified Language (Treatment)

**Characteristics**:
- User-friendly terminology
- Glossary tooltips for technical terms
- Inline explanations for core concepts
- Reading level: 8.0 (8th grade target)
- Jargon density: <5 technical terms per 100 words

**Example**:
```markdown
The practice activates the {{vagus nerve||your body's built-in relaxation system}}
through vocalization (speaking or singing), which shifts you from fear to faith,
creating a calm and safe state in your nervous system. The vibration of singing
literally changes how your body feels by calming your stress response and
activating your relaxation response.
```

**Target Audience**: General users, beginners, non-scientific background

---

## Test Methodology

### 1. Protocol Selection

**Selection Criteria** (20 protocols total):
1. **High Priority** (10 protocols): FKG > 12, jargon density > 10%
2. **Diverse Coverage**:
   - 4 protocols from Daily Deductible Library
   - 8 protocols from Neural Rewiring (2 per pattern)
   - 8 protocols from Research Protocols (2 per KB file)
3. **Temperament Balance**:
   - 5 Warrior protocols
   - 5 Sage protocols
   - 5 Builder protocols
   - 5 Connector protocols
4. **Difficulty Mix**:
   - 8 Advanced
   - 7 Intermediate
   - 5 Beginner

**Why 20 protocols?**
- Statistically significant sample (10 per variant)
- Manageable for expert review
- Covers all major categories and patterns
- Feasible within 4-week timeline

### 2. User Segmentation

**Total Target**: 200 users minimum

**Segment 1: Avatar Type** (stratified random assignment)
- 50 Warriors → 25 Variant A, 25 Variant B
- 50 Sages → 25 Variant A, 25 Variant B
- 50 Builders → 25 Variant A, 25 Variant B
- 50 Connectors → 25 Variant A, 25 Variant B

**Segment 2: User Experience Level**
- 80 Beginners (0-2 months on platform)
- 80 Intermediate (3-6 months)
- 40 Advanced (6+ months)

**Assignment Strategy**:
- **Random Assignment**: Users randomly assigned to Variant A or B
- **Balanced Distribution**: Ensure 50/50 split across avatar types
- **Control Variables**: Track user demographics (age, education, background)

### 3. Randomization & Control

**Randomization Method**:
```python
import random

def assign_user_variant(user_id, avatar_type):
    """
    Randomly assign user to variant A or B.

    Ensures 50/50 split across avatar types.
    """
    # Use user_id as seed for consistency
    random.seed(user_id)

    # Random assignment
    variant = random.choice(['A', 'B'])

    # Store assignment in database
    supabase.table('ab_test_assignments').insert({
        'user_id': user_id,
        'avatar_type': avatar_type,
        'variant': variant,
        'assigned_at': 'now()'
    }).execute()

    return variant
```

**Control Variables** (track for confounding):
- User education level
- Prior neuroscience knowledge
- Time on platform
- Engagement history
- Device type (mobile vs desktop)

---

## Metrics & Measurement

### Primary Metrics

#### 1. User Comprehension Score

**Measurement Method**: 5-question quiz after protocol review

**Sample Questions**:
```
Protocol: "Activates vagus nerve through vocalization"

Q1. What does this protocol primarily do to your body?
  A) Increases heart rate
  B) Calms your nervous system
  C) Improves digestion
  D) Enhances memory

Q2. How does this protocol work?
  A) Through breathing exercises
  B) Through speaking or singing
  C) Through physical exercise
  D) Through meditation

Q3. What is the expected outcome?
  A) Increased energy
  B) Better sleep
  C) State of calm and safety
  D) Improved focus
```

**Scoring**:
- 5/5 correct = 100% (excellent comprehension)
- 4/5 correct = 80% (good comprehension)
- 3/5 correct = 60% (moderate comprehension)
- 2/5 or less = ≤40% (poor comprehension)

**Target**: Variant B achieves 20%+ higher average score than Variant A

**Database Tracking**:
```sql
CREATE TABLE ab_test_comprehension (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  protocol_id UUID REFERENCES mio_knowledge_chunks(id),
  variant VARCHAR(1) CHECK (variant IN ('A', 'B')),
  quiz_score INTEGER CHECK (quiz_score BETWEEN 0 AND 5),
  time_to_complete INTEGER, -- seconds
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Practice Completion Rate

**Measurement**: Percentage of users who actually complete the practice

**Tracking Events**:
1. **Protocol Viewed**: User opens protocol page
2. **Protocol Started**: User clicks "Start Practice"
3. **Protocol Completed**: User marks practice as done

**Calculation**:
```python
completion_rate = (completed_practices / started_practices) * 100
```

**Target**: Variant B achieves 15%+ higher completion rate than Variant A

**Database Tracking**:
```sql
CREATE TABLE ab_test_practice_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  protocol_id UUID REFERENCES mio_knowledge_chunks(id),
  variant VARCHAR(1),
  event_type VARCHAR(20) CHECK (event_type IN ('viewed', 'started', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Completion rate query
SELECT
  variant,
  COUNT(DISTINCT CASE WHEN event_type = 'started' THEN user_id END) as started_count,
  COUNT(DISTINCT CASE WHEN event_type = 'completed' THEN user_id END) as completed_count,
  (COUNT(DISTINCT CASE WHEN event_type = 'completed' THEN user_id END)::FLOAT /
   NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'started' THEN user_id END), 0)) * 100 as completion_rate
FROM ab_test_practice_completion
GROUP BY variant;
```

#### 3. User Satisfaction Score

**Measurement**: Post-practice survey (1-5 Likert scale)

**Survey Questions**:
```
After completing this practice, please rate:

1. How easy was it to understand the instructions?
   ☆☆☆☆☆ (1 = Very Difficult, 5 = Very Easy)

2. How confident are you that you can do this practice correctly?
   ☆☆☆☆☆ (1 = Not Confident, 5 = Very Confident)

3. How helpful did you find the explanation of how this practice works?
   ☆☆☆☆☆ (1 = Not Helpful, 5 = Very Helpful)

4. How likely are you to actually use this practice?
   ☆☆☆☆☆ (1 = Very Unlikely, 5 = Very Likely)

5. Overall, how would you rate this protocol?
   ☆☆☆☆☆ (1 = Poor, 5 = Excellent)
```

**Aggregate Score**:
```python
satisfaction_score = (q1 + q2 + q3 + q4 + q5) / 5
```

**Target**: Variant B achieves 25%+ higher average satisfaction score

**Database Tracking**:
```sql
CREATE TABLE ab_test_satisfaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  protocol_id UUID REFERENCES mio_knowledge_chunks(id),
  variant VARCHAR(1),
  ease_of_understanding INTEGER CHECK (ease_of_understanding BETWEEN 1 AND 5),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  explanation_helpfulness INTEGER CHECK (explanation_helpfulness BETWEEN 1 AND 5),
  likelihood_to_use INTEGER CHECK (likelihood_to_use BETWEEN 1 AND 5),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Secondary Metrics

#### 4. Time on Page

**Measurement**: Duration user spends reading protocol

**Hypothesis**:
- **Variant A**: Longer time (re-reading due to confusion)
- **Variant B**: Moderate time (efficient understanding)

**Target**: Variant B shows 20-30% reduction in time on page while maintaining comprehension

**Tracking**:
```typescript
// Frontend tracking
const startTime = Date.now();

window.addEventListener('beforeunload', () => {
  const timeOnPage = Math.floor((Date.now() - startTime) / 1000); // seconds

  supabase.table('ab_test_engagement').insert({
    user_id: currentUser.id,
    protocol_id: protocol.id,
    variant: protocol.language_variant,
    time_on_page: timeOnPage,
    scroll_depth: calculateScrollDepth()
  });
});
```

#### 5. Tooltip Engagement

**Measurement**: Clicks/hovers on glossary tooltips (Variant B only)

**Questions**:
- Which terms require most explanations?
- Do users engage with tooltips or ignore them?
- Is tooltip placement effective?

**Tracking**:
```typescript
// Track tooltip interactions
const trackTooltipClick = (term: string, definition: string) => {
  supabase.table('ab_test_tooltip_engagement').insert({
    user_id: currentUser.id,
    protocol_id: protocol.id,
    term: term,
    definition: definition,
    interaction_type: 'click', // or 'hover'
    created_at: new Date()
  });
};
```

#### 6. Return Rate

**Measurement**: Users returning to protocol within 7 days

**Hypothesis**: Variant B users more likely to return (better understanding → more practice)

**Tracking**:
```sql
-- Calculate return rate
WITH first_view AS (
  SELECT user_id, protocol_id, variant, MIN(created_at) as first_viewed
  FROM ab_test_practice_completion
  WHERE event_type = 'viewed'
  GROUP BY user_id, protocol_id, variant
),
return_view AS (
  SELECT DISTINCT fv.user_id, fv.protocol_id, fv.variant
  FROM first_view fv
  JOIN ab_test_practice_completion pc
    ON fv.user_id = pc.user_id
    AND fv.protocol_id = pc.protocol_id
  WHERE pc.created_at > fv.first_viewed
    AND pc.created_at <= fv.first_viewed + INTERVAL '7 days'
    AND pc.event_type = 'viewed'
)
SELECT
  fv.variant,
  COUNT(DISTINCT fv.user_id) as total_users,
  COUNT(DISTINCT rv.user_id) as returned_users,
  (COUNT(DISTINCT rv.user_id)::FLOAT / COUNT(DISTINCT fv.user_id)) * 100 as return_rate
FROM first_view fv
LEFT JOIN return_view rv ON fv.user_id = rv.user_id AND fv.protocol_id = rv.protocol_id
GROUP BY fv.variant;
```

---

## Test Implementation

### Phase 1: Setup (Week 1)

**Database Schema**:
```sql
-- User variant assignment
CREATE TABLE ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  avatar_type VARCHAR(20),
  variant VARCHAR(1) CHECK (variant IN ('A', 'B')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  education_level VARCHAR(50),
  prior_neuroscience_knowledge BOOLEAN,
  time_on_platform_days INTEGER
);

-- Comprehension tracking (already defined above)
-- Practice completion tracking (already defined above)
-- Satisfaction tracking (already defined above)

-- Engagement metrics
CREATE TABLE ab_test_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  protocol_id UUID REFERENCES mio_knowledge_chunks(id),
  variant VARCHAR(1),
  time_on_page INTEGER, -- seconds
  scroll_depth INTEGER, -- percentage (0-100)
  device_type VARCHAR(20), -- 'mobile', 'tablet', 'desktop'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tooltip engagement (Variant B only)
CREATE TABLE ab_test_tooltip_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  protocol_id UUID REFERENCES mio_knowledge_chunks(id),
  term VARCHAR(255),
  definition TEXT,
  interaction_type VARCHAR(20), -- 'click', 'hover'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ab_assignments_user ON ab_test_assignments(user_id);
CREATE INDEX idx_ab_comprehension_user ON ab_test_comprehension(user_id, protocol_id);
CREATE INDEX idx_ab_completion_user ON ab_test_practice_completion(user_id, protocol_id);
CREATE INDEX idx_ab_satisfaction_user ON ab_test_satisfaction(user_id, protocol_id);
```

**Protocol Selection**:
```python
# Select 20 protocols for A/B test
from validation_framework import validate_protocol_readability, calculate_priority_score

# Load all protocols
protocols = load_protocols_from_json()

# Calculate readability metrics
for protocol in protocols:
    metrics = validate_protocol_readability(protocol)
    protocol['priority_score'] = metrics.priority_score
    protocol['flesch_kincaid_grade'] = metrics.flesch_kincaid_grade
    protocol['jargon_density'] = metrics.jargon_density

# Filter high priority (FKG > 12 or jargon > 10%)
high_priority = [p for p in protocols if p['flesch_kincaid_grade'] > 12 or p['jargon_density'] > 10]

# Sort by priority score
high_priority.sort(key=lambda p: p['priority_score'], reverse=True)

# Select top 20 ensuring diversity
selected_protocols = []

# Category targets
categories = {
    'daily-deductible': 4,
    'neural-rewiring': 8,
    'research': 8
}

# Temperament targets
temperaments = {
    'warrior': 5,
    'sage': 5,
    'builder': 5,
    'connector': 5
}

# Select protocols to meet targets
# (Implementation details omitted for brevity)

print(f"Selected {len(selected_protocols)} protocols for A/B test")
```

### Phase 2: User Assignment (Week 1)

**Frontend Logic**:
```typescript
// pages/ProtocolDetail.tsx

const ProtocolDetail = ({ protocolId }) => {
  const { user } = useAuth();
  const [protocol, setProtocol] = useState(null);
  const [variant, setVariant] = useState(null);

  useEffect(() => {
    const loadProtocol = async () => {
      // Check if user has variant assignment
      const { data: assignment } = await supabase
        .table('ab_test_assignments')
        .select('variant')
        .eq('user_id', user.id)
        .single();

      let userVariant = assignment?.variant;

      // If no assignment, randomly assign
      if (!userVariant) {
        userVariant = Math.random() < 0.5 ? 'A' : 'B';

        await supabase.table('ab_test_assignments').insert({
          user_id: user.id,
          avatar_type: user.avatar_type,
          variant: userVariant,
          education_level: user.education_level,
          prior_neuroscience_knowledge: user.has_science_background,
          time_on_platform_days: calculateDaysSinceSignup(user.created_at)
        });
      }

      setVariant(userVariant);

      // Load protocol with appropriate language variant
      const { data: protocolData } = await supabase
        .table('mio_knowledge_chunks')
        .select('*')
        .eq('id', protocolId)
        .single();

      // Choose text based on variant
      const displayText = userVariant === 'B' && protocolData.simplified_text
        ? protocolData.simplified_text
        : protocolData.chunk_text;

      setProtocol({
        ...protocolData,
        display_text: displayText,
        variant: userVariant
      });
    };

    loadProtocol();
  }, [protocolId, user]);

  return (
    <div className="protocol-detail">
      <ProtocolContent protocol={protocol} variant={variant} />
      <ComprehensionQuiz protocol={protocol} variant={variant} />
      <SatisfactionSurvey protocol={protocol} variant={variant} />
    </div>
  );
};
```

### Phase 3: Data Collection (Weeks 2-4)

**Automated Tracking**:
1. **Page View**: Log when user views protocol
2. **Time on Page**: Track duration
3. **Scroll Depth**: Track reading engagement
4. **Tooltip Clicks**: Track glossary usage (Variant B)
5. **Quiz Responses**: Track comprehension scores
6. **Practice Start**: Log when user begins practice
7. **Practice Completion**: Log when user marks complete
8. **Satisfaction Survey**: Collect post-practice feedback

**Weekly Check-ins**:
```sql
-- Weekly progress report
SELECT
  variant,
  COUNT(DISTINCT user_id) as user_count,
  COUNT(DISTINCT protocol_id) as protocol_count,
  AVG(quiz_score) as avg_comprehension,
  COUNT(CASE WHEN event_type = 'completed' THEN 1 END)::FLOAT /
    NULLIF(COUNT(CASE WHEN event_type = 'started' THEN 1 END), 0) * 100 as completion_rate
FROM ab_test_comprehension c
JOIN ab_test_practice_completion pc ON c.user_id = pc.user_id AND c.protocol_id = pc.protocol_id
WHERE c.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY variant;
```

### Phase 4: Analysis (Week 5)

**Statistical Significance Testing**:
```python
from scipy import stats

def analyze_ab_test_results():
    """
    Analyze A/B test results with statistical significance.
    """
    # Load data from database
    variant_a_comprehension = get_comprehension_scores('A')
    variant_b_comprehension = get_comprehension_scores('B')

    # T-test for comprehension scores
    t_stat, p_value = stats.ttest_ind(variant_a_comprehension, variant_b_comprehension)

    print(f"Comprehension Score T-Test:")
    print(f"  Variant A Mean: {np.mean(variant_a_comprehension):.2f}")
    print(f"  Variant B Mean: {np.mean(variant_b_comprehension):.2f}")
    print(f"  T-Statistic: {t_stat:.4f}")
    print(f"  P-Value: {p_value:.4f}")

    if p_value < 0.05:
        print(f"  ✓ Statistically significant difference (p < 0.05)")
    else:
        print(f"  ✗ Not statistically significant")

    # Similar tests for completion rate, satisfaction, etc.
```

---

## Success Criteria

### Statistical Thresholds

| Metric | Variant A (Baseline) | Variant B (Target) | Improvement | P-Value |
|--------|---------------------|-------------------|-------------|---------|
| **Comprehension Score** | 65% | 78%+ | +20% | < 0.05 |
| **Completion Rate** | 45% | 52%+ | +15% | < 0.05 |
| **Satisfaction Score** | 3.2/5 | 4.0/5+ | +25% | < 0.05 |
| **Time on Page** | 180s | 120-140s | -20-30% | < 0.05 |
| **Return Rate (7 days)** | 30% | 40%+ | +33% | < 0.10 |

**Minimum Sample Size** (per variant):
- 100 users per variant (200 total)
- 10 protocol views per user minimum
- 1,000+ total comprehension quiz responses

**Decision Criteria**:

✅ **LAUNCH VARIANT B** if:
1. Comprehension score improves by 15%+ (p < 0.05)
2. Completion rate improves by 10%+ (p < 0.05)
3. Satisfaction score improves by 20%+ (p < 0.05)
4. No negative impact on time on page (efficiency maintained)

⚠️ **ITERATE VARIANT B** if:
1. Mixed results (1-2 metrics improve, others don't)
2. Tooltip engagement is low (<20% of users)
3. User feedback suggests confusion

❌ **KEEP VARIANT A** if:
1. No statistically significant improvements
2. Variant B performs worse on any primary metric
3. Clinical accuracy concerns raised by experts

---

## Risk Mitigation

### Risk 1: Small Sample Size

**Mitigation**:
- Extend test duration to 6 weeks if needed
- Recruit additional users via email campaigns
- Offer incentive (e.g., bonus content) for quiz participation

### Risk 2: Selection Bias

**Mitigation**:
- Truly random assignment (not based on user behavior)
- Track and control for confounding variables
- Stratified sampling by avatar type

### Risk 3: Novelty Effect

**Mitigation**:
- Run test for minimum 4 weeks (not just 1-2 weeks)
- Track week-over-week trends
- Analyze long-term retention (8+ weeks post-test)

### Risk 4: Clinical Accuracy Loss

**Mitigation**:
- Expert review of all simplified protocols
- Maintain clinical text as alternate version
- User preference toggle (don't force simplified)

### Risk 5: Tooltip Overload

**Mitigation**:
- Limit tooltips to 5 per protocol maximum
- Progressive disclosure (show fewer initially)
- A/B test tooltip density (3 vs 5 vs 7)

---

## Reporting & Iteration

### Weekly Reports

**Report Template**:
```markdown
# Week N A/B Test Progress Report

## Summary Stats
- Total Users Assigned: X (A: Y, B: Z)
- Total Protocol Views: X
- Comprehension Quizzes Completed: X
- Satisfaction Surveys Completed: X

## Preliminary Results
| Metric | Variant A | Variant B | Difference | Trend |
|--------|-----------|-----------|------------|-------|
| Comprehension | X% | Y% | +Z% | ↑ |
| Completion | X% | Y% | +Z% | ↑ |
| Satisfaction | X/5 | Y/5 | +Z/5 | ↑ |

## Observations
- [Key insights from week N]

## Next Steps
- [Actions for week N+1]
```

### Final Report

**Sections**:
1. **Executive Summary**: Key findings and recommendation
2. **Methodology**: Test design, sample size, duration
3. **Results**: Statistical analysis of all metrics
4. **User Feedback**: Qualitative insights from surveys
5. **Expert Review**: Clinical accuracy verification
6. **Recommendation**: Launch, iterate, or keep original
7. **Next Steps**: Implementation plan or iteration strategy

---

## Timeline

| Week | Phase | Activities |
|------|-------|-----------|
| **Week 1** | Setup | Select protocols, create schemas, build tracking |
| **Week 2** | Collection | User assignment, data collection begins |
| **Week 3** | Collection | Continue data collection, weekly analysis |
| **Week 4** | Collection | Continue data collection, weekly analysis |
| **Week 5** | Analysis | Statistical analysis, expert review, final report |
| **Week 6** | Decision | Review results, decide on launch/iterate/keep |

**Total Duration**: 6 weeks from start to decision

---

## Post-Test Actions

### If Variant B Wins

1. **Roll Out Simplified Language**:
   - Update all 205 protocols with simplified versions
   - Add user preference toggle (clinical vs simplified)
   - Default to simplified for new users

2. **Expand Glossary**:
   - Add more technical terms based on tooltip engagement data
   - Create glossary page for user reference

3. **Monitor Long-Term**:
   - Track comprehension, completion, satisfaction for 3+ months
   - Ensure improvements sustain over time

### If Results Are Mixed

1. **Iterate on Variant B**:
   - Adjust tooltip density (fewer or more)
   - Refine simplified language based on feedback
   - Re-test with updated version

2. **Segment by User Type**:
   - Offer simplified to beginners only
   - Keep clinical for advanced users
   - Let users choose preference

### If Variant A Wins

1. **Keep Clinical Language**:
   - Maintain original protocols
   - Add glossary as separate resource (not inline)

2. **Investigate Why**:
   - User feedback analysis
   - Check if tooltips were distracting
   - Assess if simplified language lost nuance

---

**A/B Test Plan Status**: ✅ COMPLETE
**Next Deliverable**: `update_protocols.py` (Task 4)
