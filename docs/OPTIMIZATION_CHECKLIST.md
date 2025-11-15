# Phase 8 Optimization Checklist

## 🎯 RAG Optimization

### Tune RRF Weights

Current implementation uses Reciprocal Rank Fusion (RRF) to combine semantic search and full-text search results.

**Testing Plan:**

- [ ] **Baseline: Semantic Search Only**
  - Disable FTS in `rag-service.ts`
  - Run test suite, measure avg similarity scores
  - Target: >0.75 avg similarity for relevant queries

- [ ] **Baseline: FTS Only**
  - Disable vector search in `rag-service.ts`
  - Run test suite, measure keyword match accuracy
  - Target: >70% keyword coverage

- [ ] **Current: RRF (k=60)**
  - Current configuration in `reciprocalRankFusion()` function
  - `k=60` constant provides balanced ranking
  - Test with existing test suite

- [ ] **Experiment: RRF (k=40)**
  - Lower k = higher impact of top-ranked results
  - Better for precision-focused queries
  - Test with Week 1 foundation questions

- [ ] **Experiment: RRF (k=80)**
  - Higher k = more balanced fusion
  - Better for exploratory queries
  - Test with cross-agent handoff scenarios

**File to Modify:** `supabase/functions/_shared/rag-service.ts`

**Metrics to Track:**
- Average similarity score per query type
- User satisfaction (via follow-up question patterns)
- Handoff accuracy (are suggestions accepted?)
- Response relevance (manual review of top 10 responses)

---

### Chunk Size Analysis

Current implementation uses ~500 token chunks with 50 token overlap.

**Testing Plan:**

- [ ] **Analyze Current Effectiveness**
  - Run analytics query for `rag_quality` metric
  - Review `chunks_retrieved` and `avg_similarity_score`
  - Identify patterns in low-relevance responses

- [ ] **Test: 300 Token Chunks (More Granular)**
  - Pros: More precise matching, less noise
  - Cons: More chunks needed, potential context loss
  - Use case: State-specific queries, tactic references
  - Implementation: Modify chunking logic in embedding generation scripts

- [ ] **Test: 700 Token Chunks (More Context)**
  - Pros: Better context preservation, fewer chunks
  - Cons: More irrelevant content, higher token usage
  - Use case: Complex operations questions, MIO pattern analysis
  - Implementation: Adjust chunk size in `generate-rag-embeddings.ts`

- [ ] **Test: Adaptive Chunking**
  - Use smaller chunks for tactical/factual content
  - Use larger chunks for narrative/pattern content
  - Implementation: Add `chunk_type` metadata to knowledge base

**Files to Modify:**
- `scripts/generate-rag-embeddings.ts`
- Potentially re-process knowledge base with new chunking

**Metrics to Track:**
- Response coherence (human evaluation)
- Answer accuracy (test suite pass rate)
- Token usage per query (cost tracking)
- Chunks needed per query (efficiency)

---

### Embedding Cache TTL Optimization

Current TTL: 24 hours for all embeddings.

**Testing Plan:**

- [ ] **Monitor Current Cache Performance**
  - Query `get-analytics` for cache hit rates
  - Track hit rates over 7 days
  - Target: >50% hit rate after week 1

- [ ] **Analyze Content Update Frequency**
  - Knowledge base: Rarely changes (monthly updates)
  - User context: Changes frequently (daily/weekly)
  - Conversation history: Changes constantly (per message)

- [ ] **Test: 48 Hour TTL for Knowledge Embeddings**
  - Lower API costs for stable content
  - Implementation: Update `CacheTTL.EMBEDDINGS` in `cache-service.ts`
  - Monitor: Stale content incidents

- [ ] **Test: 6 Hour TTL for User Context Embeddings**
  - Fresher context for active users
  - Higher accuracy for recent profile changes
  - Implementation: Separate TTL for `user_context:{userId}`

- [ ] **Test: No Cache for Conversation Embeddings**
  - Each message is unique
  - Caching doesn't help here
  - Implementation: Skip caching in handoff detection

**File to Modify:** `supabase/functions/_shared/cache-service.ts`

**Metrics to Track:**
- Cache hit rate by content type
- Embedding API costs (daily/weekly)
- Stale content incidents (user reports)
- Response freshness (time since last update)

---

## 💰 Cost Monitoring

### OpenAI API Costs

Current usage: Embeddings (text-embedding-3-small) + potential GPT calls.

