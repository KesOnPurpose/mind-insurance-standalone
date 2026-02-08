-- =============================================================================
-- Migration: Connection Prompts Expansion
-- Adds audience/kid_age_range/sub_category columns + seeds 200+ prompts
-- =============================================================================

-- 1A. Add new columns
ALTER TABLE relationship_connection_prompts
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'partner';

ALTER TABLE relationship_connection_prompts
  ADD COLUMN IF NOT EXISTS kid_age_range TEXT;

ALTER TABLE relationship_connection_prompts
  ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- 1B. Check constraints
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_prompt_audience'
  ) THEN
    ALTER TABLE relationship_connection_prompts
      ADD CONSTRAINT chk_prompt_audience CHECK (audience IN ('partner', 'child'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_prompt_kid_age_range'
  ) THEN
    ALTER TABLE relationship_connection_prompts
      ADD CONSTRAINT chk_prompt_kid_age_range CHECK (
        kid_age_range IS NULL OR kid_age_range IN ('toddler_0_4', 'child_5_9', 'tween_10_13', 'teen_14_18')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_prompt_sub_category'
  ) THEN
    ALTER TABLE relationship_connection_prompts
      ADD CONSTRAINT chk_prompt_sub_category CHECK (
        sub_category IS NULL OR sub_category IN (
          'romance', 'sex_intimacy', 'growth', 'play', 'faith', 'finance', 'dreams',
          'bonding', 'mentoring', 'fun', 'emotional', 'values'
        )
      );
  END IF;
END $$;

-- 1C. Index for fast filtered queries
CREATE INDEX IF NOT EXISTS idx_prompts_audience_category
  ON relationship_connection_prompts (audience, prompt_category, intimacy_level)
  WHERE is_active = true;

-- =============================================================================
-- SEED: Partner Prompts - Sexual Fulfillment (40+)
-- =============================================================================

INSERT INTO relationship_connection_prompts (prompt_text, prompt_category, intimacy_level, focus_kpi, audience, sub_category, is_active)
VALUES
-- Light (sexual_fulfillment)
('What''s a small touch or gesture from me that makes you feel wanted?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('When during the day do you feel most open to physical closeness?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('Is there a song or scene from a movie that captures how you want us to feel together?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What''s one thing I do that makes you feel attractive?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('How do you like to be greeted when I come home?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What does "feeling desired" look like for you in everyday life?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('If we had a whole evening free with no responsibilities, what would your ideal night look like?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What kind of compliment about your body or appearance means the most to you?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('Do you prefer spontaneous affection or planned romantic moments?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What''s a way I could flirt with you more throughout the day?', 'physical', 'light', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),

-- Medium (sexual_fulfillment)
('What does intimacy mean to you beyond the physical?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('Is there something we used to do early in our relationship that you miss?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('How do you feel about our current rhythm of physical intimacy?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What helps you transition from the stress of the day into a more connected headspace?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('If you could describe your ideal intimate experience in three words, what would they be?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What makes you feel safe enough to be fully present during intimate moments?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('Is there a way I could initiate that would make you feel more comfortable?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What role does anticipation play in your experience of intimacy?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('How do you feel about exploring something new together?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What environment or setting helps you feel most relaxed and open?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('Do you feel like we talk enough about what we both enjoy physically?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What does aftercare and post-intimacy connection look like for you?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('How important is non-sexual touch leading up to intimate moments?', 'physical', 'medium', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),

-- Deep (sexual_fulfillment)
('What fears or insecurities come up for you around physical intimacy?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('Is there something you''ve wanted to ask me about our intimate life but haven''t?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('How has your understanding of your own sexuality evolved over our relationship?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What would help you feel more emotionally connected during physical intimacy?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('Are there past experiences that affect how you show up in our intimate life?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What does sexual fulfillment truly mean to you at this stage of life?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('How do you want us to grow together in this area over the next year?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What would it look like if we both felt completely free and uninhibited together?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('Is there a disconnect between what you want and what you feel comfortable asking for?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('How can we create a space where neither of us feels pressure but both feel desired?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What does vulnerability during intimacy feel like for you?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('If we could rewrite the "rules" of our intimate life from scratch, what would you keep and what would you change?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('How do stress, health, and energy levels affect your desire, and how can I support you through that?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('What does it mean to you to feel truly known by me physically?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),
('How do faith or personal values shape your view of intimacy in our relationship?', 'physical', 'deep', 'sexual_fulfillment', 'partner', 'sex_intimacy', true),

-- =============================================================================
-- SEED: Partner Prompts - Affection (15+)
-- =============================================================================
('What''s your favorite way to receive affection in public vs. at home?', 'emotional', 'light', 'affection', 'partner', 'romance', true),
('When was the last time you felt truly cherished by me?', 'emotional', 'light', 'affection', 'partner', 'romance', true),
('Do you prefer words of affirmation, physical touch, or small acts of service?', 'emotional', 'light', 'affection', 'partner', 'romance', true),
('What''s a random act of love I could do this week that would surprise you?', 'emotional', 'light', 'affection', 'partner', 'romance', true),
('How do you feel about handwritten notes or surprise messages?', 'emotional', 'light', 'affection', 'partner', 'romance', true),
('What''s the most romantic thing someone has ever done for you?', 'emotional', 'medium', 'affection', 'partner', 'romance', true),
('How has the way you give and receive love changed since we''ve been together?', 'emotional', 'medium', 'affection', 'partner', 'romance', true),
('Is there a way I show love that you wish I did more often?', 'emotional', 'medium', 'affection', 'partner', 'romance', true),
('What does "being present" look like to you when we''re together?', 'emotional', 'medium', 'affection', 'partner', 'romance', true),
('Do you ever feel like you give more affection than you receive?', 'emotional', 'medium', 'affection', 'partner', 'romance', true),
('What childhood experience shaped how you express love today?', 'emotional', 'deep', 'affection', 'partner', 'romance', true),
('Is there a type of affection you crave but feel awkward asking for?', 'emotional', 'deep', 'affection', 'partner', 'romance', true),
('How do you want to feel when I hold you?', 'emotional', 'deep', 'affection', 'partner', 'romance', true),
('What would our relationship look like if we both maxed out on showing love?', 'emotional', 'deep', 'affection', 'partner', 'romance', true),
('When you''re going through a hard time, what kind of affection helps you most?', 'emotional', 'deep', 'affection', 'partner', 'romance', true),

-- =============================================================================
-- SEED: Partner Prompts - Intimate Conversation (15+)
-- =============================================================================
('What''s something you thought about today that you haven''t told anyone?', 'emotional', 'light', 'intimate_conversation', 'partner', 'growth', true),
('If you could have a 30-minute conversation with your 18-year-old self, what would you say?', 'emotional', 'light', 'intimate_conversation', 'partner', 'growth', true),
('What''s a question no one ever asks you that you wish they would?', 'emotional', 'light', 'intimate_conversation', 'partner', 'growth', true),
('What topic could you talk about for hours without getting bored?', 'emotional', 'light', 'intimate_conversation', 'partner', 'growth', true),
('What was the highlight of your week and why?', 'emotional', 'light', 'intimate_conversation', 'partner', 'growth', true),
('What''s a belief you held strongly 5 years ago that you''ve since changed your mind on?', 'emotional', 'medium', 'intimate_conversation', 'partner', 'growth', true),
('What do you think is the biggest misconception people have about you?', 'emotional', 'medium', 'intimate_conversation', 'partner', 'growth', true),
('What''s a conversation we had early on that you still think about?', 'emotional', 'medium', 'intimate_conversation', 'partner', 'growth', true),
('What do you wish we talked about more?', 'emotional', 'medium', 'intimate_conversation', 'partner', 'growth', true),
('How do you feel when I share something vulnerable with you?', 'emotional', 'medium', 'intimate_conversation', 'partner', 'growth', true),
('What''s a truth about yourself that took you a long time to accept?', 'emotional', 'deep', 'intimate_conversation', 'partner', 'growth', true),
('Is there something you''re afraid to tell me because of how I might react?', 'emotional', 'deep', 'intimate_conversation', 'partner', 'growth', true),
('What part of your inner world do you feel I understand the least?', 'emotional', 'deep', 'intimate_conversation', 'partner', 'growth', true),
('What does emotional safety in a conversation look like for you?', 'emotional', 'deep', 'intimate_conversation', 'partner', 'growth', true),
('If our relationship had a theme song for this season, what would it be and why?', 'emotional', 'deep', 'intimate_conversation', 'partner', 'growth', true),

-- =============================================================================
-- SEED: Partner Prompts - Recreational Companionship (15+)
-- =============================================================================
('What''s an activity you''ve always wanted to try together?', 'fun', 'light', 'recreational_companionship', 'partner', 'play', true),
('If we had a surprise free weekend, what would you want us to do?', 'fun', 'light', 'recreational_companionship', 'partner', 'play', true),
('What''s something we did together that made you laugh the hardest?', 'fun', 'light', 'recreational_companionship', 'partner', 'play', true),
('Would you rather we try a cooking class, dance class, or art class together?', 'fun', 'light', 'recreational_companionship', 'partner', 'play', true),
('What''s your idea of a perfect low-key date night at home?', 'fun', 'light', 'recreational_companionship', 'partner', 'play', true),
('Do you feel like we make enough time for fun together?', 'fun', 'medium', 'recreational_companionship', 'partner', 'play', true),
('What hobby or interest of mine would you like to learn more about?', 'fun', 'medium', 'recreational_companionship', 'partner', 'play', true),
('How do you feel when we do something adventurous or outside our comfort zone?', 'fun', 'medium', 'recreational_companionship', 'partner', 'play', true),
('What''s a tradition we could start as a couple that would be unique to us?', 'fun', 'medium', 'recreational_companionship', 'partner', 'play', true),
('If money was no object, what experience would you want us to share?', 'fun', 'medium', 'recreational_companionship', 'partner', 'play', true),
('Do you ever feel like our daily routine crowds out time for play and fun?', 'emotional', 'deep', 'recreational_companionship', 'partner', 'play', true),
('What does quality time actually mean to you versus just being in the same room?', 'emotional', 'deep', 'recreational_companionship', 'partner', 'play', true),
('Is there a season of our relationship where we had the most fun? What made it special?', 'emotional', 'deep', 'recreational_companionship', 'partner', 'play', true),
('How can we protect our "us time" when life gets overwhelming?', 'emotional', 'deep', 'recreational_companionship', 'partner', 'play', true),
('What role does laughter play in keeping us connected?', 'emotional', 'deep', 'recreational_companionship', 'partner', 'play', true),

-- =============================================================================
-- SEED: Partner Prompts - Honesty & Openness (12)
-- =============================================================================
('Is there something small I do that bothers you that you''ve never mentioned?', 'emotional', 'light', 'honesty_openness', 'partner', 'growth', true),
('How comfortable do you feel being completely honest with me?', 'emotional', 'light', 'honesty_openness', 'partner', 'growth', true),
('What''s something you appreciate about how I handle hard truths?', 'emotional', 'light', 'honesty_openness', 'partner', 'growth', true),
('When did I last make you feel truly heard and understood?', 'emotional', 'medium', 'honesty_openness', 'partner', 'growth', true),
('Is there a topic we tend to avoid? How can we approach it together?', 'emotional', 'medium', 'honesty_openness', 'partner', 'growth', true),
('What helps you open up when you''re going through something difficult?', 'emotional', 'medium', 'honesty_openness', 'partner', 'growth', true),
('Do you ever hold back your true feelings to protect me? How does that feel?', 'emotional', 'medium', 'honesty_openness', 'partner', 'growth', true),
('What does trust look like in action, not just in words?', 'emotional', 'deep', 'honesty_openness', 'partner', 'growth', true),
('Has there been a moment where my reaction made you less likely to share?', 'emotional', 'deep', 'honesty_openness', 'partner', 'growth', true),
('What would it take for you to feel 100% safe being your full self with me?', 'emotional', 'deep', 'honesty_openness', 'partner', 'growth', true),
('How do you want me to respond when you share something that''s hard to hear?', 'emotional', 'deep', 'honesty_openness', 'partner', 'growth', true),
('What''s the bravest thing you''ve ever told me?', 'emotional', 'deep', 'honesty_openness', 'partner', 'growth', true),

-- =============================================================================
-- SEED: Partner Prompts - Admiration (12)
-- =============================================================================
('What''s something I did recently that made you proud?', 'emotional', 'light', 'admiration', 'partner', 'romance', true),
('What quality of mine do you admire most?', 'emotional', 'light', 'admiration', 'partner', 'romance', true),
('What would you tell your best friend about why you chose me?', 'emotional', 'light', 'admiration', 'partner', 'romance', true),
('How do you feel when I acknowledge your strengths in front of others?', 'emotional', 'medium', 'admiration', 'partner', 'romance', true),
('What''s a way I''ve grown that you''ve noticed but never mentioned?', 'emotional', 'medium', 'admiration', 'partner', 'romance', true),
('Do you feel genuinely respected and valued in our relationship?', 'emotional', 'medium', 'admiration', 'partner', 'romance', true),
('What does it mean to you when I express pride in who you are?', 'emotional', 'medium', 'admiration', 'partner', 'romance', true),
('Is there an area where you wish I showed more respect for your perspective?', 'emotional', 'deep', 'admiration', 'partner', 'romance', true),
('What legacy do you want us to build together, and what do you admire about how we''re building it?', 'emotional', 'deep', 'admiration', 'partner', 'romance', true),
('When do you feel most seen and appreciated by me?', 'emotional', 'deep', 'admiration', 'partner', 'romance', true),
('How can I better celebrate your wins without making it about me?', 'emotional', 'deep', 'admiration', 'partner', 'romance', true),
('What does unconditional respect look like in a relationship?', 'emotional', 'deep', 'admiration', 'partner', 'romance', true),

-- =============================================================================
-- SEED: Partner Prompts - Family Commitment (12)
-- =============================================================================
('What family tradition from your childhood do you want us to continue?', 'emotional', 'light', 'family_commitment', 'partner', 'faith', true),
('How do you feel about our current balance between family time and couple time?', 'emotional', 'light', 'family_commitment', 'partner', 'faith', true),
('What''s one thing we do well as a family that you''re grateful for?', 'emotional', 'light', 'family_commitment', 'partner', 'faith', true),
('What kind of parents or family leaders do you want us to be remembered as?', 'emotional', 'medium', 'family_commitment', 'partner', 'faith', true),
('How can we better support each other''s parenting styles?', 'emotional', 'medium', 'family_commitment', 'partner', 'faith', true),
('What values are most important for us to model for our family?', 'emotional', 'medium', 'family_commitment', 'partner', 'faith', true),
('Is there a family dynamic we need to address that we''ve been avoiding?', 'emotional', 'medium', 'family_commitment', 'partner', 'faith', true),
('How do extended family relationships affect our partnership?', 'emotional', 'deep', 'family_commitment', 'partner', 'faith', true),
('What does "putting family first" mean to you in practice?', 'emotional', 'deep', 'family_commitment', 'partner', 'faith', true),
('How can we create a family culture that reflects who we truly are?', 'emotional', 'deep', 'family_commitment', 'partner', 'faith', true),
('What conversation about our family''s future do we need to have but keep postponing?', 'emotional', 'deep', 'family_commitment', 'partner', 'faith', true),
('What does commitment to family look like on your hardest days?', 'emotional', 'deep', 'family_commitment', 'partner', 'faith', true),

-- =============================================================================
-- SEED: Partner Prompts - Domestic Support (10)
-- =============================================================================
('How do you feel about how we split household responsibilities?', 'intellectual', 'light', 'domestic_support', 'partner', 'growth', true),
('What household task do you secretly wish I''d take over?', 'intellectual', 'light', 'domestic_support', 'partner', 'growth', true),
('What does a well-run household look like to you?', 'intellectual', 'light', 'domestic_support', 'partner', 'growth', true),
('Do you feel like your contributions at home are noticed and appreciated?', 'intellectual', 'medium', 'domestic_support', 'partner', 'growth', true),
('How can we make our home feel more like a sanctuary?', 'intellectual', 'medium', 'domestic_support', 'partner', 'growth', true),
('What would lighten your daily load the most right now?', 'intellectual', 'medium', 'domestic_support', 'partner', 'growth', true),
('Is there resentment building around any household dynamics we should address?', 'emotional', 'deep', 'domestic_support', 'partner', 'growth', true),
('How did your family of origin handle domestic roles, and how does that affect us?', 'emotional', 'deep', 'domestic_support', 'partner', 'growth', true),
('What would it look like for us to be true domestic partners, not just cohabitants?', 'emotional', 'deep', 'domestic_support', 'partner', 'growth', true),
('How can we turn mundane household tasks into moments of connection?', 'emotional', 'deep', 'domestic_support', 'partner', 'growth', true),

-- =============================================================================
-- SEED: Partner Prompts - Financial Support (10)
-- =============================================================================
('What''s your biggest financial goal for the next year?', 'intellectual', 'light', 'financial_support', 'partner', 'finance', true),
('How do you feel about our current financial communication?', 'intellectual', 'light', 'financial_support', 'partner', 'finance', true),
('What purchase or investment would make you feel more secure?', 'intellectual', 'light', 'financial_support', 'partner', 'finance', true),
('Do you feel like we''re on the same page about spending vs. saving?', 'intellectual', 'medium', 'financial_support', 'partner', 'finance', true),
('What money lesson from your childhood still affects you today?', 'intellectual', 'medium', 'financial_support', 'partner', 'finance', true),
('How can we make financial planning feel less stressful and more exciting?', 'intellectual', 'medium', 'financial_support', 'partner', 'finance', true),
('What does financial freedom look like for our family?', 'intellectual', 'deep', 'financial_support', 'partner', 'finance', true),
('Is there a financial fear you haven''t shared with me?', 'emotional', 'deep', 'financial_support', 'partner', 'finance', true),
('How do you feel about our financial safety net right now?', 'emotional', 'deep', 'financial_support', 'partner', 'finance', true),
('What legacy do you want to leave financially for the next generation?', 'intellectual', 'deep', 'financial_support', 'partner', 'finance', true),

-- =============================================================================
-- SEED: Partner Prompts - Physical Attractiveness (10)
-- =============================================================================
('What makes you feel most confident about your appearance?', 'physical', 'light', 'physical_attractiveness', 'partner', 'romance', true),
('Is there something I wear or do that you find especially attractive?', 'physical', 'light', 'physical_attractiveness', 'partner', 'romance', true),
('How important is it to you that we both prioritize our physical health?', 'physical', 'light', 'physical_attractiveness', 'partner', 'romance', true),
('What fitness or health goal would you like us to pursue together?', 'physical', 'medium', 'physical_attractiveness', 'partner', 'romance', true),
('How do you feel about aging together? What excites or concerns you?', 'physical', 'medium', 'physical_attractiveness', 'partner', 'romance', true),
('Do you feel like I notice and appreciate the effort you put into your appearance?', 'physical', 'medium', 'physical_attractiveness', 'partner', 'romance', true),
('How has your relationship with your body changed since we''ve been together?', 'physical', 'deep', 'physical_attractiveness', 'partner', 'romance', true),
('What insecurity about your appearance do you wish I understood better?', 'physical', 'deep', 'physical_attractiveness', 'partner', 'romance', true),
('How can we support each other in feeling our best without pressure?', 'physical', 'deep', 'physical_attractiveness', 'partner', 'romance', true),
('What does "taking care of yourself for the relationship" mean to you?', 'physical', 'deep', 'physical_attractiveness', 'partner', 'romance', true),

-- =============================================================================
-- SEED: Partner Prompts - Dreams & Spiritual (10)
-- =============================================================================
('What dream for our future gets you most excited?', 'spiritual', 'light', null, 'partner', 'dreams', true),
('If we could live anywhere for a year, where would you choose?', 'spiritual', 'light', null, 'partner', 'dreams', true),
('What does your ideal life look like 5 years from now?', 'spiritual', 'medium', null, 'partner', 'dreams', true),
('How do you feel our spiritual or personal growth is progressing together?', 'spiritual', 'medium', null, 'partner', 'faith', true),
('What gives your life the deepest sense of meaning right now?', 'spiritual', 'medium', null, 'partner', 'faith', true),
('Is there a purpose or calling you feel drawn to but haven''t pursued?', 'spiritual', 'deep', null, 'partner', 'dreams', true),
('How do you want us to grow spiritually or philosophically as a couple?', 'spiritual', 'deep', null, 'partner', 'faith', true),
('What does legacy mean to you beyond money and possessions?', 'spiritual', 'deep', null, 'partner', 'dreams', true),
('What are you most afraid of never accomplishing?', 'spiritual', 'deep', null, 'partner', 'dreams', true),
('How can we better support each other''s individual dreams while building shared ones?', 'spiritual', 'deep', null, 'partner', 'dreams', true),

-- =============================================================================
-- SEED: Kids Prompts - Teen 14-18 (20+)
-- =============================================================================
('What''s something going on at school that you wish I understood better?', 'emotional', 'light', null, 'child', 'bonding', true),
('If you could teach me one thing about your generation, what would it be?', 'intellectual', 'light', null, 'child', 'bonding', true),
('What''s a song, show, or creator you''re into right now that I should check out?', 'fun', 'light', null, 'child', 'fun', true),
('What''s the funniest thing that happened to you this week?', 'fun', 'light', null, 'child', 'fun', true),
('If you could plan our next family outing, what would we do?', 'fun', 'light', null, 'child', 'fun', true),
('What''s one skill you want to master before you turn 20?', 'intellectual', 'light', null, 'child', 'mentoring', true),
('Who in your life right now do you respect the most and why?', 'emotional', 'medium', null, 'child', 'values', true),
('What does being a good friend look like to you?', 'emotional', 'medium', null, 'child', 'values', true),
('What''s something you''re proud of that you don''t talk about much?', 'emotional', 'medium', null, 'child', 'emotional', true),
('If you could change one thing about our family, what would it be?', 'emotional', 'medium', null, 'child', 'emotional', true),
('What''s something I do as a parent that you actually appreciate?', 'emotional', 'medium', null, 'child', 'bonding', true),
('What does respect between a parent and teenager look like to you?', 'emotional', 'medium', null, 'child', 'values', true),
('How do you handle pressure from friends to do things you''re not comfortable with?', 'emotional', 'medium', null, 'child', 'mentoring', true),
('What''s a decision you''re facing right now where you''d value my perspective?', 'intellectual', 'medium', null, 'child', 'mentoring', true),
('What kind of man/woman do you want to become?', 'spiritual', 'deep', null, 'child', 'values', true),
('What''s the hardest part about growing up right now?', 'emotional', 'deep', null, 'child', 'emotional', true),
('Is there something about our relationship you wish was different?', 'emotional', 'deep', null, 'child', 'emotional', true),
('What does success mean to you - not what I think, but what YOU think?', 'intellectual', 'deep', null, 'child', 'mentoring', true),
('What values do you want to carry into adulthood?', 'spiritual', 'deep', null, 'child', 'values', true),
('What''s something you''ve never told me because you didn''t think I''d understand?', 'emotional', 'deep', null, 'child', 'emotional', true),
('How do you want me to show up for you during this stage of your life?', 'emotional', 'deep', null, 'child', 'bonding', true),
('What does it mean to you to have a father/mother who cares about your inner world?', 'emotional', 'deep', null, 'child', 'bonding', true),

-- =============================================================================
-- SEED: Kids Prompts - Tween 10-13 (15)
-- =============================================================================
('What''s the best part of your day usually?', 'emotional', 'light', null, 'child', 'bonding', true),
('If we could have a movie marathon this weekend, what three movies would you pick?', 'fun', 'light', null, 'child', 'fun', true),
('What''s something new you learned recently that blew your mind?', 'intellectual', 'light', null, 'child', 'mentoring', true),
('If you could have any superpower, what would it be and how would you use it?', 'fun', 'light', null, 'child', 'fun', true),
('Who is your biggest role model right now and why?', 'emotional', 'medium', null, 'child', 'values', true),
('What''s something kids your age worry about that adults don''t realize?', 'emotional', 'medium', null, 'child', 'emotional', true),
('How would you describe yourself to someone who''s never met you?', 'emotional', 'medium', null, 'child', 'emotional', true),
('What makes you feel most confident?', 'emotional', 'medium', null, 'child', 'emotional', true),
('Is there a subject at school you wish you were better at?', 'intellectual', 'medium', null, 'child', 'mentoring', true),
('What''s the kindest thing someone did for you recently?', 'emotional', 'medium', null, 'child', 'values', true),
('When you feel upset, what helps you feel better?', 'emotional', 'medium', null, 'child', 'emotional', true),
('What''s something you want to be really good at someday?', 'intellectual', 'deep', null, 'child', 'mentoring', true),
('What does being brave mean to you?', 'spiritual', 'deep', null, 'child', 'values', true),
('What makes our family special compared to other families?', 'emotional', 'deep', null, 'child', 'bonding', true),
('What''s one thing you wish I knew about what it''s like to be your age?', 'emotional', 'deep', null, 'child', 'emotional', true),

-- =============================================================================
-- SEED: Kids Prompts - Child 5-9 (15)
-- =============================================================================
('What made you smile today?', 'emotional', 'light', null, 'child', 'bonding', true),
('If you could be any animal for a day, which one and why?', 'fun', 'light', null, 'child', 'fun', true),
('What''s your favorite thing about our family?', 'emotional', 'light', null, 'child', 'bonding', true),
('If we could go on an adventure anywhere, where would you want to go?', 'fun', 'light', null, 'child', 'fun', true),
('What''s the silliest thing you can think of right now?', 'fun', 'light', null, 'child', 'fun', true),
('Who is your best friend and what do you like about them?', 'emotional', 'light', null, 'child', 'bonding', true),
('What''s something you''re really good at?', 'emotional', 'medium', null, 'child', 'emotional', true),
('What do you want to be when you grow up, and what do you think that job is like?', 'intellectual', 'medium', null, 'child', 'mentoring', true),
('What''s something that scares you a little bit?', 'emotional', 'medium', null, 'child', 'emotional', true),
('If you could make one rule for our family, what would it be?', 'fun', 'medium', null, 'child', 'bonding', true),
('What does being kind look like to you?', 'spiritual', 'medium', null, 'child', 'values', true),
('When do you feel the most loved?', 'emotional', 'medium', null, 'child', 'emotional', true),
('What makes a good friend?', 'emotional', 'medium', null, 'child', 'values', true),
('What''s something you wish grown-ups understood about being a kid?', 'emotional', 'deep', null, 'child', 'emotional', true),
('What makes you feel safe and happy at home?', 'emotional', 'deep', null, 'child', 'bonding', true),

-- =============================================================================
-- SEED: Kids Prompts - Toddler 0-4 (10) (parent-facing prompts for connection)
-- =============================================================================
('Let''s name 3 things we can see that are the color [pick a color]!', 'fun', 'light', null, 'child', 'fun', true),
('Can you show me your favorite toy and tell me why you love it?', 'fun', 'light', null, 'child', 'bonding', true),
('What animal sound makes you laugh the most?', 'fun', 'light', null, 'child', 'fun', true),
('Let''s make up a story together - you start and I''ll add the next part!', 'fun', 'light', null, 'child', 'bonding', true),
('What makes you feel happy right now?', 'emotional', 'light', null, 'child', 'emotional', true),
('Can you draw a picture of our family?', 'fun', 'light', null, 'child', 'bonding', true),
('What was your favorite part of today?', 'emotional', 'light', null, 'child', 'bonding', true),
('Who do you love the most and why? (It''s okay to say anyone!)', 'emotional', 'medium', null, 'child', 'emotional', true),
('What do you want to learn how to do?', 'intellectual', 'medium', null, 'child', 'mentoring', true),
('When you feel scared, what helps you feel brave?', 'emotional', 'medium', null, 'child', 'emotional', true)

ON CONFLICT DO NOTHING;
