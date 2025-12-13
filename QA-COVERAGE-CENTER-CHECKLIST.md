# Coverage Center QA Validation Checklist

## Overview
Complete testing checklist for Coverage Center ($100M Mind Insurance Feature).

---

## 1. Route Testing

### Coverage Center Routes
- [ ] `/mind-insurance/coverage` - Coverage Center page loads
- [ ] `/mind-insurance/insights` - Redirects to `/mind-insurance/coverage`
- [ ] `/mind-insurance/first-session` - First Session page loads
- [ ] Protected routes require authentication

### Navigation Flow
- [ ] MindInsuranceHub → DashboardCoverageCard → Coverage Center
- [ ] Identity Collision Assessment completion → First Session
- [ ] First Session completion → Coverage Center

---

## 2. Coverage Streak (Phase 3)

### Display
- [ ] Current streak number displays correctly
- [ ] Longest streak displays correctly
- [ ] Streak badge shows flame icon with count
- [ ] Hero view shows full streak details

### Functionality
- [ ] Streak increments on protocol day completion
- [ ] Streak resets on missed day (without skip token)
- [ ] At-risk state triggers after missed CT window

---

## 3. Skip Tokens (Phase 3)

### Display
- [ ] 3 token slots show (filled/empty)
- [ ] Token count updates in real-time
- [ ] Compact badge shows token count

### Functionality
- [ ] Token earned when protocol completes (Day 7)
- [ ] Max 3 tokens enforced
- [ ] Token consumption protects streak
- [ ] Use token flow shows confirmation modal

---

## 4. Milestones (Phase 3)

### Display
- [ ] Day 7 milestone badge
- [ ] Day 21 milestone badge
- [ ] Day 66 milestone badge (neural rewiring)
- [ ] Compact view shows achieved milestones

### Functionality
- [ ] Milestone auto-recorded on achievement
- [ ] Milestone includes protocol reference

---

## 5. MIO Coverage Tab (Phase 4)

### ActiveMIOProtocolCard
- [ ] Protocol title displays
- [ ] Pattern targeted shows
- [ ] Day X/Y progress ring
- [ ] Today's task preview visible
- [ ] "Start Today's Task" CTA works
- [ ] Coverage Streak badge shows

### MIOProtocolHistory
- [ ] Completed protocols list
- [ ] Timeline view shows dates
- [ ] Protocol cards are expandable
- [ ] Load more pagination works

### TransformationMetrics
- [ ] Before/after assessment scores
- [ ] Score change indicators (positive/negative)
- [ ] Compact view shows summary

---

## 6. Coach Coverage Tab (Phase 5)

### Tab Visibility
- [ ] Coach tab hidden when no coach assignments
- [ ] Coach tab visible when coach protocols exist

### ActiveCoachProtocolCard
- [ ] Protocol title displays
- [ ] Week/day progress shows
- [ ] Coach name visible
- [ ] Day tasks list accessible

### CoachProtocolHistory
- [ ] Completed coach protocols list
- [ ] Timeline view works
- [ ] Protocol details expandable

---

## 7. Coverage Center Page (Phase 6)

### Header
- [ ] Coverage Streak displays
- [ ] Skip Tokens display
- [ ] Glossary info button works
- [ ] Refresh button updates data

### Tabs
- [ ] Default to MIO tab
- [ ] Tab switching works smoothly
- [ ] Tab content renders correctly
- [ ] Responsive layout maintained

### Loading States
- [ ] Skeleton loaders show during fetch
- [ ] Error states display properly
- [ ] Empty states handled gracefully

---

## 8. First Session Flow (Phase 7)

### Welcome Stage
- [ ] MIO welcome message shows with user's name
- [ ] Animation/transition smooth
- [ ] Auto-advances to analyzing stage

### Analyzing Stage
- [ ] "Analyzing" animation plays
- [ ] Minimum duration enforced (8s)
- [ ] Error message shows if protocol fetch fails
- [ ] Background polling continues on timeout

### Reveal Stage
- [ ] Protocol title reveals
- [ ] Pattern name displays
- [ ] Pattern description shows
- [ ] MIO intro message renders
- [ ] "View Protocol" CTA works

### Engagement Stage
- [ ] First question input works
- [ ] Submit saves response
- [ ] Skip option available
- [ ] Submitting state shows loader

### Confirmation Stage
- [ ] Thank you message displays
- [ ] "View Your Coverage" navigates to Coverage Center

---

## 9. Dashboard Integration (Phase 8)

### DashboardCoverageCard
- [ ] Shows on MindInsuranceHub
- [ ] Displays active coverage type (MIO/Coach)
- [ ] Coverage Streak badge visible
- [ ] "View Coverage Center" CTA works
- [ ] Card styling matches dashboard theme

---

## 10. Protocol-Aware PROTECT CT (Phase 9)