**Tracking Setup:**

- [ ] **Set Up Daily Cost Tracking**
  - Create analytics query for embedding generation counts
  - Estimate cost: $0.00002 per 1K tokens (text-embedding-3-small)
  - Log to `docs/COST_TRACKING.md`

- [ ] **Calculate Per-User Costs**
  - Avg embeddings per user: ~10-15/day (messages + context updates)
  - Avg tokens per embedding: ~200 tokens
  - Monthly estimate: ~$0.06-0.12/user

- [ ] **Set Up Cost Alerts**
  - Alert if daily embedding costs exceed $5
  - Alert if per-user costs exceed $0.20/month
  - Implementation: Monitor via OpenAI dashboard + custom logging

- [ ] **Optimize Embedding Frequency**
  - Cache user context embeddings (done ✅)
  - Batch embed multiple messages when possible
  - Skip embedding for very short messages (<10 tokens)

**Target:** Keep embedding costs < $0.10/user/month

---

### Lovable AI Gateway Costs

Current usage: All agent responses via Lovable AI (streaming + structured output).

**Tracking Setup:**

- [ ] **Track Token Usage Per Agent**
  - Query `agent_conversations` table for `tokens_used`
  - Calculate avg per agent: Nette (~250), MIO (~200), ME (~200)
  - Group by time period (daily/weekly/monthly)

- [ ] **Monitor Streaming Costs**
  - Streaming responses cost ~20% more than standard
  - Check if streaming is necessary for all responses
  - Consider non-streaming for cached responses

- [ ] **Calculate Average Cost Per Conversation**
  - Lovable AI pricing: ~$0.001-0.002 per 1K tokens (estimate)
  - Avg conversation: 3-5 messages
  - Avg tokens per message: ~250
  - Cost per conversation: ~$0.002-0.005

- [ ] **Set Up Cost Alerts**
  - Alert if daily AI costs exceed $10
  - Alert if per-user costs exceed $0.50/month
  - Implementation: Track via `agent_conversations` analytics

**Target:** Keep AI costs < $0.50/user/month

---

### Total Cost Targets

- **Embeddings:** $0.10/user/month
- **AI Responses:** $0.50/user/month
- **Cache Infrastructure (Upstash):** $0.05/user/month
- **Total Target:** < $0.65/user/month
- **At 100 users:** < $65/month
- **At 1000 users:** < $650/month

---

## 📊 Performance Targets

### Response Time Targets

- [ ] **Cache Hit:** < 2 seconds (90th percentile)
- [ ] **Cache Miss (with RAG):** < 5 seconds (90th percentile)
- [ ] **Cold Start:** < 8 seconds (acceptable for first message)

**Monitoring:**
```sql
-- Query for response time percentiles
SELECT 
  agent_type,
  cache_hit,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms) as p50,
  PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY response_time_ms) as p90,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99
FROM agent_conversations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY agent_type, cache_hit;
```

---

### RAG Quality Targets

- [ ] **Semantic Similarity:** > 0.7 average for relevant queries
- [ ] **Chunks Retrieved:** 3-5 per query (optimal balance)
- [ ] **Context Relevance:** > 80% manual review score

**Monitoring:**
```sql
-- Query for RAG quality metrics
SELECT 
  agent_type,
  AVG(avg_similarity_score) as avg_similarity,
  AVG(chunks_retrieved) as avg_chunks,
  COUNT(*) as total_queries
FROM agent_conversations
WHERE rag_context_used = true
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY agent_type;
```

---

### Cache Performance Targets

- [ ] **Overall Hit Rate:** > 50% (after 1 week of usage)
- [ ] **Nette Hit Rate:** > 60% (most predictable queries)
- [ ] **MIO Hit Rate:** > 40% (more personalized)
- [ ] **ME Hit Rate:** > 45% (moderate caching)

**Monitoring:**
```sql
-- Query for cache hit rates
SELECT 
  agent_type,
  COUNT(*) FILTER (WHERE cache_hit = true) * 100.0 / COUNT(*) as hit_rate_percent,
  COUNT(*) as total_queries
FROM agent_conversations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY agent_type;
```

---

### Handoff Accuracy Targets

- [ ] **Suggestion Acceptance:** > 80% of handoffs accepted
- [ ] **False Positives:** < 10% (suggesting wrong agent)
- [ ] **Confidence Threshold:** > 0.75 for auto-suggest

