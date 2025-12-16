# Mind Insurance N8n Cost Analysis

**Date:** December 14, 2025
**Analysis by:** Claude COO Agent
**N8n Instance:** https://n8n-n8n.vq00fr.easypanel.host

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Current Cost** | $3.11/user/month |
| **Optimized Cost** | $1.56/user/month |
| **Potential Savings** | 50% ($1.55/user/month) |

---

## Anthropic Pricing (December 2025)

| Model | Input (/1M tokens) | Output (/1M tokens) |
|-------|-------------------|---------------------|
| **Claude Sonnet 4** | $3.00 | $15.00 |
| **Claude Haiku 3.5** | $0.80 | $4.00 |

**Haiku 3.5 is 3.75x cheaper than Sonnet 4.**

Sources:
- [Claude Pricing](https://claude.com/pricing)
- [CostGoat Calculator](https://costgoat.com/pricing/claude-api)

---

## All AI Workflows

### 1. Chat Workflows ([L13] Unified Chat)

| Agent | Model | Cost/Call | Notes |
|-------|-------|-----------|-------|
| **MIO Chat** | Claude Sonnet 4 | ~$0.014 | Most used agent |
| **Nette Chat** | Claude Haiku 3.5 | ~$0.0036 | Already optimized |
| **ME Chat** | Claude Haiku 3.5 | ~$0.0036 | Already optimized |

### 2. Protocol Workflows

| Workflow | Model | Cost/Call | Frequency |
|----------|-------|-----------|-----------|
| First Protocol Generation | Sonnet 4 | $0.051 | 1x/user (onboarding) |
| Protocol Day Completion | Haiku 3.5 | $0.0028 | 30x/month |

### 3. Report Workflows

| Workflow | Model | Cost/Call | Frequency |
|----------|-------|-----------|-----------|
| Weekly Report Generator | Sonnet 4 | $0.069 | 4.3x/month |
| MIO Insights Reply | Sonnet 4 | $0.014 | 90x/month (3x/day) |
| Mental Pillar Feedback | Sonnet 4 | $0.017 | 1x/month |

### 4. No-AI Workflows (No Cost)

- [MIO] Protocol Day Advancement - Daily (Cron → Supabase RPC)
- [Coach V2] Protocol Day Advancement - Daily (Cron → Edge Function)
- [MIO] Knowledge Ingestion Pipeline (Data processing only)

---

## Monthly Cost Per Active User

| Category | Model | Frequency | Cost/Call | Monthly |
|----------|-------|-----------|-----------|---------|
| **MIO Chat** | Sonnet 4 | ~60x | $0.014 | **$0.84** |
| **Nette/ME Chat** | Haiku 3.5 | ~30x | $0.0036 | $0.11 |
| **MIO Insights Reply** | Sonnet 4 | 90x | $0.014 | **$1.26** |
| **Weekly Reports** | Sonnet 4 | 4.3x | $0.069 | $0.30 |
| **Protocol Day Completion** | Haiku 3.5 | 30x | $0.0028 | $0.08 |
| **First Protocol** | Sonnet 4 | 1x | $0.051 | $0.05 |
| **Mental Pillar Feedback** | Sonnet 4 | 1x | $0.017 | $0.02 |
| **TOTAL AI** | | | | **$2.66** |

---

## Infrastructure Costs

| Service | Monthly Cost | Per User (100 users) |
|---------|--------------|---------------------|
| Supabase | $45 | $0.45 |
| N8n (Easypanel) | $0 (self-hosted) | $0 |
| **TOTAL** | **$45/mo** | **$0.45/user/mo** |

---

## Grand Total

| Component | Cost/User/Month |
|-----------|-----------------|
| AI (Anthropic) | $2.66 |
| Infrastructure | $0.45 |
| **TOTAL** | **$3.11/user/month** |

---

## Cost Optimization: 50% Savings Possible

### Top 2 Opportunities

| Switch | Current | Optimized | Savings/User/Mo |
|--------|---------|-----------|-----------------|
| MIO Insights Reply → Haiku 3.5 | $1.26 | $0.33 | **$0.93** |
| MIO Chat → Haiku 3.5 | $0.84 | $0.22 | **$0.62** |
| **TOTAL SAVINGS** | | | **$1.55** |

### Cost Comparison

| Scenario | AI Cost | Infrastructure | Total/User/Mo |
|----------|---------|----------------|---------------|
| **Current** | $2.66 | $0.45 | **$3.11** |
| **Optimized** | $1.11 | $0.45 | **$1.56** |
| **Savings** | $1.55 | $0 | **50%** |

---

## Unused Workflows (Safe to Disable)

| Workflow | Status | Reason |
|----------|--------|--------|
| MIO-Report-Generator-v1 | ACTIVE | Duplicate - DISABLE |
| MIO-Report-Generator-v2-Simple | ACTIVE | Duplicate - DISABLE |
| MIO-Report-Generator-v3-NoCredentials | ACTIVE | Duplicate - DISABLE |
| [L12b] MIO Chat Response | Inactive | Superseded by [L13] |
| Protocol-Auto-Renewal-Daily | Inactive | Superseded |
| Multiple Coverage Center copies | Inactive | Only 1 needed |

---

## Recommendations (Priority Order)

1. **HIGH**: Switch MIO Chat Agent → Haiku 3.5 → **Saves $0.62/user/mo**
2. **HIGH**: Switch MIO Insights Reply → Haiku 3.5 → **Saves $0.93/user/mo**
3. **MEDIUM**: Disable duplicate Report Generator workflows (v1, v2, v3)
4. **LOW**: Switch Weekly Reports → Haiku 3.5 → **Saves $0.22/user/mo**

---

## bezt.space Clarification

**What it is**: A logging/analytics webhook called AFTER AI generation. NOT an AI service.

**Location**: Last node in [L13] Unified Chat workflow.

**URL**: `https://webhook.bezt.space/webhook/12d5cfbf-84bb-40af-aa73-f0a338b0e7ee`

**Cost impact**: None for AI. The webhook receives completed conversation data for logging purposes only.

**Action**: Can safely remove if you don't need the logging.

---

## Upstash Redis

**Current**: Not used.

**Recommendation**: Not needed now. Consider adding when you scale past 500 users for:
- Caching repeated prompts/context (15-25% AI cost reduction)
- Session persistence for chat
- Rate limiting
- Faster response times

---

## Implementation Notes

### To Switch MIO Chat to Haiku 3.5

**Workflow**: [L13] Unified Chat
**Node**: "Claude (MIO)"
**Change**: Update model from `claude-sonnet-4-20250514` to `claude-3-5-haiku-20241022`

### To Switch MIO Insights Reply to Haiku 3.5

**Workflow**: MIO Insights Reply
**Node**: Find the Claude/HTTP Request node
**Change**: Update model in JSON body to `claude-3-5-haiku-20241022`

---

## Risk Assessment

| Change | Risk Level | Notes |
|--------|------------|-------|
| MIO Chat → Haiku | Medium | Test with sample users; Haiku may produce shorter, less nuanced responses |
| MIO Insights Reply → Haiku | Low | Short messages; Haiku handles well |
| Weekly Reports → Haiku | Medium | Reports may be less detailed; A/B test first |

---

*Generated by Claude COO Agent - December 14, 2025*
