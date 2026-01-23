# Session 2: Coding Agent - FEAT-GH-015 Execution Prompt

## MISSION: Execute World-Class UX Consolidation in YOLO Mode

You are the **Coding Agent** executing **FEAT-GH-015: World-Class UX Consolidation - Unified Compliance Experience**.

Session 1 (Initializer Agent) has completed all planning. Your job: **EXECUTE ALL 15 TASKS** following the session plan.

---

## 🚀 QUICK START (Copy/Paste This)

```bash
# 1. Navigate to project directory
cd "/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy"

# 2. Read your execution plan
cat harness/state/session-plan.json

# 3. Read feature details
cat harness/state/feature_list.json

# 4. Start with Phase 1, Task A
# Begin coding!
```

---

## 📋 EXECUTION PLAN OVERVIEW

**Total Tasks**: 15 (FEAT-GH-015-A through O)
**Estimated Time**: 6.5 hours
**Execution Steps**: 12 (some steps bundle multiple tasks)
**Your Agent**: @senior-react-developer (primary), qa-data-validator (validation)
**Mode**: YOLO (execute fast, verify with QA agent)

---

## 🔥 CRITICAL PRESERVATION REQUIREMENTS (READ THIS FIRST)

### ⛔ DO NOT MODIFY THESE FILES (ABORT IF YOU DO):

```
src/components/compliance/library/FullBinderReader.tsx
src/components/compliance/ComplianceSearch.tsx
```

**Why?** These components are world-class UX already built:
- FullBinderReader.tsx: Table of Contents sidebar with click-to-scroll navigation, continuous scrollable document
- ComplianceSearch.tsx: Google-style keyword search with instant results, Save to Binder action

**Your Task**: INTEGRATE with these components, NOT replace them.

---

## 📂 FILE PATHS YOU NEED

### Files You Will Read (For Context):
```
/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/harness/state/session-plan.json
/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/harness/state/feature_list.json
/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/CLAUDE.md
/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/Context/LOVABLE-STANDARDS.md
/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/Context/AGENT-LOVABLE-DEVELOPER.md

# READ ONLY (DO NOT MODIFY):
/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/src/components/compliance/library/FullBinderReader.tsx
/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/src/components/compliance/ComplianceSearch.tsx
```

### Files You Will Modify:
```
# Phase 1-2:
src/pages/ComplianceHubPage.tsx (Tasks A, B, C, E)

# Phase 3:
src/components/compliance/binder/ComplianceBinder.tsx (Tasks F, H, I)

# Phase 4:
src/pages/ResourcesPage.tsx (Task J)

# Phase 5:
src/pages/PropertyDetailPage.tsx (Tasks K, M)
```

### Files You Will Create:
```
# Phase 2:
src/components/compliance/research/ComplianceResearch.tsx (Task D)

# Phase 3:
src/components/compliance/binder/ShareBinderDialog.tsx (Task G)

# Phase 5:
src/components/property/PropertyComplianceTab.tsx (Task L)
```

### Existing Services/Components You Will Use (DO NOT MODIFY):
```
src/services/shareLinksService.ts (for Share feature)
src/components/compliance/binder/ExportBinderModal.tsx (for Export feature)
src/components/compliance/DocumentVault.tsx (for My Documents)
src/components/compliance/library/StateBinderSelector.tsx (for state selection)
```

---

## 🎯 12-STEP EXECUTION ORDER (FOLLOW THIS EXACTLY)

### **STEP 1: Phase 1 - Tab Structure Changes** ⏱️ 45 min
**Tasks**: FEAT-GH-015-A, B, C
**File**: `src/pages/ComplianceHubPage.tsx`
**Sequential**: Must run A→B→C in order

**What to do**:
1. **Task A**: Change tab type from 6 tabs to 5 tabs
   - OLD: `type HubTab = 'overview' | 'search' | 'binder' | 'library' | 'assessment' | 'compare'`
   - NEW: `type HubTab = 'overview' | 'research' | 'my-binder' | 'assessment' | 'compare'`

