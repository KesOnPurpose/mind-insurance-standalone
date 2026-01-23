# Harness Feature Execution Initializer

## Instructions

When this prompt is executed, follow these steps:

### Step 1: Load Feature State
Read `harness/state/feature_list.json` to identify:
- Features with `status: "pending"` or `status: "in_progress"`
- Sort by priority: `critical` > `high` > `medium` > `low`

### Step 2: Select Feature to Execute
If multiple pending features exist, execute in priority order.
Display selected feature summary to user:
```
EXECUTING FEATURE: [id]
Name: [name]
Description: [description]
Tasks: [count] tasks
```

### Step 3: Execute Tasks Sequentially
For each task in the feature's `tasks` array:

1. **Update task status to `in_progress`** in feature_list.json
2. **Read the affected file(s)** listed in `files_affected`
3. **Make the required changes** listed in `changes_required`
4. **Verify the change** compiles (no TypeScript errors)
5. **Update task status to `completed`** in feature_list.json
6. **Move to next task**

### Step 4: Run Verification
After all tasks complete:
1. Run `npx tsc --noEmit` - TypeScript compilation
2. Run `npm run dev` - Start dev server, check for runtime errors
3. Update feature's `verification` object with results

### Step 5: Mark Feature Complete
If all verification passes:
1. Set feature `status: "completed"`
2. Set `completed_at` timestamp
3. Update metadata counts

### Task Status Flow
```
pending → in_progress → completed
```

### Feature Status Flow
```
pending → in_progress → completed (or blocked)
```

---

## Execution Protocol

**START NOW:**

1. Read `harness/state/feature_list.json`
2. Find first feature with `status: "pending"`
3. Begin executing tasks in order
4. Update feature_list.json after EACH task completion
5. Report progress to user after each task

**Do not ask for confirmation - execute immediately.**
