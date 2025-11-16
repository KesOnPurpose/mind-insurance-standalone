# Parallel Agent Execution Guide

**Purpose**: Maximize development speed through safe parallel execution
**Expected Speedup**: 2.0-2.5x compared to sequential execution
**Risk**: LOW when following these guidelines

---

## CORE PRINCIPLE

**Parallel execution achieves 2x+ speedup by running independent tasks simultaneously while maintaining safety through careful dependency management.**

---

## CURRENTLY AVAILABLE AGENTS

As of November 2025, Claude Code has these specialized agents:

1. **general-purpose** - Multi-step tasks, research, code search
2. **Explore** - Codebase exploration, file patterns, keyword search
3. **Plan** - Planning and exploration
4. **senior-react-developer** - React/TypeScript with visual validation
5. **mio-mind-insurance-oracle** - Behavioral analysis, pattern detection

**Note**: Additional agents (security-auditor, qa-validator, backend-architect, etc.) need to be configured as sub-agent types in the system.

---

## WHEN TO RUN AGENTS IN PARALLEL

### Safe to Parallelize (READ-ONLY Operations)

```
GREEN LIGHT - ALWAYS SAFE:
├─ Glob (file pattern matching)
├─ Grep (content search)
├─ Read (file viewing)
├─ WebSearch (research queries)
├─ WebFetch (documentation lookup)
├─ Exa search (semantic search)
├─ API GET requests
├─ Database SELECT queries
├─ Code analysis (static analysis)
├─ Screenshot capture
├─ Test execution (read-only)
└─ Documentation generation (reading phase)
```

### Must Run Sequentially (WRITE Operations)

```
RED LIGHT - ALWAYS SERIAL:
├─ Write (file creation)
├─ Edit (file modification)
├─ MultiEdit (batch file changes)
├─ Bash (system commands that modify state)
├─ API POST/PUT/DELETE
├─ Database INSERT/UPDATE/DELETE
├─ Git operations (add, commit, push)
├─ Deployment commands
├─ Package installation (npm install)
└─ Schema migrations
```

### Depends on Context (YELLOW LIGHT)

```
EVALUATE CASE-BY-CASE:
├─ Bash ls/pwd (read-only, can parallel)
├─ npm audit (read-only, can parallel)
├─ TypeScript check (read-only, can parallel)
├─ Test runners (usually safe to parallel)
├─ Linters (usually safe to parallel)
└─ Build commands (depends on state)
```

---

## PARALLEL EXECUTION PATTERNS

### Pattern 1: Research & Analysis Phase

**Scenario**: Starting a new feature
**Approach**: Launch multiple research tasks simultaneously

```markdown
## USER REQUEST: "Build user settings page with security"

## PARALLEL RESEARCH (Single message, multiple Task tool calls)

Launch simultaneously:

1. Task: "Research existing component patterns"
   - Agent: Explore (quick search)
   - Focus: src/components/, src/pages/

2. Task: "Research API structure"
   - Agent: Explore (quick search)
   - Focus: src/services/, database schema

3. Task: "Research security requirements"
   - Agent: general-purpose
   - Focus: Authentication, RLS policies

4. Task: "Research testing patterns"
   - Agent: Explore (quick search)
   - Focus: Existing test files, coverage

## SYNC POINT
Coordinator collects all results, identifies conflicts, creates implementation plan
```

### Pattern 2: Multi-Tool Parallel Execution

**Scenario**: Need multiple types of information simultaneously
**Approach**: Use multiple tools in single message

```markdown
## EXAMPLE: Gather context for bug fix

In a single response, call multiple tools:
- Grep: Search for error pattern
- Glob: Find related files
- Read: View configuration files
- WebSearch: Check for known issues

All execute in parallel, results returned together
```

### Pattern 3: Testing Phase

**Scenario**: Ready for comprehensive testing
**Approach**: Different test types can run in parallel

```markdown
## TESTING PARALLEL EXECUTION

Launch simultaneously:

1. Unit Tests
   - Bash: npm run test:unit

2. TypeScript Check
   - Bash: npx tsc --noEmit

3. Linting
   - Bash: npx eslint src/

4. Screenshot Validation
   - Playwright: Capture at mobile/tablet/desktop

## SYNC POINT
All test results aggregated, quality gates evaluated
```

---

## HOW TO INVOKE PARALLEL OPERATIONS

### Method 1: Multiple Tool Calls in Single Message

```
When you need multiple independent pieces of information:

<function_calls>
<invoke name="Grep">
  <parameter name="pattern">useAuth