2. **Task B**: Update tab labels and icons
   - Remove "Search" and "Library" tabs
   - Add "Research" tab (combines both)
   - Rename "Binder" to "My Binder"
   - Keep Overview, Assessment, Compare unchanged

3. **Task C**: Add URL redirect handling
   - `/compliance?tab=binder` → `/compliance?tab=my-binder`
   - `/compliance?tab=library` → `/compliance?tab=research`
   - `/compliance?tab=search` → `/compliance?tab=research`

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 2: Phase 2A - Research Component Creation** ⏱️ 40 min
**Tasks**: FEAT-GH-015-D
**File**: `src/components/compliance/research/ComplianceResearch.tsx` (CREATE)
**Can run PARALLEL with Steps 4-5** (Group 1)

**What to do**:
1. Create new directory: `src/components/compliance/research/`
2. Create `ComplianceResearch.tsx` component
3. Import (DO NOT MODIFY):
   - `ComplianceSearch` from `@/components/compliance/ComplianceSearch`
   - `FullBinderReader` from `@/components/compliance/library/FullBinderReader`
   - `StateBinderSelector` from `@/components/compliance/library/StateBinderSelector`
4. Component structure:
   - Prominent search bar at top (using ComplianceSearch)
   - State selector for browsing (using StateBinderSelector)
   - Results show search matches OR full state binder (using FullBinderReader)
   - Tab switching between "Search Results" and "Browse State Library"

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 3: Phase 2B - Research Tab Wiring** ⏱️ 15 min
**Tasks**: FEAT-GH-015-E
**File**: `src/pages/ComplianceHubPage.tsx`
**Depends on**: Steps 1, 2

**What to do**:
1. Import `ComplianceResearch` component
2. Wire it into the "research" tab content
3. Ensure tab switching works correctly

**Verify**:
```bash
npx tsc --noEmit  # Must pass
# Navigate to /compliance?tab=research and verify it displays
```

---

### **STEP 4: Phase 3A - Share Button Integration** ⏱️ 30 min
**Tasks**: FEAT-GH-015-F
**File**: `src/components/compliance/binder/ComplianceBinder.tsx`
**Can run PARALLEL with Steps 2, 5** (Group 1)

**What to do**:
1. Import `createShareLink` from `@/services/shareLinksService`
2. Add Share button next to existing Export PDF button
3. Add state for share dialog: `const [showShareDialog, setShowShareDialog] = useState(false)`
4. Button onClick opens share dialog
5. Don't create the dialog yet (that's Step 5), just add the button and state

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 5: Phase 3B - Share Dialog Component** ⏱️ 35 min
**Tasks**: FEAT-GH-015-G
**File**: `src/components/compliance/binder/ShareBinderDialog.tsx` (CREATE)
**Can run PARALLEL with Steps 2, 4** (Group 1)

**What to do**:
1. Create `ShareBinderDialog.tsx` modal component
2. Props: `isOpen`, `onClose`, `binderId`
3. Use `createShareLink` from shareLinksService
4. Features:
   - Display generated share link with copy button
   - Expiration dropdown (7 days, 30 days, never)
   - Permissions checkboxes (view, download, print)
   - Generate button
   - Copy to clipboard functionality

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 6: Phase 3C - Export Modal Integration** ⏱️ 20 min
**Tasks**: FEAT-GH-015-H
**File**: `src/components/compliance/binder/ComplianceBinder.tsx`
**Depends on**: Step 4

**What to do**:
1. Import `ExportBinderModal` from `@/components/compliance/binder/ExportBinderModal`
2. Replace simple export button with full modal integration
3. Add state: `const [showExportModal, setShowExportModal] = useState(false)`
4. Wire Export button to open modal
5. Ensure modal can export binder as PDF with options

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 7: Phase 3D - My Documents Integration** ⏱️ 25 min
**Tasks**: FEAT-GH-015-I
**File**: `src/components/compliance/binder/ComplianceBinder.tsx`
**Depends on**: Step 6

