# Harness Feature Tracking System

## Overview

The Harness system provides structured tracking for features, ensuring:
1. **Planning before execution** - Features are registered before work begins
2. **Task decomposition** - Complex features are broken into trackable tasks
3. **Status visibility** - Clear view of what's done and what remains
4. **Audit trail** - Documentation of changes for rollback if needed

## Directory Structure

```
harness/
├── README.md              # This file
├── state/
│   └── feature_list.json  # Master list of all features
└── plans/                 # (Optional) Detailed plan documents
```

## Feature Lifecycle

### 1. Registration (Before Work)
```json
{
  "id": "FEAT-XXX-001",
  "status": "pending",
  "tasks": [...]
}
```

### 2. In Progress
```json
{
  "status": "in_progress",
  "tasks": [
    { "task_id": "...", "status": "completed" },
    { "task_id": "...", "status": "in_progress" },
    { "task_id": "...", "status": "pending" }
  ]
}
```

### 3. Completed
```json
{
  "status": "completed",
  "completed_at": "2026-01-18T00:00:00Z",
  "verification": { "typescript_compile": "passed", ... }
}
```

## Feature Entry Schema

```json
{
  "id": "FEAT-{PROJECT}-{NUMBER}",
  "name": "Human readable name",
  "description": "What this feature accomplishes",
  "priority": "critical | high | medium | low",
  "status": "pending | in_progress | completed | blocked",
  "assigned_agent": "@agent-name or null",
  "created_at": "ISO timestamp",
  "completed_at": "ISO timestamp or null",
  "tasks": [
    {
      "task_id": "FEAT-XXX-001-A",
      "description": "Task description",
      "status": "pending | in_progress | completed",
      "files_affected": ["path/to/file.ts"],
      "changes": ["What was changed"],
      "notes": "Additional context"
    }
  ],
  "verification": {
    "typescript_compile": "passed | failed | pending",
    "tests_passed": "passed | failed | pending",
    "routes_tested": "passed | failed | pending_manual"
  },
  "rollback_instructions": "How to undo if needed"
}
```

## Naming Conventions

| Project | Prefix |
|---------|--------|
| Grouphome | `FEAT-GH-XXX` |
| Mind Insurance | `FEAT-MI-XXX` |
| ME Wealth | `FEAT-ME-XXX` |
| Shared/Infrastructure | `FEAT-INF-XXX` |

## Usage

### Before Starting Work
1. Create feature entry in `harness/state/feature_list.json`
2. Decompose into tasks with clear deliverables
3. Set status to `pending`

### During Work
1. Update task status as you progress
2. Document files affected and changes made
3. Update feature status to `in_progress`

### After Completion
1. Run verification checks (TypeScript, tests)
2. Document verification results
3. Update status to `completed`
4. Add `completed_at` timestamp

## Current Features

| ID | Name | Status |
|----|------|--------|
| FEAT-GH-001 | Grouphome Standalone Transformation | Completed |

## Benefits

- **Visibility**: Know exactly what was changed
- **Accountability**: Track who did what
- **Rollback**: Clear instructions if something breaks
- **Onboarding**: New developers can understand project history
- **Compliance**: Audit trail for enterprise requirements
