-- =====================================================================================
-- Seed mio_triage_keywords table
-- Source: src/services/relational-safety-keywords.ts
-- 4-color clinical triage: RED (crisis) | ORANGE (referral) | YELLOW (monitor) | GREEN (coaching)
-- Total: ~196 keywords across 15 categories
-- =====================================================================================

-- Idempotent: skip if already populated
DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM mio_triage_keywords LIMIT 1) THEN
    RAISE NOTICE 'mio_triage_keywords already populated — skipping seed.';
    RETURN;
  END IF;

  -- =========================================================================
  -- RED KEYWORDS — Immediate Safety/Crisis
  -- Action: Crisis resources IMMEDIATELY. No coaching.
  -- =========================================================================

  INSERT INTO mio_triage_keywords (keyword, triage_color, category, match_type, priority, response_guidance, referral_type) VALUES
  -- Violence & Physical Safety
  ('hitting me',       'red', 'violence', 'substring', 10, 'Provide National DV Hotline (1-800-799-7233) immediately. Safety planning priority.', 'domestic_violence'),
  ('hit me',           'red', 'violence', 'substring', 10, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('hits me',          'red', 'violence', 'substring', 10, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('he hits',          'red', 'violence', 'substring', 10, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('she hits',         'red', 'violence', 'substring', 10, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('beats me',         'red', 'violence', 'substring', 10, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('punched',          'red', 'violence', 'substring', 10, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('slapped',          'red', 'violence', 'substring', 10, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('kicked me',        'red', 'violence', 'substring', 10, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('threw me',         'red', 'violence', 'substring', 10, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('grabbed me',       'red', 'violence', 'substring',  9, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('pushed me',        'red', 'violence', 'substring',  9, 'Provide National DV Hotline immediately.', 'domestic_violence'),
  ('choking me',       'red', 'violence', 'substring', 10, 'Strangulation = highest lethality risk. Call 911 or DV hotline.', 'crisis_hotline'),
  ('choked me',        'red', 'violence', 'substring', 10, 'Strangulation = highest lethality risk. Call 911 or DV hotline.', 'crisis_hotline'),
  ('strangling',       'red', 'violence', 'substring', 10, 'Strangulation = highest lethality risk. Call 911 or DV hotline.', 'crisis_hotline'),
  ('threatened to kill','red','violence', 'substring', 10, 'Death threat = immediate danger. Call 911.', 'crisis_hotline'),
  ('going to kill',    'red', 'violence', 'substring', 10, 'Death threat = immediate danger. Call 911.', 'crisis_hotline'),
  ('afraid for my life','red','violence', 'substring', 10, 'Immediate safety planning required. DV hotline + 911.', 'crisis_hotline'),
  ('scared for my life','red','violence', 'substring', 10, 'Immediate safety planning required. DV hotline + 911.', 'crisis_hotline'),
  ('fear for my life', 'red', 'violence', 'substring', 10, 'Immediate safety planning required. DV hotline + 911.', 'crisis_hotline'),
  ('fear for my safety','red','violence', 'substring', 10, 'Immediate safety planning required. DV hotline + 911.', 'crisis_hotline'),
  ('weapon',           'red', 'violence', 'substring', 10, 'Weapon involvement = extreme danger. Call 911.', 'crisis_hotline'),
  ('gun',              'red', 'violence', 'substring',  9, 'Firearm access = 5x lethality risk. Immediate safety plan.', 'crisis_hotline'),
  ('knife',            'red', 'violence', 'substring',  9, 'Weapon involvement = extreme danger. Call 911.', 'crisis_hotline'),

  -- Self-Harm & Suicidality
  ('want to die',      'red', 'self_harm', 'substring', 10, '988 Suicide & Crisis Lifeline immediately.', 'crisis_hotline'),
  ('kill myself',      'red', 'self_harm', 'substring', 10, '988 Suicide & Crisis Lifeline immediately.', 'crisis_hotline'),
  ('suicidal',         'red', 'self_harm', 'substring', 10, '988 Suicide & Crisis Lifeline immediately.', 'crisis_hotline'),
  ('self harm',        'red', 'self_harm', 'substring', 10, '988 Suicide & Crisis Lifeline. Do not coach.', 'crisis_hotline'),
  ('self-harm',        'red', 'self_harm', 'substring', 10, '988 Suicide & Crisis Lifeline. Do not coach.', 'crisis_hotline'),
  ('cutting myself',   'red', 'self_harm', 'substring', 10, '988 Suicide & Crisis Lifeline. Immediate referral.', 'crisis_hotline'),
  ('end it all',       'red', 'self_harm', 'substring',  9, 'Assess for suicidal ideation. Provide 988.', 'crisis_hotline'),
  ('end my life',      'red', 'self_harm', 'substring', 10, 'Assess for suicidal ideation. Provide 988.', 'crisis_hotline'),
  ('no reason to live','red', 'self_harm', 'substring',  9, 'Hopelessness indicator. Provide 988.', 'crisis_hotline'),
  ('better off without me','red','self_harm','substring', 9, 'Indirect suicidal ideation. Provide 988.', 'crisis_hotline'),
  ('better off dead',  'red', 'self_harm', 'substring', 10, 'Suicidal ideation. Provide 988.', 'crisis_hotline'),
  ('don''t want to be here','red','self_harm','substring',9, 'Indirect suicidal ideation. Provide 988.', 'crisis_hotline'),
  ('can''t go on',     'red', 'self_harm', 'substring',  8, 'Hopelessness indicator. Assess carefully. Provide 988.', 'crisis_hotline'),
  ('hurting myself',   'red', 'self_harm', 'substring', 10, '988 Suicide & Crisis Lifeline. Do not coach.', 'crisis_hotline'),
  ('ending it',        'red', 'self_harm', 'substring',  9, 'Assess for suicidal ideation. Provide 988.', 'crisis_hotline'),

  -- Child Safety
  ('hurting the kids', 'red', 'child_safety', 'substring', 10, 'Childhelp Hotline (1-800-422-4453). Mandatory reporting applies.', 'child_protective'),
  ('hurting my child', 'red', 'child_safety', 'substring', 10, 'Childhelp Hotline immediately. Mandatory reporting.', 'child_protective'),
  ('hitting the kids', 'red', 'child_safety', 'substring', 10, 'Childhelp Hotline immediately. Mandatory reporting.', 'child_protective'),
  ('abusing the children','red','child_safety','substring',10,'Childhelp Hotline immediately. Mandatory reporting.', 'child_protective'),
  ('abusing my child', 'red', 'child_safety', 'substring', 10, 'Childhelp Hotline immediately. Mandatory reporting.', 'child_protective'),
  ('molesting',        'red', 'child_safety', 'substring', 10, 'RAINN (1-800-656-4673) + CPS. Mandatory reporting.', 'child_protective'),
  ('touching my child','red', 'child_safety', 'substring', 10, 'RAINN + CPS. Mandatory reporting.', 'child_protective'),
  ('hurting our child','red', 'child_safety', 'substring', 10, 'Childhelp Hotline immediately. Mandatory reporting.', 'child_protective'),
  ('bruises on',       'red', 'child_safety', 'substring',  9, 'Physical abuse indicator. Childhelp Hotline + CPS.', 'child_protective'),

  -- Sexual Violence
  ('raped me',         'red', 'sexual_violence', 'substring', 10, 'RAINN (1-800-656-4673) immediately. No coaching.', 'sexual_assault'),
  ('raped',            'red', 'sexual_violence', 'substring', 10, 'RAINN immediately.', 'sexual_assault'),
  ('sexual assault',   'red', 'sexual_violence', 'substring', 10, 'RAINN immediately.', 'sexual_assault'),
  ('sexually assaulted','red','sexual_violence', 'substring', 10, 'RAINN immediately.', 'sexual_assault'),
  ('forced me sexually','red','sexual_violence', 'substring', 10, 'RAINN immediately. Marital rape is real and illegal.', 'sexual_assault'),
  ('forces me to have sex','red','sexual_violence','substring',10,'RAINN immediately. Marital rape is real and illegal.', 'sexual_assault'),
  ('forced me to have sex','red','sexual_violence','substring',10,'RAINN immediately. Marital rape is real and illegal.', 'sexual_assault');

  -- =========================================================================
  -- ORANGE KEYWORDS — Professional Referral Required
  -- Action: Provide referral + limited supportive coaching
  -- =========================================================================

  INSERT INTO mio_triage_keywords (keyword, triage_color, category, match_type, priority, response_guidance, referral_type) VALUES
  -- Addiction & Substance
  ('addiction',        'orange', 'substance', 'substring', 8, 'SAMHSA (1-800-662-4357). Recommend individual + couples therapy.', 'addiction_counselor'),
  ('addicted',         'orange', 'substance', 'substring', 8, 'SAMHSA helpline. Professional assessment needed.', 'addiction_counselor'),
  ('drinking problem', 'orange', 'substance', 'substring', 8, 'SAMHSA helpline. Al-Anon for partner support.', 'addiction_counselor'),
  ('can''t stop drinking','orange','substance','substring', 8, 'SAMHSA helpline. Al-Anon for partner support.', 'addiction_counselor'),
  ('drunk every',      'orange', 'substance', 'substring', 8, 'SAMHSA helpline. Alcohol dependence assessment.', 'addiction_counselor'),
  ('alcoholic',        'orange', 'substance', 'substring', 8, 'SAMHSA helpline. Al-Anon for partner support.', 'addiction_counselor'),
  ('drug use',         'orange', 'substance', 'substring', 8, 'SAMHSA helpline. Recovery support groups.', 'addiction_counselor'),
  ('using drugs',      'orange', 'substance', 'substring', 8, 'SAMHSA helpline. Recovery support groups.', 'addiction_counselor'),
  ('relapsed',         'orange', 'substance', 'substring', 7, 'Reconnect with sponsor/treatment. SAMHSA for resources.', 'addiction_counselor'),
  ('relapse',          'orange', 'substance', 'substring', 7, 'Reconnect with sponsor/treatment. SAMHSA for resources.', 'addiction_counselor'),
  ('porn addiction',   'orange', 'substance', 'substring', 7, 'CSAT (Certified Sex Addiction Therapist) referral.', 'therapist'),
  ('watching porn',    'orange', 'substance', 'substring', 6, 'CSAT referral if compulsive. Assess impact on relationship.', 'therapist'),
  ('need pills',       'orange', 'substance', 'substring', 7, 'Substance dependence indicator. SAMHSA referral.', 'addiction_counselor'),

  -- Mental Health
  ('flashbacks',       'orange', 'mental_health', 'substring', 8, 'PTSD/trauma specialist referral. EMDR may help.', 'therapist'),
  ('personality disorder','orange','mental_health','substring',7, 'DBT specialist referral. Individual therapy first.', 'psychiatrist'),
  ('bipolar',          'orange', 'mental_health', 'substring', 7, 'Psychiatrist for medication management + therapy.', 'psychiatrist'),
  ('psychotic',        'orange', 'mental_health', 'substring', 9, 'Emergency psychiatric evaluation needed.', 'psychiatrist'),
  ('hallucinating',    'orange', 'mental_health', 'substring', 9, 'Emergency psychiatric evaluation needed.', 'psychiatrist'),
  ('hearing voices',   'orange', 'mental_health', 'substring', 9, 'Emergency psychiatric evaluation needed.', 'psychiatrist'),
  ('dissociating',     'orange', 'mental_health', 'substring', 8, 'Trauma specialist referral. Grounding techniques in interim.', 'therapist'),
  ('dissociat',        'orange', 'mental_health', 'substring', 8, 'Trauma specialist referral. Grounding techniques in interim.', 'therapist'),
  ('eating disorder',  'orange', 'mental_health', 'substring', 8, 'NEDA Hotline (1-800-931-2237). ED specialist referral.', 'therapist'),
  ('anorexia',         'orange', 'mental_health', 'substring', 8, 'NEDA Hotline (1-800-931-2237). ED specialist referral.', 'therapist'),
  ('bulimi',           'orange', 'mental_health', 'substring', 8, 'NEDA Hotline (1-800-931-2237). ED specialist referral.', 'therapist'),
  ('purging',          'orange', 'mental_health', 'substring', 8, 'NEDA Hotline (1-800-931-2237). ED specialist referral.', 'therapist'),
  ('binge eating',     'orange', 'mental_health', 'substring', 7, 'NEDA Hotline (1-800-931-2237). ED specialist referral.', 'therapist'),
  ('not eating',       'orange', 'mental_health', 'substring', 7, 'Assess for eating disorder. NEDA referral.', 'therapist'),
  ('get out of bed',   'orange', 'mental_health', 'substring', 7, 'Depression indicator. Professional assessment needed.', 'therapist'),
  ('can''t function',  'orange', 'mental_health', 'substring', 7, 'Functional impairment. Professional assessment needed.', 'therapist'),
  ('panic attack',     'orange', 'mental_health', 'substring', 7, 'Panic disorder assessment. Therapist + possible psychiatrist.', 'therapist'),
  ('anxiety',          'orange', 'mental_health', 'substring', 6, 'Clinical anxiety assessment. Therapist referral.', 'therapist'),

  -- Abuse Patterns
  ('controlling behavior','orange','abuse_pattern','substring',7, 'Assess for coercive control. DV advocate referral.', 'domestic_violence'),
  ('controls me',      'orange', 'abuse_pattern', 'substring', 7, 'Assess for coercive control. DV advocate referral.', 'domestic_violence'),
  ('controls everything','orange','abuse_pattern','substring', 7, 'Coercive control indicator. DV advocate.', 'domestic_violence'),
  ('isolating me',     'orange', 'abuse_pattern', 'substring', 7, 'Isolation = coercive control indicator. DV advocate.', 'domestic_violence'),
  ('won''t let me see','orange', 'abuse_pattern', 'substring', 7, 'Isolation pattern. DV advocate referral.', 'domestic_violence'),
  ('monitoring my phone','orange','abuse_pattern','substring', 7, 'Surveillance = coercive control. DV hotline.', 'domestic_violence'),
  ('tracking my',      'orange', 'abuse_pattern', 'substring', 7, 'Surveillance = coercive control. DV hotline.', 'domestic_violence'),
  ('checking my phone','orange', 'abuse_pattern', 'substring', 6, 'Surveillance behavior. Assess for coercive control.', 'domestic_violence'),
  ('narcissist',       'orange', 'abuse_pattern', 'substring', 6, 'Individual therapy first. Couples therapy NOT recommended with NPD.', 'therapist'),
  ('narcissistic',     'orange', 'abuse_pattern', 'substring', 6, 'Individual therapy first. Couples therapy NOT recommended with NPD.', 'therapist'),
  ('gaslighting',      'orange', 'abuse_pattern', 'substring', 7, 'Gaslighting = psychological abuse. Individual therapy referral.', 'therapist'),
  ('gaslight',         'orange', 'abuse_pattern', 'substring', 7, 'Gaslighting = psychological abuse. Individual therapy referral.', 'therapist'),
  ('making me feel crazy','orange','abuse_pattern','substring',7, 'Possible gaslighting. Individual therapy referral.', 'therapist'),
  ('emotional abuse',  'orange', 'abuse_pattern', 'substring', 7, 'Individual therapy. Assess safety before couples work.', 'therapist'),
  ('emotionally abusive','orange','abuse_pattern','substring', 7, 'Individual therapy. Assess safety before couples work.', 'therapist'),
  ('verbally abusive', 'orange', 'abuse_pattern', 'substring', 7, 'Verbal abuse pattern. Individual therapy referral.', 'therapist'),
  ('coercive control', 'orange', 'abuse_pattern', 'substring', 8, 'Coercive control = abuse pattern. DV advocate referral.', 'domestic_violence'),
  ('is abusive',       'orange', 'abuse_pattern', 'substring', 7, 'Abuse disclosure. Individual therapy + safety planning.', 'domestic_violence'),
  ('he''s cruel',      'orange', 'abuse_pattern', 'substring', 7, 'Possible emotional abuse. Individual therapy referral.', 'therapist'),
  ('she''s cruel',     'orange', 'abuse_pattern', 'substring', 7, 'Possible emotional abuse. Individual therapy referral.', 'therapist'),
  ('abusive relationship','orange','abuse_pattern','substring',7, 'Abuse identified. DV advocate + individual therapy.', 'domestic_violence'),
  ('in an abusive',    'orange', 'abuse_pattern', 'substring', 7, 'Abuse identified. DV advocate + individual therapy.', 'domestic_violence'),
  ('breaks things',    'orange', 'abuse_pattern', 'substring', 7, 'Property destruction = intimidation/abuse. DV advocate.', 'domestic_violence'),
  ('name-calling',     'orange', 'abuse_pattern', 'substring', 6, 'Verbal abuse pattern. Individual therapy referral.', 'therapist'),
  ('name calling',     'orange', 'abuse_pattern', 'substring', 6, 'Verbal abuse pattern. Individual therapy referral.', 'therapist'),
  ('calls me names',   'orange', 'abuse_pattern', 'substring', 6, 'Verbal abuse pattern. Individual therapy referral.', 'therapist'),
  ('cruel to me',      'orange', 'abuse_pattern', 'substring', 7, 'Cruelty = emotional abuse indicator. Individual therapy.', 'therapist'),
  ('cruel to her',     'orange', 'abuse_pattern', 'substring', 7, 'Cruelty = emotional abuse indicator. Individual therapy.', 'therapist'),
  ('cruel to him',     'orange', 'abuse_pattern', 'substring', 7, 'Cruelty = emotional abuse indicator. Individual therapy.', 'therapist'),
  ('threatening to take the kids','orange','abuse_pattern','substring',8, 'Custody threats = coercive control. DV advocate + family attorney.', 'domestic_violence'),
  ('threatening to take my kids','orange','abuse_pattern','substring',8, 'Custody threats = coercive control. DV advocate + family attorney.', 'domestic_violence'),
  ('controls all the money','orange','abuse_pattern','substring',7, 'Financial abuse = coercive control. DV advocate.', 'domestic_violence'),
  ('controls the money','orange','abuse_pattern', 'substring', 7, 'Financial abuse = coercive control. DV advocate.', 'domestic_violence'),
  ('won''t let me work','orange','abuse_pattern', 'substring', 7, 'Economic abuse = coercive control. DV advocate.', 'domestic_violence'),

  -- Infidelity (Active)
  ('having an affair', 'orange', 'infidelity', 'substring', 6, 'Infidelity specialist/EFT therapist referral.', 'therapist'),
  ('cheating on me',   'orange', 'infidelity', 'substring', 6, 'Betrayal trauma support. Individual therapy first.', 'therapist'),
  ('cheated on me',    'orange', 'infidelity', 'substring', 6, 'Betrayal trauma support. Individual therapy first.', 'therapist'),
  ('discovered affair','orange', 'infidelity', 'substring', 7, 'Acute betrayal trauma. Individual support before couples.', 'therapist'),
  ('found out about the affair','orange','infidelity','substring',7, 'Acute betrayal trauma. Individual support before couples.', 'therapist'),
  ('sleeping with someone','orange','infidelity','substring', 6, 'Active infidelity. Infidelity specialist referral.', 'therapist'),
  ('about his affair', 'orange', 'infidelity', 'substring', 7, 'Acute betrayal trauma. Individual support before couples.', 'therapist'),
  ('about her affair', 'orange', 'infidelity', 'substring', 7, 'Acute betrayal trauma. Individual support before couples.', 'therapist');

  -- =========================================================================
  -- YELLOW KEYWORDS — Monitor + Coach
  -- Action: MIO coaching with monitoring and soft referral
  -- =========================================================================

  INSERT INTO mio_triage_keywords (keyword, triage_color, category, match_type, priority, response_guidance, referral_type) VALUES
  -- Relationship Distress
  ('always fighting',  'yellow', 'relationship_distress', 'substring', 5, 'Conflict escalation pattern. Gottman repair interventions.', NULL),
  ('growing apart',    'yellow', 'relationship_distress', 'substring', 5, 'Emotional distance. Love maps and turning toward.', NULL),
  ('don''t trust',     'yellow', 'relationship_distress', 'substring', 6, 'Trust erosion. Assess root cause before intervention.', NULL),
  ('resentment',       'yellow', 'relationship_distress', 'substring', 5, 'Built-up resentment. Processing + repair rituals.', NULL),
  ('contempt',         'yellow', 'relationship_distress', 'substring', 6, 'Contempt = strongest divorce predictor. Culture of appreciation.', NULL),
  ('stonewalling',     'yellow', 'relationship_distress', 'substring', 5, 'Physiological flooding. Self-soothing + structured breaks.', NULL),
  ('silent treatment', 'yellow', 'relationship_distress', 'substring', 5, 'Withdrawal pattern. Distinguish from flooding vs. punishment.', NULL),
  ('feel alone in marriage','yellow','relationship_distress','substring',5, 'Emotional isolation. Attachment needs assessment.', NULL),
  ('lost spark',       'yellow', 'relationship_distress', 'substring', 4, 'Passion vs. companionate love. Intentional connection.', NULL),
  ('considering divorce','yellow','relationship_distress','substring', 6, 'Discernment counseling recommended. Not couples therapy yet.', NULL),
  ('want a divorce',   'yellow', 'relationship_distress', 'substring', 6, 'Discernment counseling recommended. Assess readiness.', NULL),
  ('thinking about leaving','yellow','relationship_distress','substring',6, 'Ambivalence assessment. Discernment process.', NULL),
  ('thinking about divorce','yellow','relationship_distress','substring',6, 'Ambivalence assessment. Discernment process.', NULL),
  ('want to leave',    'yellow', 'relationship_distress', 'substring', 6, 'Ambivalence assessment. Discernment process.', NULL),
  ('falling out of love','yellow','relationship_distress','substring', 5, 'Love is a verb framework. Intentional rituals.', NULL),
  ('don''t love',      'yellow', 'relationship_distress', 'substring', 5, 'Love is a verb framework. Intentional rituals.', NULL),
  ('not in love',      'yellow', 'relationship_distress', 'substring', 5, 'Love is a verb framework. Intentional rituals.', NULL),
  ('four horsemen',    'yellow', 'relationship_distress', 'substring', 5, 'Gottman Four Horsemen intervention. Antidotes for each.', NULL),
  ('we never talk',    'yellow', 'relationship_distress', 'substring', 5, 'Communication shutdown. Structured conversation rituals.', NULL),
  ('like roommates',   'yellow', 'relationship_distress', 'substring', 5, 'Emotional disconnection. Intentional connection rituals.', NULL),
  ('separated',        'yellow', 'relationship_distress', 'substring', 5, 'Separation phase. Discernment counseling or structured separation agreement.', NULL),
  ('fighting every day','yellow','relationship_distress','substring', 5, 'Daily conflict escalation. De-escalation + repair rituals.', NULL),
  ('fight all the time','yellow','relationship_distress','substring', 5, 'Chronic conflict pattern. Gottman repair interventions.', NULL),
  ('argue all the time','yellow','relationship_distress','substring', 5, 'Chronic conflict pattern. Gottman repair interventions.', NULL),
  ('separating',       'yellow', 'relationship_distress', 'substring', 6, 'Separation consideration. Discernment counseling.', NULL),
  ('alone and disconnected','yellow','relationship_distress','substring',5, 'Emotional isolation. Attachment needs assessment.', NULL),
  ('want to scream',   'yellow', 'relationship_distress', 'substring', 5, 'Emotional overwhelm. Stress management + repair.', NULL),

  -- Parenting Stress
  ('fighting about kids','yellow','parenting', 'substring', 5, 'Co-parenting alignment. Unified front strategies.', NULL),
  ('fighting about the kids','yellow','parenting','substring',5, 'Co-parenting alignment. Unified front strategies.', NULL),
  ('parenting conflict','yellow','parenting', 'substring', 5, 'Different parenting styles. Values alignment work.', NULL),
  ('disagree about parenting','yellow','parenting','substring',5, 'Different parenting styles. Values alignment work.', NULL),
  ('step-parent',      'yellow', 'parenting', 'substring', 5, 'Blended family dynamics. Role clarity and boundaries.', NULL),
  ('stepparent',       'yellow', 'parenting', 'substring', 5, 'Blended family dynamics. Role clarity and boundaries.', NULL),
  ('blended family',   'yellow', 'parenting', 'substring', 5, 'Blended family dynamics. Role clarity and boundaries.', NULL),
  ('how to discipline','yellow', 'parenting', 'substring', 5, 'Discipline disagreement. Unified parenting approach.', NULL),
  ('discipline our kids','yellow','parenting','substring', 5, 'Discipline alignment. Co-parenting strategies.', NULL),

  -- Financial Stress
  ('money fights',     'yellow', 'financial', 'substring', 5, 'Financial communication. Values-based budgeting.', NULL),
  ('financial stress', 'yellow', 'financial', 'substring', 5, 'Financial stress protocol. Team vs. adversaries.', NULL),
  ('hiding money',     'yellow', 'financial', 'substring', 6, 'Financial infidelity pattern. Trust rebuilding.', NULL),
  ('secret spending',  'yellow', 'financial', 'substring', 6, 'Financial betrayal. Transparency protocol.', NULL),
  ('hiding debt',      'yellow', 'financial', 'substring', 6, 'Financial infidelity. Trust rebuilding + transparency.', NULL),

  -- Intimacy Issues
  ('sexless marriage', 'yellow', 'intimacy', 'substring', 5, 'Desire discrepancy. Rule out medical + relational causes.', NULL),
  ('no intimacy',      'yellow', 'intimacy', 'substring', 5, 'Emotional + physical intimacy assessment.', NULL),
  ('different sex drives','yellow','intimacy','substring', 4, 'Desire discrepancy normalization + scheduling.', NULL),
  ('haven''t been intimate','yellow','intimacy','substring',5, 'Intimacy gap. Rule out medical + relational causes.', NULL),
  ('not been intimate','yellow', 'intimacy', 'substring', 5, 'Intimacy gap. Rule out medical + relational causes.', NULL),

  -- In-Law/Family
  ('in-law problems',  'yellow', 'family', 'substring', 4, 'Boundary setting. Leaving and cleaving.', NULL),
  ('his mother',       'yellow', 'family', 'substring', 4, 'Mother-in-law boundaries. Partner unity.', NULL),
  ('her mother',       'yellow', 'family', 'substring', 4, 'Mother-in-law boundaries. Partner unity.', NULL),

  -- Infidelity (Discovery/Suspicion)
  ('sexual messages',  'yellow', 'infidelity', 'substring', 6, 'Emotional/digital infidelity discovery. Trust assessment.', NULL),
  ('texting another',  'yellow', 'infidelity', 'substring', 5, 'Possible emotional affair. Trust + boundary assessment.', NULL),

  -- Military/Deployment
  ('deployed',         'yellow', 'relationship_distress', 'substring', 5, 'Military deployment stress. Structured connection rituals.', NULL);

  -- =========================================================================
  -- GREEN KEYWORDS — Full Coaching
  -- Action: Full MIO relational coaching engagement
  -- =========================================================================

  INSERT INTO mio_triage_keywords (keyword, triage_color, category, match_type, priority, response_guidance, referral_type) VALUES
  ('better communication','green','growth', 'substring', 3, 'Active listening, I-statements, structured conversations.', NULL),
  ('date night',       'green', 'growth', 'substring', 2, 'Intentional connection rituals. Quality over quantity.', NULL),
  ('appreciation',     'green', 'growth', 'substring', 2, 'Culture of appreciation. 5:1 positive ratio.', NULL),
  ('grow together',    'green', 'growth', 'substring', 2, 'Shared meaning-making. Relationship vision.', NULL),
  ('love languages',   'green', 'growth', 'substring', 2, 'Chapman framework. Giving in partner''s language.', NULL),
  ('how to be a better husband','green','growth','substring',3, 'Emotional availability, initiative, presence.', NULL),
  ('how to be a better wife','green','growth','substring', 3, 'Mutual respect, emotional connection, appreciation.', NULL),
  ('strengthen marriage','green','growth', 'substring', 2, 'Proactive relationship maintenance. Gottman Sound Relationship House.', NULL),
  ('premarital',       'green', 'formation', 'substring', 3, 'PREPARE/ENRICH framework. Premarital education.', NULL),
  ('engaged',          'green', 'formation', 'substring', 2, 'Premarital assessment. Key conversation areas.', NULL),
  ('newlywed',         'green', 'formation', 'substring', 2, 'First-year adjustment. Expectations vs. reality.', NULL),
  ('conflict resolution','green','growth', 'substring', 3, 'Gottman dreams within conflict. Softened startup.', NULL),
  ('emotional connection','green','growth','substring', 3, 'EFT hold me tight conversations. Turning toward.', NULL),
  ('rebuild trust',    'green', 'growth', 'substring', 4, 'Trust rebuilding protocol. Transparency + consistency.', NULL),
  ('forgiveness',      'green', 'growth', 'substring', 3, 'Worthington REACH model. Process vs. event.', NULL);

  -- =========================================================================
  -- Verification
  -- =========================================================================

  RAISE NOTICE '=========================================================';
  RAISE NOTICE 'Triage Keywords Seed Complete';
  RAISE NOTICE '=========================================================';
  RAISE NOTICE 'RED (crisis/safety):        % rows', (SELECT count(*) FROM mio_triage_keywords WHERE triage_color = 'red');
  RAISE NOTICE 'ORANGE (professional ref):  % rows', (SELECT count(*) FROM mio_triage_keywords WHERE triage_color = 'orange');
  RAISE NOTICE 'YELLOW (monitor+coach):     % rows', (SELECT count(*) FROM mio_triage_keywords WHERE triage_color = 'yellow');
  RAISE NOTICE 'GREEN (full coaching):      % rows', (SELECT count(*) FROM mio_triage_keywords WHERE triage_color = 'green');
  RAISE NOTICE 'TOTAL:                      % rows', (SELECT count(*) FROM mio_triage_keywords);
  RAISE NOTICE '=========================================================';

END $guard$;