**What to do**:
1. Import `DocumentVault` from `@/components/compliance/DocumentVault`
2. Add new `BinderSection` titled "My Documents"
3. Wire `DocumentVault` component with current binder ID
4. Position after other binder sections (regulations, checklists, etc.)
5. Pass binder context so documents are associated with this binder

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 8: Phase 4 - Resources Page Update** ⏱️ 25 min
**Tasks**: FEAT-GH-015-J
**File**: `src/pages/ResourcesPage.tsx`
**Can run PARALLEL with Steps 9-10** (Group 2)

**What to do**:
1. Add new tab "My Compliance Documents" alongside existing "Training Documents"
2. Show user's uploaded compliance documents from their binder
3. Add link to navigate to My Binder: `/compliance?tab=my-binder`
4. Display document list with upload capability

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 9: Phase 5A - Property Compliance Tab Creation** ⏱️ 20 min
**Tasks**: FEAT-GH-015-K
**File**: `src/pages/PropertyDetailPage.tsx`
**Can run PARALLEL with Steps 8, 10** (Group 2)

**What to do**:
1. Add 7th tab to PropertyDetailPage: "Compliance"
2. Tab config:
   - ID: `'compliance'`
   - Label: `'Compliance'`
   - Icon: `Shield` (from lucide-react)
3. Update tab type to include `'compliance'`
4. Position after existing 6 tabs

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 10: Phase 5B - Property Compliance Component** ⏱️ 30 min
**Tasks**: FEAT-GH-015-L
**File**: `src/components/property/PropertyComplianceTab.tsx` (CREATE)
**Can run PARALLEL with Steps 8-9** (Group 2)

**What to do**:
1. Create `PropertyComplianceTab.tsx` component
2. Props: `propertyId: string`, `stateCode: string`, `binderId?: string`
3. Features:
   - Display state-specific compliance info for property location
   - Link to user's full My Binder: `/compliance?tab=my-binder`
   - Show compliance checklist for this property
   - Highlight applicable state regulations

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 11: Phase 5C - Property Compliance Wiring** ⏱️ 15 min
**Tasks**: FEAT-GH-015-M
**File**: `src/pages/PropertyDetailPage.tsx`
**Depends on**: Steps 9, 10

**What to do**:
1. Import `PropertyComplianceTab` component
2. Wire it into the "compliance" tab content
3. Pass propertyId, stateCode, binderId props from property data
4. Ensure tab switching works correctly

**Verify**:
```bash
npx tsc --noEmit  # Must pass
```

---

### **STEP 12: Phase 6 - Visual Validation & Flow Testing** ⏱️ 60 min
**Tasks**: FEAT-GH-015-N, O
**Agent**: qa-data-validator (you delegate to this agent)
**Depends on**: All previous steps complete

**What to do**:

#### 12A: Screenshot Validation (Task N)

Use **Playwright MCP** to capture screenshots at 3 breakpoints:

**Test Credentials**:
- URL: `https://grouphome4newbies.com` or staging URL
- Email: `kes@purposewaze.com`
- Password: `Watergu2@`

**If Playwright MCP has issues with Chrome, use Cursor's built-in web browser feature instead.**

**Screenshots to capture**:

1. **Compliance Hub - Research Tab**:
   ```
   Navigate to: /compliance?tab=research
   Breakpoints: 375px, 768px, 1440px
   Verify: Search bar prominent, state selector visible
   ```

2. **Compliance Hub - My Binder Tab**:
   ```
   Navigate to: /compliance?tab=my-binder
   Breakpoints: 375px, 768px, 1440px
   Verify: Share button, Export button, My Documents section visible
   ```

