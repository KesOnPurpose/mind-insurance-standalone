// ============================================================================
// RELATIONAL SAFETY KEYWORDS & TRIAGE DATABASE
// 4-color clinical triage system for MIO relational coaching
// RED = Crisis/Safety | ORANGE = Professional Referral | YELLOW = Monitor+Coach | GREEN = Full Coaching
// ============================================================================

export interface TriageKeyword {
  keyword: string;
  triage_color: 'red' | 'orange' | 'yellow' | 'green';
  category: string;
  match_type: 'exact' | 'substring' | 'regex';
  priority: number; // 1-10, higher = more urgent
  response_guidance: string;
  referral_type?: string;
}

// ============================================================================
// RED KEYWORDS - Immediate Safety/Crisis
// Action: Crisis resources IMMEDIATELY. No coaching.
// ============================================================================

const RED_KEYWORDS: TriageKeyword[] = [
  // Violence & Physical Safety
  { keyword: 'hitting me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline (1-800-799-7233) immediately. Safety planning priority.', referral_type: 'domestic_violence' },
  { keyword: 'hit me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'hits me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'he hits', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'she hits', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'beats me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'punched', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'slapped', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'kicked me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'threw me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'grabbed me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 9, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'pushed me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 9, response_guidance: 'Provide National DV Hotline immediately.', referral_type: 'domestic_violence' },
  { keyword: 'choking me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Strangulation = highest lethality risk. Call 911 or DV hotline.', referral_type: 'crisis_hotline' },
  { keyword: 'choked me', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Strangulation = highest lethality risk. Call 911 or DV hotline.', referral_type: 'crisis_hotline' },
  { keyword: 'strangling', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Strangulation = highest lethality risk. Call 911 or DV hotline.', referral_type: 'crisis_hotline' },
  { keyword: 'threatened to kill', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Death threat = immediate danger. Call 911.', referral_type: 'crisis_hotline' },
  { keyword: 'going to kill', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Death threat = immediate danger. Call 911.', referral_type: 'crisis_hotline' },
  { keyword: 'afraid for my life', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Immediate safety planning required. DV hotline + 911.', referral_type: 'crisis_hotline' },
  { keyword: 'scared for my life', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Immediate safety planning required. DV hotline + 911.', referral_type: 'crisis_hotline' },
  { keyword: 'fear for my life', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Immediate safety planning required. DV hotline + 911.', referral_type: 'crisis_hotline' },
  { keyword: 'fear for my safety', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Immediate safety planning required. DV hotline + 911.', referral_type: 'crisis_hotline' },
  { keyword: 'weapon', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 10, response_guidance: 'Weapon involvement = extreme danger. Call 911.', referral_type: 'crisis_hotline' },
  { keyword: 'gun', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 9, response_guidance: 'Firearm access = 5x lethality risk. Immediate safety plan.', referral_type: 'crisis_hotline' },
  { keyword: 'knife', triage_color: 'red', category: 'violence', match_type: 'substring', priority: 9, response_guidance: 'Weapon involvement = extreme danger. Call 911.', referral_type: 'crisis_hotline' },

  // Self-Harm & Suicidality
  { keyword: 'want to die', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 10, response_guidance: '988 Suicide & Crisis Lifeline immediately.', referral_type: 'crisis_hotline' },
  { keyword: 'kill myself', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 10, response_guidance: '988 Suicide & Crisis Lifeline immediately.', referral_type: 'crisis_hotline' },
  { keyword: 'suicidal', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 10, response_guidance: '988 Suicide & Crisis Lifeline immediately.', referral_type: 'crisis_hotline' },
  { keyword: 'self harm', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 10, response_guidance: '988 Suicide & Crisis Lifeline. Do not coach.', referral_type: 'crisis_hotline' },
  { keyword: 'self-harm', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 10, response_guidance: '988 Suicide & Crisis Lifeline. Do not coach.', referral_type: 'crisis_hotline' },
  { keyword: 'cutting myself', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 10, response_guidance: '988 Suicide & Crisis Lifeline. Immediate referral.', referral_type: 'crisis_hotline' },
  { keyword: 'end it all', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 9, response_guidance: 'Assess for suicidal ideation. Provide 988.', referral_type: 'crisis_hotline' },
  { keyword: 'end my life', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 10, response_guidance: 'Assess for suicidal ideation. Provide 988.', referral_type: 'crisis_hotline' },
  { keyword: 'no reason to live', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 9, response_guidance: 'Hopelessness indicator. Provide 988.', referral_type: 'crisis_hotline' },
  { keyword: 'better off without me', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 9, response_guidance: 'Indirect suicidal ideation. Provide 988.', referral_type: 'crisis_hotline' },
  { keyword: 'better off dead', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 10, response_guidance: 'Suicidal ideation. Provide 988.', referral_type: 'crisis_hotline' },
  { keyword: 'don\'t want to be here', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 9, response_guidance: 'Indirect suicidal ideation. Provide 988.', referral_type: 'crisis_hotline' },
  { keyword: 'can\'t go on', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 8, response_guidance: 'Hopelessness indicator. Assess carefully. Provide 988.', referral_type: 'crisis_hotline' },
  { keyword: 'hurting myself', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 10, response_guidance: '988 Suicide & Crisis Lifeline. Do not coach.', referral_type: 'crisis_hotline' },

  // Child Safety
  { keyword: 'hurting the kids', triage_color: 'red', category: 'child_safety', match_type: 'substring', priority: 10, response_guidance: 'Childhelp Hotline (1-800-422-4453). Mandatory reporting applies.', referral_type: 'child_protective' },
  { keyword: 'hurting my child', triage_color: 'red', category: 'child_safety', match_type: 'substring', priority: 10, response_guidance: 'Childhelp Hotline immediately. Mandatory reporting.', referral_type: 'child_protective' },
  { keyword: 'hitting the kids', triage_color: 'red', category: 'child_safety', match_type: 'substring', priority: 10, response_guidance: 'Childhelp Hotline immediately. Mandatory reporting.', referral_type: 'child_protective' },
  { keyword: 'abusing the children', triage_color: 'red', category: 'child_safety', match_type: 'substring', priority: 10, response_guidance: 'Childhelp Hotline immediately. Mandatory reporting.', referral_type: 'child_protective' },
  { keyword: 'abusing my child', triage_color: 'red', category: 'child_safety', match_type: 'substring', priority: 10, response_guidance: 'Childhelp Hotline immediately. Mandatory reporting.', referral_type: 'child_protective' },
  { keyword: 'molesting', triage_color: 'red', category: 'child_safety', match_type: 'substring', priority: 10, response_guidance: 'RAINN (1-800-656-4673) + CPS. Mandatory reporting.', referral_type: 'child_protective' },
  { keyword: 'touching my child', triage_color: 'red', category: 'child_safety', match_type: 'substring', priority: 10, response_guidance: 'RAINN + CPS. Mandatory reporting.', referral_type: 'child_protective' },

  // Sexual Violence
  { keyword: 'raped me', triage_color: 'red', category: 'sexual_violence', match_type: 'substring', priority: 10, response_guidance: 'RAINN (1-800-656-4673) immediately. No coaching.', referral_type: 'sexual_assault' },
  { keyword: 'raped', triage_color: 'red', category: 'sexual_violence', match_type: 'substring', priority: 10, response_guidance: 'RAINN immediately.', referral_type: 'sexual_assault' },
  { keyword: 'sexual assault', triage_color: 'red', category: 'sexual_violence', match_type: 'substring', priority: 10, response_guidance: 'RAINN immediately.', referral_type: 'sexual_assault' },
  { keyword: 'sexually assaulted', triage_color: 'red', category: 'sexual_violence', match_type: 'substring', priority: 10, response_guidance: 'RAINN immediately.', referral_type: 'sexual_assault' },
  { keyword: 'forced me sexually', triage_color: 'red', category: 'sexual_violence', match_type: 'substring', priority: 10, response_guidance: 'RAINN immediately. Marital rape is real and illegal.', referral_type: 'sexual_assault' },
  { keyword: 'forces me to have sex', triage_color: 'red', category: 'sexual_violence', match_type: 'substring', priority: 10, response_guidance: 'RAINN immediately. Marital rape is real and illegal.', referral_type: 'sexual_assault' },
  { keyword: 'forced me to have sex', triage_color: 'red', category: 'sexual_violence', match_type: 'substring', priority: 10, response_guidance: 'RAINN immediately. Marital rape is real and illegal.', referral_type: 'sexual_assault' },

  // Additional Child Safety
  { keyword: 'hurting our child', triage_color: 'red', category: 'child_safety', match_type: 'substring', priority: 10, response_guidance: 'Childhelp Hotline immediately. Mandatory reporting.', referral_type: 'child_protective' },
  { keyword: 'bruises on', triage_color: 'red', category: 'child_safety', match_type: 'substring', priority: 9, response_guidance: 'Physical abuse indicator. Childhelp Hotline + CPS.', referral_type: 'child_protective' },

  // Additional Self-Harm
  { keyword: 'ending it', triage_color: 'red', category: 'self_harm', match_type: 'substring', priority: 9, response_guidance: 'Assess for suicidal ideation. Provide 988.', referral_type: 'crisis_hotline' },
];

// ============================================================================
// ORANGE KEYWORDS - Professional Referral Required
// Action: Provide referral + limited supportive coaching
// ============================================================================

const ORANGE_KEYWORDS: TriageKeyword[] = [
  // Addiction & Substance
  { keyword: 'addiction', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 8, response_guidance: 'SAMHSA (1-800-662-4357). Recommend individual + couples therapy.', referral_type: 'addiction_counselor' },
  { keyword: 'addicted', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 8, response_guidance: 'SAMHSA helpline. Professional assessment needed.', referral_type: 'addiction_counselor' },
  { keyword: 'drinking problem', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 8, response_guidance: 'SAMHSA helpline. Al-Anon for partner support.', referral_type: 'addiction_counselor' },
  { keyword: 'can\'t stop drinking', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 8, response_guidance: 'SAMHSA helpline. Al-Anon for partner support.', referral_type: 'addiction_counselor' },
  { keyword: 'drunk every', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 8, response_guidance: 'SAMHSA helpline. Alcohol dependence assessment.', referral_type: 'addiction_counselor' },
  { keyword: 'alcoholic', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 8, response_guidance: 'SAMHSA helpline. Al-Anon for partner support.', referral_type: 'addiction_counselor' },
  { keyword: 'drug use', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 8, response_guidance: 'SAMHSA helpline. Recovery support groups.', referral_type: 'addiction_counselor' },
  { keyword: 'using drugs', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 8, response_guidance: 'SAMHSA helpline. Recovery support groups.', referral_type: 'addiction_counselor' },
  { keyword: 'relapsed', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 7, response_guidance: 'Reconnect with sponsor/treatment. SAMHSA for resources.', referral_type: 'addiction_counselor' },
  { keyword: 'relapse', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 7, response_guidance: 'Reconnect with sponsor/treatment. SAMHSA for resources.', referral_type: 'addiction_counselor' },
  { keyword: 'porn addiction', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 7, response_guidance: 'CSAT (Certified Sex Addiction Therapist) referral.', referral_type: 'therapist' },
  { keyword: 'watching porn', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 6, response_guidance: 'CSAT referral if compulsive. Assess impact on relationship.', referral_type: 'therapist' },

  // Mental Health
  { keyword: 'flashbacks', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 8, response_guidance: 'PTSD/trauma specialist referral. EMDR may help.', referral_type: 'therapist' },
  { keyword: 'personality disorder', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 7, response_guidance: 'DBT specialist referral. Individual therapy first.', referral_type: 'psychiatrist' },
  { keyword: 'bipolar', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 7, response_guidance: 'Psychiatrist for medication management + therapy.', referral_type: 'psychiatrist' },
  { keyword: 'psychotic', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 9, response_guidance: 'Emergency psychiatric evaluation needed.', referral_type: 'psychiatrist' },
  { keyword: 'hallucinating', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 9, response_guidance: 'Emergency psychiatric evaluation needed.', referral_type: 'psychiatrist' },
  { keyword: 'hearing voices', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 9, response_guidance: 'Emergency psychiatric evaluation needed.', referral_type: 'psychiatrist' },
  { keyword: 'dissociating', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 8, response_guidance: 'Trauma specialist referral. Grounding techniques in interim.', referral_type: 'therapist' },
  { keyword: 'dissociat', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 8, response_guidance: 'Trauma specialist referral. Grounding techniques in interim.', referral_type: 'therapist' },
  { keyword: 'eating disorder', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 8, response_guidance: 'NEDA Hotline (1-800-931-2237). ED specialist referral.', referral_type: 'therapist' },
  { keyword: 'anorexia', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 8, response_guidance: 'NEDA Hotline (1-800-931-2237). ED specialist referral.', referral_type: 'therapist' },
  { keyword: 'bulimi', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 8, response_guidance: 'NEDA Hotline (1-800-931-2237). ED specialist referral.', referral_type: 'therapist' },
  { keyword: 'purging', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 8, response_guidance: 'NEDA Hotline (1-800-931-2237). ED specialist referral.', referral_type: 'therapist' },
  { keyword: 'binge eating', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 7, response_guidance: 'NEDA Hotline (1-800-931-2237). ED specialist referral.', referral_type: 'therapist' },
  { keyword: 'not eating', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 7, response_guidance: 'Assess for eating disorder. NEDA referral.', referral_type: 'therapist' },

  // Abuse Patterns (not immediate crisis but needs professional)
  { keyword: 'controlling behavior', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Assess for coercive control. DV advocate referral.', referral_type: 'domestic_violence' },
  { keyword: 'controls me', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Assess for coercive control. DV advocate referral.', referral_type: 'domestic_violence' },
  { keyword: 'controls everything', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Coercive control indicator. DV advocate.', referral_type: 'domestic_violence' },
  { keyword: 'isolating me', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Isolation = coercive control indicator. DV advocate.', referral_type: 'domestic_violence' },
  { keyword: 'won\'t let me see', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Isolation pattern. DV advocate referral.', referral_type: 'domestic_violence' },
  { keyword: 'monitoring my phone', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Surveillance = coercive control. DV hotline.', referral_type: 'domestic_violence' },
  { keyword: 'tracking my', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Surveillance = coercive control. DV hotline.', referral_type: 'domestic_violence' },
  { keyword: 'checking my phone', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 6, response_guidance: 'Surveillance behavior. Assess for coercive control.', referral_type: 'domestic_violence' },
  { keyword: 'narcissist', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 6, response_guidance: 'Individual therapy first. Couples therapy NOT recommended with NPD.', referral_type: 'therapist' },
  { keyword: 'narcissistic', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 6, response_guidance: 'Individual therapy first. Couples therapy NOT recommended with NPD.', referral_type: 'therapist' },
  { keyword: 'gaslighting', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Gaslighting = psychological abuse. Individual therapy referral.', referral_type: 'therapist' },
  { keyword: 'gaslight', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Gaslighting = psychological abuse. Individual therapy referral.', referral_type: 'therapist' },
  { keyword: 'making me feel crazy', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Possible gaslighting. Individual therapy referral.', referral_type: 'therapist' },
  { keyword: 'emotional abuse', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Individual therapy. Assess safety before couples work.', referral_type: 'therapist' },
  { keyword: 'emotionally abusive', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Individual therapy. Assess safety before couples work.', referral_type: 'therapist' },
  { keyword: 'verbally abusive', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Verbal abuse pattern. Individual therapy referral.', referral_type: 'therapist' },
  { keyword: 'coercive control', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 8, response_guidance: 'Coercive control = abuse pattern. DV advocate referral.', referral_type: 'domestic_violence' },
  { keyword: 'is abusive', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Abuse disclosure. Individual therapy + safety planning.', referral_type: 'domestic_violence' },
  { keyword: 'he\'s cruel', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Possible emotional abuse. Individual therapy referral.', referral_type: 'therapist' },
  { keyword: 'she\'s cruel', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Possible emotional abuse. Individual therapy referral.', referral_type: 'therapist' },

  // Infidelity (Active)
  { keyword: 'having an affair', triage_color: 'orange', category: 'infidelity', match_type: 'substring', priority: 6, response_guidance: 'Infidelity specialist/EFT therapist referral.', referral_type: 'therapist' },
  { keyword: 'cheating on me', triage_color: 'orange', category: 'infidelity', match_type: 'substring', priority: 6, response_guidance: 'Betrayal trauma support. Individual therapy first.', referral_type: 'therapist' },
  { keyword: 'cheated on me', triage_color: 'orange', category: 'infidelity', match_type: 'substring', priority: 6, response_guidance: 'Betrayal trauma support. Individual therapy first.', referral_type: 'therapist' },
  { keyword: 'discovered affair', triage_color: 'orange', category: 'infidelity', match_type: 'substring', priority: 7, response_guidance: 'Acute betrayal trauma. Individual support before couples.', referral_type: 'therapist' },
  { keyword: 'found out about the affair', triage_color: 'orange', category: 'infidelity', match_type: 'substring', priority: 7, response_guidance: 'Acute betrayal trauma. Individual support before couples.', referral_type: 'therapist' },
  { keyword: 'sleeping with someone', triage_color: 'orange', category: 'infidelity', match_type: 'substring', priority: 6, response_guidance: 'Active infidelity. Infidelity specialist referral.', referral_type: 'therapist' },
  { keyword: 'about his affair', triage_color: 'orange', category: 'infidelity', match_type: 'substring', priority: 7, response_guidance: 'Acute betrayal trauma. Individual support before couples.', referral_type: 'therapist' },
  { keyword: 'about her affair', triage_color: 'orange', category: 'infidelity', match_type: 'substring', priority: 7, response_guidance: 'Acute betrayal trauma. Individual support before couples.', referral_type: 'therapist' },

  // Additional Mental Health
  { keyword: 'get out of bed', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 7, response_guidance: 'Depression indicator. Professional assessment needed.', referral_type: 'therapist' },
  { keyword: 'can\'t function', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 7, response_guidance: 'Functional impairment. Professional assessment needed.', referral_type: 'therapist' },
  { keyword: 'panic attack', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 7, response_guidance: 'Panic disorder assessment. Therapist + possible psychiatrist.', referral_type: 'therapist' },
  { keyword: 'anxiety', triage_color: 'orange', category: 'mental_health', match_type: 'substring', priority: 6, response_guidance: 'Clinical anxiety assessment. Therapist referral.', referral_type: 'therapist' },

  // Additional Substance
  { keyword: 'need pills', triage_color: 'orange', category: 'substance', match_type: 'substring', priority: 7, response_guidance: 'Substance dependence indicator. SAMHSA referral.', referral_type: 'addiction_counselor' },

  // Additional Abuse Patterns
  { keyword: 'abusive relationship', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Abuse identified. DV advocate + individual therapy.', referral_type: 'domestic_violence' },
  { keyword: 'in an abusive', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Abuse identified. DV advocate + individual therapy.', referral_type: 'domestic_violence' },
  { keyword: 'breaks things', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Property destruction = intimidation/abuse. DV advocate.', referral_type: 'domestic_violence' },
  { keyword: 'name-calling', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 6, response_guidance: 'Verbal abuse pattern. Individual therapy referral.', referral_type: 'therapist' },
  { keyword: 'name calling', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 6, response_guidance: 'Verbal abuse pattern. Individual therapy referral.', referral_type: 'therapist' },
  { keyword: 'calls me names', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 6, response_guidance: 'Verbal abuse pattern. Individual therapy referral.', referral_type: 'therapist' },
  { keyword: 'cruel to me', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Cruelty = emotional abuse indicator. Individual therapy.', referral_type: 'therapist' },
  { keyword: 'cruel to her', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Cruelty = emotional abuse indicator. Individual therapy.', referral_type: 'therapist' },
  { keyword: 'cruel to him', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Cruelty = emotional abuse indicator. Individual therapy.', referral_type: 'therapist' },
  { keyword: 'threatening to take the kids', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 8, response_guidance: 'Custody threats = coercive control. DV advocate + family attorney.', referral_type: 'domestic_violence' },
  { keyword: 'threatening to take my kids', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 8, response_guidance: 'Custody threats = coercive control. DV advocate + family attorney.', referral_type: 'domestic_violence' },
  { keyword: 'controls all the money', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Financial abuse = coercive control. DV advocate.', referral_type: 'domestic_violence' },
  { keyword: 'controls the money', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Financial abuse = coercive control. DV advocate.', referral_type: 'domestic_violence' },
  { keyword: 'won\'t let me work', triage_color: 'orange', category: 'abuse_pattern', match_type: 'substring', priority: 7, response_guidance: 'Economic abuse = coercive control. DV advocate.', referral_type: 'domestic_violence' },
];

// ============================================================================
// YELLOW KEYWORDS - Monitor + Coach
// Action: MIO coaching with monitoring and soft referral
// ============================================================================

const YELLOW_KEYWORDS: TriageKeyword[] = [
  // Relationship Distress
  { keyword: 'always fighting', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Conflict escalation pattern. Gottman repair interventions.' },
  { keyword: 'growing apart', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Emotional distance. Love maps and turning toward.' },
  { keyword: 'don\'t trust', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 6, response_guidance: 'Trust erosion. Assess root cause before intervention.' },
  { keyword: 'resentment', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Built-up resentment. Processing + repair rituals.' },
  { keyword: 'contempt', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 6, response_guidance: 'Contempt = strongest divorce predictor. Culture of appreciation.' },
  { keyword: 'stonewalling', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Physiological flooding. Self-soothing + structured breaks.' },
  { keyword: 'silent treatment', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Withdrawal pattern. Distinguish from flooding vs. punishment.' },
  { keyword: 'feel alone in marriage', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Emotional isolation. Attachment needs assessment.' },
  { keyword: 'lost spark', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 4, response_guidance: 'Passion vs. companionate love. Intentional connection.' },
  { keyword: 'considering divorce', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 6, response_guidance: 'Discernment counseling recommended. Not couples therapy yet.' },
  { keyword: 'want a divorce', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 6, response_guidance: 'Discernment counseling recommended. Assess readiness.' },
  { keyword: 'thinking about leaving', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 6, response_guidance: 'Ambivalence assessment. Discernment process.' },
  { keyword: 'thinking about divorce', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 6, response_guidance: 'Ambivalence assessment. Discernment process.' },
  { keyword: 'want to leave', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 6, response_guidance: 'Ambivalence assessment. Discernment process.' },
  { keyword: 'falling out of love', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Love is a verb framework. Intentional rituals.' },
  { keyword: 'don\'t love', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Love is a verb framework. Intentional rituals.' },
  { keyword: 'not in love', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Love is a verb framework. Intentional rituals.' },
  { keyword: 'four horsemen', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Gottman Four Horsemen intervention. Antidotes for each.' },
  { keyword: 'we never talk', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Communication shutdown. Structured conversation rituals.' },
  { keyword: 'like roommates', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Emotional disconnection. Intentional connection rituals.' },
  { keyword: 'separated', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Separation phase. Discernment counseling or structured separation agreement.' },

  // Parenting Stress
  { keyword: 'fighting about kids', triage_color: 'yellow', category: 'parenting', match_type: 'substring', priority: 5, response_guidance: 'Co-parenting alignment. Unified front strategies.' },
  { keyword: 'fighting about the kids', triage_color: 'yellow', category: 'parenting', match_type: 'substring', priority: 5, response_guidance: 'Co-parenting alignment. Unified front strategies.' },
  { keyword: 'parenting conflict', triage_color: 'yellow', category: 'parenting', match_type: 'substring', priority: 5, response_guidance: 'Different parenting styles. Values alignment work.' },
  { keyword: 'disagree about parenting', triage_color: 'yellow', category: 'parenting', match_type: 'substring', priority: 5, response_guidance: 'Different parenting styles. Values alignment work.' },
  { keyword: 'step-parent', triage_color: 'yellow', category: 'parenting', match_type: 'substring', priority: 5, response_guidance: 'Blended family dynamics. Role clarity and boundaries.' },
  { keyword: 'stepparent', triage_color: 'yellow', category: 'parenting', match_type: 'substring', priority: 5, response_guidance: 'Blended family dynamics. Role clarity and boundaries.' },
  { keyword: 'blended family', triage_color: 'yellow', category: 'parenting', match_type: 'substring', priority: 5, response_guidance: 'Blended family dynamics. Role clarity and boundaries.' },

  // Financial Stress
  { keyword: 'money fights', triage_color: 'yellow', category: 'financial', match_type: 'substring', priority: 5, response_guidance: 'Financial communication. Values-based budgeting.' },
  { keyword: 'financial stress', triage_color: 'yellow', category: 'financial', match_type: 'substring', priority: 5, response_guidance: 'Financial stress protocol. Team vs. adversaries.' },
  { keyword: 'hiding money', triage_color: 'yellow', category: 'financial', match_type: 'substring', priority: 6, response_guidance: 'Financial infidelity pattern. Trust rebuilding.' },
  { keyword: 'secret spending', triage_color: 'yellow', category: 'financial', match_type: 'substring', priority: 6, response_guidance: 'Financial betrayal. Transparency protocol.' },

  // Intimacy Issues
  { keyword: 'sexless marriage', triage_color: 'yellow', category: 'intimacy', match_type: 'substring', priority: 5, response_guidance: 'Desire discrepancy. Rule out medical + relational causes.' },
  { keyword: 'no intimacy', triage_color: 'yellow', category: 'intimacy', match_type: 'substring', priority: 5, response_guidance: 'Emotional + physical intimacy assessment.' },
  { keyword: 'different sex drives', triage_color: 'yellow', category: 'intimacy', match_type: 'substring', priority: 4, response_guidance: 'Desire discrepancy normalization + scheduling.' },

  // In-Law/Family
  { keyword: 'in-law problems', triage_color: 'yellow', category: 'family', match_type: 'substring', priority: 4, response_guidance: 'Boundary setting. Leaving and cleaving.' },
  { keyword: 'his mother', triage_color: 'yellow', category: 'family', match_type: 'substring', priority: 4, response_guidance: 'Mother-in-law boundaries. Partner unity.' },
  { keyword: 'her mother', triage_color: 'yellow', category: 'family', match_type: 'substring', priority: 4, response_guidance: 'Mother-in-law boundaries. Partner unity.' },

  // Additional Relationship Distress
  { keyword: 'fighting every day', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Daily conflict escalation. De-escalation + repair rituals.' },
  { keyword: 'fight all the time', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Chronic conflict pattern. Gottman repair interventions.' },
  { keyword: 'argue all the time', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Chronic conflict pattern. Gottman repair interventions.' },
  { keyword: 'separating', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 6, response_guidance: 'Separation consideration. Discernment counseling.' },
  { keyword: 'alone and disconnected', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Emotional isolation. Attachment needs assessment.' },
  { keyword: 'want to scream', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Emotional overwhelm. Stress management + repair.' },

  // Additional Infidelity (Discovery)
  { keyword: 'sexual messages', triage_color: 'yellow', category: 'infidelity', match_type: 'substring', priority: 6, response_guidance: 'Emotional/digital infidelity discovery. Trust assessment.' },
  { keyword: 'texting another', triage_color: 'yellow', category: 'infidelity', match_type: 'substring', priority: 5, response_guidance: 'Possible emotional affair. Trust + boundary assessment.' },

  // Additional Financial
  { keyword: 'hiding debt', triage_color: 'yellow', category: 'financial', match_type: 'substring', priority: 6, response_guidance: 'Financial infidelity. Trust rebuilding + transparency.' },

  // Additional Parenting
  { keyword: 'how to discipline', triage_color: 'yellow', category: 'parenting', match_type: 'substring', priority: 5, response_guidance: 'Discipline disagreement. Unified parenting approach.' },
  { keyword: 'discipline our kids', triage_color: 'yellow', category: 'parenting', match_type: 'substring', priority: 5, response_guidance: 'Discipline alignment. Co-parenting strategies.' },

  // Additional Intimacy
  { keyword: 'haven\'t been intimate', triage_color: 'yellow', category: 'intimacy', match_type: 'substring', priority: 5, response_guidance: 'Intimacy gap. Rule out medical + relational causes.' },
  { keyword: 'not been intimate', triage_color: 'yellow', category: 'intimacy', match_type: 'substring', priority: 5, response_guidance: 'Intimacy gap. Rule out medical + relational causes.' },

  // Military/Deployment
  { keyword: 'deployed', triage_color: 'yellow', category: 'relationship_distress', match_type: 'substring', priority: 5, response_guidance: 'Military deployment stress. Structured connection rituals.' },
];

// ============================================================================
// GREEN KEYWORDS - Full Coaching
// Action: Full MIO relational coaching engagement
// ============================================================================

const GREEN_KEYWORDS: TriageKeyword[] = [
  { keyword: 'better communication', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 3, response_guidance: 'Active listening, I-statements, structured conversations.' },
  { keyword: 'date night', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 2, response_guidance: 'Intentional connection rituals. Quality over quantity.' },
  { keyword: 'appreciation', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 2, response_guidance: 'Culture of appreciation. 5:1 positive ratio.' },
  { keyword: 'grow together', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 2, response_guidance: 'Shared meaning-making. Relationship vision.' },
  { keyword: 'love languages', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 2, response_guidance: 'Chapman framework. Giving in partner\'s language.' },
  { keyword: 'how to be a better husband', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 3, response_guidance: 'Emotional availability, initiative, presence.' },
  { keyword: 'how to be a better wife', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 3, response_guidance: 'Mutual respect, emotional connection, appreciation.' },
  { keyword: 'strengthen marriage', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 2, response_guidance: 'Proactive relationship maintenance. Gottman Sound Relationship House.' },
  { keyword: 'premarital', triage_color: 'green', category: 'formation', match_type: 'substring', priority: 3, response_guidance: 'PREPARE/ENRICH framework. Premarital education.' },
  { keyword: 'engaged', triage_color: 'green', category: 'formation', match_type: 'substring', priority: 2, response_guidance: 'Premarital assessment. Key conversation areas.' },
  { keyword: 'newlywed', triage_color: 'green', category: 'formation', match_type: 'substring', priority: 2, response_guidance: 'First-year adjustment. Expectations vs. reality.' },
  { keyword: 'conflict resolution', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 3, response_guidance: 'Gottman dreams within conflict. Softened startup.' },
  { keyword: 'emotional connection', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 3, response_guidance: 'EFT hold me tight conversations. Turning toward.' },
  { keyword: 'rebuild trust', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 4, response_guidance: 'Trust rebuilding protocol. Transparency + consistency.' },
  { keyword: 'forgiveness', triage_color: 'green', category: 'growth', match_type: 'substring', priority: 3, response_guidance: 'Worthington REACH model. Process vs. event.' },
];

// ============================================================================
// CRISIS RESOURCES
// ============================================================================

export const CRISIS_RESOURCES = {
  suicide_crisis: {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    text: 'Text HOME to 741741',
    url: 'https://988lifeline.org',
  },
  domestic_violence: {
    name: 'National Domestic Violence Hotline',
    phone: '1-800-799-7233',
    text: 'Text START to 88788',
    url: 'https://www.thehotline.org',
  },
  sexual_assault: {
    name: 'RAINN National Sexual Assault Hotline',
    phone: '1-800-656-4673',
    url: 'https://www.rainn.org',
  },
  child_abuse: {
    name: 'Childhelp National Child Abuse Hotline',
    phone: '1-800-422-4453',
    url: 'https://www.childhelp.org',
  },
  substance_abuse: {
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    url: 'https://www.samhsa.gov/find-help/national-helpline',
  },
  eating_disorders: {
    name: 'NEDA Helpline',
    phone: '1-800-931-2237',
    url: 'https://www.nationaleatingdisorders.org',
  },
  crisis_text: {
    name: 'Crisis Text Line',
    text: 'Text HOME to 741741',
    url: 'https://www.crisistextline.org',
  },
} as const;

// ============================================================================
// EXPORTED COMBINED DATABASE
// ============================================================================

export const ALL_TRIAGE_KEYWORDS: TriageKeyword[] = [
  ...RED_KEYWORDS,
  ...ORANGE_KEYWORDS,
  ...YELLOW_KEYWORDS,
  ...GREEN_KEYWORDS,
];

// ============================================================================
// TRIAGE SCANNING FUNCTION
// Scans user message text and returns highest severity triage result
// ============================================================================

export interface TriageResult {
  triage_color: 'red' | 'orange' | 'yellow' | 'green';
  matched_keywords: TriageKeyword[];
  highest_priority: number;
  crisis_resources: typeof CRISIS_RESOURCES[keyof typeof CRISIS_RESOURCES][];
  response_guidance: string;
  should_block_coaching: boolean;
}

export function scanForTriageKeywords(message: string): TriageResult {
  const normalizedMessage = message.toLowerCase().trim();
  const matched: TriageKeyword[] = [];

  for (const kw of ALL_TRIAGE_KEYWORDS) {
    if (kw.match_type === 'exact') {
      if (normalizedMessage === kw.keyword.toLowerCase()) {
        matched.push(kw);
      }
    } else if (kw.match_type === 'substring') {
      if (normalizedMessage.includes(kw.keyword.toLowerCase())) {
        matched.push(kw);
      }
    } else if (kw.match_type === 'regex') {
      try {
        const regex = new RegExp(kw.keyword, 'i');
        if (regex.test(normalizedMessage)) {
          matched.push(kw);
        }
      } catch {
        // Invalid regex, skip
      }
    }
  }

  if (matched.length === 0) {
    return {
      triage_color: 'green',
      matched_keywords: [],
      highest_priority: 0,
      crisis_resources: [],
      response_guidance: 'Full MIO relational coaching engagement.',
      should_block_coaching: false,
    };
  }

  // Determine highest severity color
  const colorPriority: Record<string, number> = { red: 4, orange: 3, yellow: 2, green: 1 };
  const sortedMatches = [...matched].sort((a, b) => {
    const colorDiff = (colorPriority[b.triage_color] || 0) - (colorPriority[a.triage_color] || 0);
    if (colorDiff !== 0) return colorDiff;
    return b.priority - a.priority;
  });

  const highestColor = sortedMatches[0].triage_color;
  const highestPriority = sortedMatches[0].priority;

  // Collect relevant crisis resources
  const resources: typeof CRISIS_RESOURCES[keyof typeof CRISIS_RESOURCES][] = [];
  const addedResources = new Set<string>();

  for (const match of sortedMatches) {
    if (match.referral_type && !addedResources.has(match.referral_type)) {
      addedResources.add(match.referral_type);
      switch (match.referral_type) {
        case 'crisis_hotline':
          resources.push(CRISIS_RESOURCES.suicide_crisis);
          break;
        case 'domestic_violence':
          resources.push(CRISIS_RESOURCES.domestic_violence);
          break;
        case 'sexual_assault':
          resources.push(CRISIS_RESOURCES.sexual_assault);
          break;
        case 'child_protective':
          resources.push(CRISIS_RESOURCES.child_abuse);
          break;
        case 'addiction_counselor':
          resources.push(CRISIS_RESOURCES.substance_abuse);
          break;
        case 'therapist':
        case 'psychiatrist':
          // No specific hotline, but can add crisis text
          if (!addedResources.has('crisis_text')) {
            addedResources.add('crisis_text');
            resources.push(CRISIS_RESOURCES.crisis_text);
          }
          break;
      }
    }
  }

  return {
    triage_color: highestColor,
    matched_keywords: sortedMatches,
    highest_priority: highestPriority,
    crisis_resources: resources,
    response_guidance: sortedMatches[0].response_guidance,
    should_block_coaching: highestColor === 'red',
  };
}