**Monitoring:**
```sql
-- Query for handoff metrics
SELECT 
  handoff_target,
  AVG(handoff_confidence) as avg_confidence,
  COUNT(*) as total_suggestions
FROM agent_conversations
WHERE handoff_suggested = true
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY handoff_target;
```

---

## 🧪 Testing Schedule

### Week 1: Initial Testing & Bug Fixes
- [x] Deploy Phase 6 (Response Caching)
- [x] Deploy Phase 7 (Analytics & Monitoring)
- [x] Deploy Phase 8 (Test Suite)
- [ ] Run test suite daily
- [ ] Fix critical bugs (response failures, cache errors)
- [ ] Monitor baseline metrics (no optimization yet)

**Daily Checklist:**
- Run `test-agents` function with all scenarios
- Review edge function logs for errors
- Check analytics dashboard for anomalies

---

### Week 2: RAG Optimization
- [ ] Monday: Run RRF weight experiments (k=40, k=60, k=80)
- [ ] Tuesday: Analyze results, pick best weights
- [ ] Wednesday: Deploy optimized RRF weights
- [ ] Thursday: Test chunk size variations (300 vs 700 tokens)
- [ ] Friday: Document findings, plan next steps

**Metrics to Compare:**
- Test suite pass rate
- Average similarity scores
- User satisfaction indicators (follow-up questions, handoffs)

---

### Week 3: Cache & Cost Optimization
- [ ] Monday: Analyze cache hit rates by content type
- [ ] Tuesday: Implement differentiated TTLs (48h knowledge, 6h context)
- [ ] Wednesday: Deploy cache optimizations
- [ ] Thursday: Calculate cost per user, identify savings
- [ ] Friday: Set up cost alerts and monitoring

**Cost Tracking:**
- Daily embedding costs
- Daily AI response costs
- Per-user cost calculation
- Month-over-month trends

---

### Week 4: Final Audit & Documentation
- [ ] Monday: Run full test suite (all scenarios)
- [ ] Tuesday: Manual review of top 20 responses per agent
- [ ] Wednesday: Generate performance report
- [ ] Thursday: Document optimization findings
- [ ] Friday: Create runbook for ongoing maintenance

**Deliverables:**
- Performance report (before/after metrics)
- Cost analysis (actual vs. projected)
- Optimization recommendations
- Maintenance runbook

---

## 📈 Success Criteria

After completing Phase 8, the system should meet these criteria:

### Performance
- ✅ 50-60% cache hit rate within 1 week
- ✅ 40-50% reduction in AI API costs
- ✅ ~500ms faster responses on cache hits
- ✅ < 5 second p90 response time (cache miss)

### Quality
- ✅ > 0.7 average RAG similarity score
- ✅ > 80% test suite pass rate
- ✅ > 80% handoff suggestion accuracy
- ✅ < 5% response failures

### Cost
- ✅ < $0.65/user/month total costs
- ✅ < $0.10/user/month embedding costs
- ✅ < $0.50/user/month AI response costs

### Monitoring
- ✅ Comprehensive analytics on all key metrics
- ✅ Automated cost tracking
- ✅ Test suite for ongoing validation
- ✅ Clear optimization playbook for future improvements

---

## 🔄 Ongoing Maintenance

### Monthly Tasks
- [ ] Run full test suite
- [ ] Review cost trends
- [ ] Check for new optimization opportunities
- [ ] Update knowledge base embeddings if content changed

### Quarterly Tasks
- [ ] Deep dive on RAG quality
- [ ] Re-tune RRF weights based on usage patterns
- [ ] Audit cache performance
- [ ] Cost optimization review

### When to Re-optimize
- Test suite pass rate drops below 75%
- Cache hit rate drops below 40%
- Costs exceed $0.75/user/month
- User reports of poor response quality increase

---

## 📝 Notes & Learnings

### Lessons from Phase 8 Implementation

_(To be filled in as optimization proceeds)_

**What Worked Well:**
- 

**What Didn't Work:**
- 

**Unexpected Findings:**
- 

**Recommendations for v2:**
- 

---

## 🔗 Related Documentation

- [Implementation Tracking](./IMPLEMENTATION_TRACKING.md)
- [Edge Function Logs](https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/functions)
- [Analytics Dashboard](https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/editor)
- [Cost Tracking Spreadsheet](./COST_TRACKING.md) _(to be created)_
