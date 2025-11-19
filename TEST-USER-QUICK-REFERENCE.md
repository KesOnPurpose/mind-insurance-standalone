# Test User Quick Reference

**Last Updated**: 2025-11-19

---

## Current Test User

**Name**: Keston Glasgow
**Email**: kes@purposewaze.com
**User ID**: `77062c24-be2a-41e2-9fee-4af8274d0d2f`

**Current Assessment Profile**:
```
Target Populations: ["seniors"]
Ownership Model: ownership
Capital Available: 5k-15k
Timeline: within-year
Property Type: multi-family
```

---

## SQL Modifications for Testing

### Test Scenario 1: "Not Sure" User
```sql
-- MODIFY
UPDATE user_onboarding SET
  target_populations = '["not-sure"]'::jsonb,
  ownership_model = 'not-sure'
WHERE user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';

-- RESTORE
UPDATE user_onboarding SET
  target_populations = '["seniors"]'::jsonb,
  ownership_model = 'ownership'
WHERE user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';
```
**Expected Result**: 343 tactics visible (100%, no filtering)

---

### Test Scenario 2: Specific Ownership Strategy
**No modification needed** - current user profile already matches this scenario!

**Expected Result**: < 343 tactics (filtered by ownership model)

---

### Test Scenario 3: Low Budget
```sql
-- MODIFY
UPDATE user_onboarding SET
  capital_available = 'less-5k'
WHERE user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';

-- RESTORE
UPDATE user_onboarding SET
  capital_available = '5k-15k'
WHERE user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';
```
**Expected Result**: < 343 tactics (filtered by capital)

---

### Test Scenario 4: Legacy Assessment
```sql
-- MODIFY
UPDATE user_onboarding SET
  ownership_model = NULL
WHERE user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';

-- RESTORE
UPDATE user_onboarding SET
  ownership_model = 'ownership'
WHERE user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';
```
**Expected Result**: 343 tactics visible (100%, backward compatibility)

---

### Test Scenario 5: Mixed Filters
**No modification needed** - current user profile already matches this scenario!

**Expected Result**: < 343 tactics (cumulative filtering by all criteria)

---

## Testing Protocol

1. **Run SQL modification** for the scenario you want to test
2. **Clear browser cache** (Cmd+Shift+Delete on Mac)
3. **Log out and log back in** as kes@purposewaze.com
4. **Navigate to Content Library**
5. **Open browser console** (Cmd+Option+I)
6. **Look for filter debug logs**
7. **Count tactics displayed**
8. **Take screenshots** (library page + console)
9. **Run SQL restore** command immediately after testing
10. **Repeat steps 2-4** to verify restoration

---

## Tactic Count Reference

- **Total tactics in database**: 343
- **"Not sure" users**: 343 (100%)
- **Ownership strategy users**: ~150-200 (estimated)
- **Rental arbitrage users**: ~100-150 (estimated)
- **Low budget users**: ~80-120 (estimated)
- **Mixed filters**: ~50-100 (estimated)

*(Exact counts will vary based on actual tactic metadata)*

---

## Console Log Patterns to Look For

✅ **Good Signs**:
```
"User assessment profile loaded"
"Personalization Filter Applied"
"Tactics shown: X of 343 (Y%)"
```

❌ **Warning Signs**:
```
"Error loading assessment"
"No tactics found"
JavaScript errors or warnings
```

---

## Quick Commands

### Check current state
```sql
SELECT target_populations, ownership_model, capital_available
FROM user_onboarding
WHERE user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';
```

### Create backup before testing
```sql
CREATE TABLE IF NOT EXISTS user_onboarding_backup AS
SELECT * FROM user_onboarding
WHERE user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';
```

### Verify backup exists
```sql
SELECT COUNT(*) FROM user_onboarding_backup;
```

### Full restore from backup
```sql
UPDATE user_onboarding
SET
  target_populations = (SELECT target_populations FROM user_onboarding_backup LIMIT 1),
  ownership_model = (SELECT ownership_model FROM user_onboarding_backup LIMIT 1),
  capital_available = (SELECT capital_available FROM user_onboarding_backup LIMIT 1)
WHERE user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';
```

---

## Rerun Analysis Script

To check for new test users or verify current state:

```bash
cd "/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy"
node final-test-report.js
```

---

## Test Checklist

- [ ] Scenario 1: "Not sure" → 343 tactics
- [ ] Scenario 2: Ownership strategy → < 343 tactics
- [ ] Scenario 3: Low budget → < 343 tactics
- [ ] Scenario 4: Legacy user → 343 tactics
- [ ] Scenario 5: Mixed filters → < 343 tactics
- [ ] All console logs captured
- [ ] All screenshots taken
- [ ] Original state restored
- [ ] Backup table cleaned up

---

**Status**: Ready for validation testing
**Estimated Time**: 1-2 hours for all 5 scenarios