3. **Resources Page - My Compliance Documents**:
   ```
   Navigate to: /resources
   Breakpoints: 375px, 768px, 1440px
   Verify: New tab displays, link to My Binder works
   ```

4. **Property Detail - Compliance Tab**:
   ```
   Navigate to: /property/:id (use any property)
   Breakpoints: 375px, 768px, 1440px
   Verify: Compliance tab exists (7th tab), Shield icon visible
   ```

**Playwright MCP Commands**:
```javascript
// Navigate and login
browser_navigate({ url: "https://grouphome4newbies.com/login" })
browser_type({ element: "Email input", text: "kes@purposewaze.com" })
browser_type({ element: "Password input", text: "Watergu2@" })
browser_click({ element: "Sign in button" })

// Take screenshots
browser_navigate({ url: "https://grouphome4newbies.com/compliance?tab=research" })
browser_resize({ width: 375, height: 812 })  // Mobile
browser_take_screenshot({ filename: "research-mobile.png" })
browser_resize({ width: 768, height: 1024 })  // Tablet
browser_take_screenshot({ filename: "research-tablet.png" })
browser_resize({ width: 1440, height: 900 })  // Desktop
browser_take_screenshot({ filename: "research-desktop.png" })

// Repeat for other pages...
```

#### 12B: User Flow Testing (Task O)

**Test these 7 critical flows**:

1. **Search → Save to Binder → View in My Binder**:
   - Navigate to Research tab
   - Search for "inspection requirements"
   - Click "Save to Binder" on result
   - Navigate to My Binder tab
   - Verify item appears in binder

2. **State Selector → Full Binder Reader with TOC click-scroll**:
   - Navigate to Research tab
   - Select state from dropdown (e.g., California)
   - Click "View Full State Binder"
   - Verify FullBinderReader displays with TOC sidebar
   - Click TOC item, verify page scrolls to section

3. **My Binder → Share → Generate Link**:
   - Navigate to My Binder tab
   - Click Share button
   - Set expiration: 30 days
   - Set permissions: view, download
   - Click Generate
   - Verify link displays, copy button works

4. **My Binder → Export PDF**:
   - Navigate to My Binder tab
   - Click Export button
   - Verify ExportBinderModal opens
   - Select options (cover page, TOC, etc.)
   - Click Export
   - Verify PDF downloads

5. **My Binder → My Documents → Upload File**:
   - Navigate to My Binder tab
   - Scroll to "My Documents" section
   - Click Upload button
   - Select test file
   - Verify file appears in document list

6. **Resources → My Compliance Documents Tab**:
   - Navigate to Resources page
   - Click "My Compliance Documents" tab
   - Verify user's documents display
   - Click "View in My Binder" link
   - Verify redirects to /compliance?tab=my-binder

7. **Property → Compliance Tab → Link to My Binder**:
   - Navigate to any property detail page
   - Click "Compliance" tab (7th tab)
   - Verify state-specific info displays
   - Click "View Full My Binder" link
   - Verify redirects to /compliance?tab=my-binder

**Record results**:
```
Flow 1 (Search to Binder): ✅ PASS / ❌ FAIL
Flow 2 (State Selector): ✅ PASS / ❌ FAIL
Flow 3 (Share Link): ✅ PASS / ❌ FAIL
Flow 4 (Export PDF): ✅ PASS / ❌ FAIL
Flow 5 (Upload Document): ✅ PASS / ❌ FAIL
Flow 6 (Resources Tab): ✅ PASS / ❌ FAIL
Flow 7 (Property Compliance): ✅ PASS / ❌ FAIL
```

**Verify**:
```bash
# All flows pass
# All screenshots captured
# No console errors in browser
npx tsc --noEmit  # Final TypeScript check
```

---

## 🎨 PARALLEL EXECUTION OPPORTUNITIES (2x SPEEDUP)

You can execute these steps **simultaneously** for faster completion:

### **Group 1** (Phase 2-3 Components):
- **STEP 2** (ComplianceResearch.tsx)
- **STEP 4** (Share button)
- **STEP 5** (ShareDialog.tsx)

**Time Saved**: 120 min sequential → 60 min parallel = **60 minutes saved**

### **Group 2** (Phase 4-5 Pages):
- **STEP 8** (Resources tab)
- **STEP 9** (Property tab)
- **STEP 10** (PropertyComplianceTab.tsx)

**Time Saved**: 75 min sequential → 40 min parallel = **35 minutes saved**

**Total Time Saved with Parallelization**: **95 minutes (1.6 hours)**

---

## ✅ VERIFICATION CHECKLIST (After Each Step)

```
After EVERY step:
[ ] TypeScript compiles: npx tsc --noEmit
[ ] No console errors in browser
[ ] Component renders without crashes
[ ] Task marked complete in feature_list.json

After each PHASE:
[ ] Phase checkpoint screenshot captured
[ ] Phase success criteria met
[ ] Progress file updated

After STEP 12 (Final):
[ ] All 7 user flows tested and passing
[ ] All screenshots captured (3 breakpoints × 4 pages = 12 screenshots)
[ ] TypeScript compile: 0 errors
[ ] Console errors: 0 errors
[ ] FullBinderReader.tsx NOT modified (preservation check)
[ ] ComplianceSearch.tsx NOT modified (preservation check)
```

---

## 🛑 STOP CONDITIONS (ABORT IF TRIGGERED)

### **ABORT Immediately**:
- ✋ FullBinderReader.tsx or ComplianceSearch.tsx is modified

### **STOP and Fix Before Proceeding**:
- ⚠️ TypeScript errors occur
- ⚠️ Console errors detected
- ⚠️ Component fails to render

### **WAIT for User**:
- 🤚 Ready to git push (ask for approval first)

---

## 🔑 TEST CREDENTIALS

**Application URL**:
- Production: `https://grouphome4newbies.com`
- Staging: `https://staging.grouphome4newbies.com` (if available)

**Login Credentials**:
- Email: `kes@purposewaze.com`
- Password: `Watergu2@`

**Playwright MCP**: Use these credentials for automated testing
**Cursor Web Browser**: Use these credentials if Playwright has Chrome issues

---

## 📊 SUCCESS CRITERIA (How You Know You're Done)

### **UX Metrics Achieved**:
- ✅ Tabs to find Binder: **1 click** (was 2)
- ✅ Clicks to Share: **2 clicks** (was hidden)
- ✅ Clicks to Export: **2 clicks** (was 4+)
- ✅ Document upload location: **My Binder → My Documents** (intuitive)
- ✅ Property compliance: **Compliance tab** (contextual access)

### **Technical Validation Passed**:
- ✅ TypeScript compile: **0 errors**
- ✅ Console errors: **0 errors**
- ✅ Visual validation: **12 screenshots captured** (3 breakpoints × 4 pages)
- ✅ User flows: **All 7 flows tested and working**

### **Preservation Verified**:
- ✅ FullBinderReader.tsx **NOT modified**
- ✅ ComplianceSearch.tsx **NOT modified**
- ✅ Table of Contents click-to-scroll **still works**
- ✅ Google-style search experience **still works**
- ✅ Save to Binder action **still works**

---

## 📝 PROGRESS TRACKING

After **each task**, update `feature_list.json`:
```json
{
  "task_id": "FEAT-GH-015-A",
  "passes": true  // Change from false to true
}
```

After **each phase**, update `claude-progress.txt`:
```
### Phase 1 Complete ✅
- Tasks A, B, C completed
- TypeScript: PASS
- Screenshots: Captured
- Next: Phase 2
```

---

## 🚨 KNOWN RISKS & MITIGATIONS

### **Risk 1**: ComplianceHubPage.tsx modified by 4 tasks (A, B, C, E)
**Mitigation**: Strict sequential execution A→B→C→E, verify TypeScript after each