### ProtocolCheckIn Component
- [ ] Shows when active protocol exists
- [ ] Hidden when no active protocol
- [ ] Hidden after today's completion

### Practice Response Options
- [ ] "Yes, multiple times" option
- [ ] "Yes, at least once" option
- [ ] "I tried but didn't notice" option
- [ ] "I forgot to practice" option
- [ ] Radio selection works

### Journal Fields
- [ ] Moment capture textarea works
- [ ] Insight toggle shows/hides optional field
- [ ] Validation hint shows when incomplete

### Integration
- [ ] CT form requires protocol check-in (when protocol active)
- [ ] Protocol day completion fires on CT submit
- [ ] Success toast mentions protocol check-in

---

## 11. N8n Workflows (Phase 10)

### First Protocol Generation
- [ ] Webhook responds in < 30 seconds
- [ ] Protocol inserted to `mio_weekly_protocols`
- [ ] Source = 'onboarding_completion'
- [ ] Pattern-specific prompt used
- [ ] Day tasks array populated

### Day Completion Response
- [ ] Webhook responds in < 15 seconds
- [ ] MIO message inserted to `mio_insights_messages`
- [ ] Protocol progress updated
- [ ] Skip token awarded on Day 7
- [ ] Streak referenced in response

---

## 12. Database Migrations

### coverage_streaks Table
- [ ] Table created with correct schema
- [ ] user_id foreign key works
- [ ] skip_tokens constraint (0-3) enforced
- [ ] RLS policies active

### coverage_milestones Table
- [ ] Table created with correct schema
- [ ] milestone_type enum enforced
- [ ] Unique constraint works

### mio_weekly_protocols Extensions
- [ ] pattern_targeted column exists
- [ ] description column exists
- [ ] mio_intro column exists
- [ ] total_days column exists (default 7)
- [ ] skip_token_earned column exists
- [ ] skip_token_earned_at column exists
- [ ] New source value 'onboarding_completion' allowed
- [ ] New status value 'paused' allowed

### mio_insights_messages Extensions
- [ ] protocol_id column exists (FK to mio_weekly_protocols)
- [ ] day_number column exists
- [ ] message_type column exists
- [ ] metadata JSONB column exists
- [ ] is_read boolean column exists
- [ ] New section_type 'day_completion' allowed
- [ ] Indexes created for protocol queries

### Functions
- [ ] get_active_mio_protocol returns new columns
- [ ] get_protocol_day_messages works

---

## 13. Responsive Testing

### Mobile (375px)
- [ ] Coverage Center page renders correctly
- [ ] First Session flow works on mobile
- [ ] Protocol check-in usable
- [ ] Tabs stack appropriately
- [ ] No horizontal scroll

### Tablet (768px)
- [ ] Two-column layout where appropriate
- [ ] Cards resize properly
- [ ] Touch targets adequate size

### Desktop (1440px)
- [ ] Full layout displays
- [ ] No excessive whitespace
- [ ] Cards properly aligned

---

## 14. Accessibility (WCAG AA)

### Focus Management
- [ ] All interactive elements focusable
- [ ] Focus visible on keyboard navigation
- [ ] Modal traps focus appropriately

### Screen Reader
- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] Error messages announced

### Color Contrast
- [ ] Text meets 4.5:1 ratio
- [ ] UI elements meet 3:1 ratio
- [ ] Not relying solely on color for state

---

## 15. Performance

### Load Times
- [ ] Coverage Center < 2s initial load
- [ ] First Session < 2s initial load
- [ ] Protocol fetch < 3s

### Bundle Size
- [ ] No unnecessary imports
- [ ] Components lazy-loaded where appropriate

---

## 16. Error Handling

### Network Errors
- [ ] Toast notifications for API failures
- [ ] Retry options available
- [ ] Graceful degradation

### Edge Cases
- [ ] No active protocol - shows empty state
- [ ] New user - prompts assessment
- [ ] Expired session - redirects to login

---

## 17. Console Errors

- [ ] No React warnings in console
- [ ] No TypeScript errors in build
- [ ] No network errors (when online)
- [ ] No deprecation warnings

---

## Testing Commands

```bash
# Build check
npm run build

# Type check
npm run typecheck

# Lint check
npm run lint

# Dev server
npm run dev
```

---

## Sign-off

| Area | Tester | Date | Status |
|------|--------|------|--------|
| Routes | | | |
| Coverage Streak | | | |
| Skip Tokens | | | |
| Milestones | | | |
| MIO Tab | | | |
| Coach Tab | | | |
| Coverage Center Page | | | |
| First Session | | | |
| Dashboard Integration | | | |
| PROTECT CT | | | |
| N8n Workflows | | | |
| Database | | | |
| Responsive | | | |
| Accessibility | | | |
| Performance | | | |
| Error Handling | | | |

---

*Coverage Center v1.0 - $100M Mind Insurance Feature*