### **Risk 2**: Research tab must combine 2 complex components
**Mitigation**: Task D (Step 2) explicitly preserves both components unchanged, only creates container

### **Risk 3**: ComplianceBinder.tsx modified by 3 tasks (F, H, I)
**Mitigation**: Sequential execution F→H→I, verify after each task

---

## 🎯 YOUR YOLO MODE WORKFLOW

```bash
# PHASE 1: Tab Structure (45 min)
# Execute Step 1 (Tasks A, B, C)
# Verify TypeScript
# Checkpoint screenshot

# PHASE 2-3: Components (PARALLEL - 60 min)
# Execute Steps 2, 4, 5 simultaneously
# Verify each independently
# Execute Step 3 (wiring)
# Checkpoint screenshot

# PHASE 3 CONTINUED: Binder Features (45 min)
# Execute Steps 6, 7 sequentially
# Verify after each
# Checkpoint screenshot

# PHASE 4-5: Pages (PARALLEL - 40 min)
# Execute Steps 8, 9, 10 simultaneously
# Verify each independently
# Execute Step 11 (wiring)
# Checkpoint screenshot

# PHASE 6: Validation (60 min)
# Execute Step 12 (delegate to qa-data-validator)
# Capture all screenshots
# Test all 7 user flows
# Final verification
```

---

## 🏁 COMPLETION HANDOFF

When all 15 tasks are complete:

1. **Update feature_list.json**:
   ```json
   {
     "feature_id": "FEAT-GH-015",
     "status": "completed",
     "verification": {
       "typescript_compile": "passed",
       "console_errors": "passed",
       "visual_validation": "passed",
       "user_flow_testing": "passed"
     }
   }
   ```

2. **Update claude-progress.txt**:
   ```
   ## Session 3: Coding Agent - FEAT-GH-015 ✅ COMPLETE

   **Completed**: 2026-01-22
   **Status**: All 15 tasks executed, all tests passing
   **Time**: 6.5 hours (4.9 hours with parallelization)

   ### All Phases Complete:
   - Phase 1: Tab Structure ✅
   - Phase 2: Research Tab ✅
   - Phase 3: My Binder Features ✅
   - Phase 4: Resources Page ✅
   - Phase 5: Property Page ✅
   - Phase 6: Validation ✅

   ### Success Criteria Met:
   - UX metrics: All achieved
   - Technical validation: All passed
   - Preservation: Verified (FullBinderReader, ComplianceSearch unchanged)
   ```

3. **Ask user for git push approval**:
   ```
   FEAT-GH-015 complete! All 15 tasks executed, all tests passing.

   Files modified:
   - src/pages/ComplianceHubPage.tsx
   - src/components/compliance/binder/ComplianceBinder.tsx
   - src/pages/ResourcesPage.tsx
   - src/pages/PropertyDetailPage.tsx

   Files created:
   - src/components/compliance/research/ComplianceResearch.tsx
   - src/components/compliance/binder/ShareBinderDialog.tsx
   - src/components/property/PropertyComplianceTab.tsx

   Preservation verified:
   - FullBinderReader.tsx: NOT modified ✅
   - ComplianceSearch.tsx: NOT modified ✅

   Ready to push to GitHub?
   ```

---

## 🎉 YOU GOT THIS!

You have everything you need:
- ✅ 12-step execution plan
- ✅ All file paths
- ✅ Parallel execution opportunities (95 min saved)
- ✅ Test credentials
- ✅ Verification checklist
- ✅ Stop conditions
- ✅ Risk mitigations

**Session 1 (Initializer) did all the planning. Now you execute.**

**Mode**: YOLO (fast execution, verify with QA)
**Duration**: 6.5 hours (4.9 with parallelization)
**Outcome**: World-class UX consolidation shipped to production

**LET'S GO! 🚀**
