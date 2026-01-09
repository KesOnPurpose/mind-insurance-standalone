// Protocol Import Service
// CSV and Google Doc/Sheets parsing for coach protocols

import type {
  ParsedProtocolData,
  ParsedProtocolWeek,
  ParsedProtocolDay,
  ParsedProtocolTask,
  CSVProtocolRow,
  ImportValidationResult,
  ImportValidationError,
  ImportValidationWarning,
  CoachTaskType,
  TaskTimeOfDay,
} from '@/types/coach-protocol';

// =============================================
// CONSTANTS
// =============================================

const VALID_TASK_TYPES: CoachTaskType[] = [
  'action',
  'reflection',
  'reading',
  'video',
  'worksheet',
  'voice_recording',
];

const VALID_TIME_OF_DAY: TaskTimeOfDay[] = ['morning', 'throughout', 'evening'];

const MAX_WEEKS = 52;
const MAX_INSTRUCTION_LENGTH = 2000;
const MAX_TITLE_LENGTH = 255;

// =============================================
// CSV PARSING
// =============================================

/**
 * Generate CSV template for download
 */
export function generateCSVTemplate(): string {
  const headers = [
    'week',
    'day',
    'time_of_day',
    'task_type',
    'title',
    'instructions',
    'duration_minutes',
    'resource_url',
    'success_criteria',
    'week_theme',
  ];

  const exampleRows = [
    '1,1,morning,reflection,Morning Intention,"Set your identity intention for today. Write down one thing you want to accomplish.",5,,Complete intention statement|Read aloud,Foundation Week',
    '1,1,throughout,action,Pattern Notice,"Throughout the day, notice when you feel resistance to your intention. Document at least 3 moments.",0,,,',
    '1,1,evening,worksheet,Evening Review,"Before bed, review your intention. Did you achieve it? What got in the way?",10,https://example.com/worksheet.pdf,Completed review|Identified blockers,',
    '1,2,morning,reading,Understanding Patterns,"Read Chapter 1 of the mindset workbook. Take notes on key concepts.",15,https://example.com/chapter1.pdf,Read entire chapter|Took notes,',
  ];

  return [headers.join(','), ...exampleRows].join('\n');
}

/**
 * Parse CSV file content into protocol data
 */
export function parseCSV(content: string): ParsedProtocolData {
  const lines = content.trim().split('\n');
  const validation = validateCSVStructure(lines);

  if (!validation.is_valid) {
    return {
      title: '',
      weeks: [],
      total_weeks: 0,
      total_days: 0,
      total_tasks: 0,
      validation_warnings: validation.warnings.map((w) => w.message),
      validation_errors: validation.errors.map((e) => e.message),
      is_valid: false,
    };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Parse data rows
  const rows: CSVProtocolRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    const row: CSVProtocolRow = {
      week: getValue(values, headers, 'week'),
      day: getValue(values, headers, 'day'),
      time_of_day: getValue(values, headers, 'time_of_day'),
      task_type: getValue(values, headers, 'task_type'),
      title: getValue(values, headers, 'title'),
      instructions: getValue(values, headers, 'instructions'),
      duration_minutes: getValue(values, headers, 'duration_minutes'),
      resource_url: getValue(values, headers, 'resource_url'),
      success_criteria: getValue(values, headers, 'success_criteria'),
      week_theme: getValue(values, headers, 'week_theme'),
    };
    rows.push(row);
  }

  // Convert to structured data
  return convertRowsToProtocolData(rows, validation.warnings);
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Get value from row by header name
 */
function getValue(values: string[], headers: string[], header: string): string {
  const index = headers.indexOf(header);
  return index >= 0 && index < values.length ? values[index] : '';
}

/**
 * Validate CSV structure
 */
function validateCSVStructure(lines: string[]): ImportValidationResult {
  const errors: ImportValidationError[] = [];
  const warnings: ImportValidationWarning[] = [];

  if (lines.length < 2) {
    errors.push({
      field: 'file',
      message: 'CSV must have a header row and at least one data row',
    });
    return { is_valid: false, errors, warnings };
  }

  // Validate headers
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const requiredHeaders = ['week', 'day', 'time_of_day', 'task_type', 'title', 'instructions'];

  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      errors.push({
        field: required,
        message: `Missing required column: ${required}`,
      });
    }
  }

  // Validate data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every((v) => !v.trim())) continue; // Skip empty rows

    const week = getValue(values, headers, 'week');
    const day = getValue(values, headers, 'day');
    const timeOfDay = getValue(values, headers, 'time_of_day');
    const taskType = getValue(values, headers, 'task_type');
    const title = getValue(values, headers, 'title');
    const instructions = getValue(values, headers, 'instructions');

    // Validate week
    const weekNum = parseInt(week, 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > MAX_WEEKS) {
      errors.push({
        row: i + 1,
        field: 'week',
        message: `Invalid week number: ${week}. Must be 1-${MAX_WEEKS}`,
      });
    }

    // Validate day
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
      errors.push({
        row: i + 1,
        field: 'day',
        message: `Invalid day number: ${day}. Must be 1-7`,
      });
    }

    // Validate time_of_day
    if (!VALID_TIME_OF_DAY.includes(timeOfDay as TaskTimeOfDay)) {
      errors.push({
        row: i + 1,
        field: 'time_of_day',
        message: `Invalid time_of_day: ${timeOfDay}. Must be one of: ${VALID_TIME_OF_DAY.join(', ')}`,
      });
    }

    // Validate task_type
    if (!VALID_TASK_TYPES.includes(taskType as CoachTaskType)) {
      errors.push({
        row: i + 1,
        field: 'task_type',
        message: `Invalid task_type: ${taskType}. Must be one of: ${VALID_TASK_TYPES.join(', ')}`,
      });
    }

    // Validate title
    if (!title.trim()) {
      errors.push({
        row: i + 1,
        field: 'title',
        message: 'Title is required',
      });
    } else if (title.length > MAX_TITLE_LENGTH) {
      warnings.push({
        row: i + 1,
        field: 'title',
        message: `Title exceeds ${MAX_TITLE_LENGTH} characters and will be truncated`,
      });
    }

    // Validate instructions
    if (!instructions.trim()) {
      errors.push({
        row: i + 1,
        field: 'instructions',
        message: 'Instructions are required',
      });
    } else if (instructions.length > MAX_INSTRUCTION_LENGTH) {
      warnings.push({
        row: i + 1,
        field: 'instructions',
        message: `Instructions exceed ${MAX_INSTRUCTION_LENGTH} characters and will be truncated`,
      });
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert parsed CSV rows to protocol data structure
 */
function convertRowsToProtocolData(
  rows: CSVProtocolRow[],
  warnings: ImportValidationWarning[]
): ParsedProtocolData {
  const weeksMap = new Map<number, Map<number, ParsedProtocolTask[]>>();
  const weekThemes = new Map<number, string>();

  let taskOrder = 1;

  for (const row of rows) {
    const weekNum = parseInt(row.week, 10);
    const dayNum = parseInt(row.day, 10);

    if (!weeksMap.has(weekNum)) {
      weeksMap.set(weekNum, new Map());
    }

    if (!weeksMap.get(weekNum)!.has(dayNum)) {
      weeksMap.get(weekNum)!.set(dayNum, []);
      taskOrder = 1;
    }

    // Track week theme
    if (row.week_theme && !weekThemes.has(weekNum)) {
      weekThemes.set(weekNum, row.week_theme);
    }

    const task: ParsedProtocolTask = {
      week_number: weekNum,
      day_number: dayNum,
      task_order: taskOrder++,
      title: row.title.substring(0, MAX_TITLE_LENGTH),
      instructions: row.instructions.substring(0, MAX_INSTRUCTION_LENGTH),
      task_type: row.task_type as CoachTaskType,
      time_of_day: row.time_of_day as TaskTimeOfDay,
      estimated_minutes: row.duration_minutes
        ? parseInt(row.duration_minutes, 10) || undefined
        : undefined,
      resource_url: row.resource_url || undefined,
      success_criteria: row.success_criteria
        ? row.success_criteria.split('|').map((s) => s.trim())
        : undefined,
      week_theme: row.week_theme || undefined,
    };

    weeksMap.get(weekNum)!.get(dayNum)!.push(task);
  }

  // Convert to array structure
  const weeks: ParsedProtocolWeek[] = [];
  const sortedWeekNums = Array.from(weeksMap.keys()).sort((a, b) => a - b);

  let totalTasks = 0;
  let totalDays = 0;

  for (const weekNum of sortedWeekNums) {
    const daysMap = weeksMap.get(weekNum)!;
    const days: ParsedProtocolDay[] = [];
    const sortedDayNums = Array.from(daysMap.keys()).sort((a, b) => a - b);

    for (const dayNum of sortedDayNums) {
      const tasks = daysMap.get(dayNum)!;
      days.push({
        day_number: dayNum,
        tasks,
      });
      totalTasks += tasks.length;
      totalDays++;
    }

    weeks.push({
      week_number: weekNum,
      theme: weekThemes.get(weekNum),
      days,
    });
  }

  return {
    title: '', // Will be set by user
    weeks,
    total_weeks: weeks.length,
    total_days: totalDays,
    total_tasks: totalTasks,
    validation_warnings: warnings.map((w) => w.message),
    validation_errors: [],
    is_valid: true,
  };
}

// =============================================
// GOOGLE DOC PARSING
// =============================================

/**
 * Generate Google Doc template content
 */
export function generateGoogleDocTemplate(): string {
  return `# Protocol Title

## Description
Optional description of the protocol and its goals.

---

## Week 1: Foundation

### Day 1

**Morning (5 min) - Reflection**
Morning Intention
Set your identity intention for today. Write down one thing you want to accomplish.

**Throughout Day - Action**
Pattern Notice
Throughout the day, notice when you feel resistance to your intention. Document at least 3 moments.

**Evening (10 min) - Worksheet**
Evening Review
Before bed, review your intention. Did you achieve it? What got in the way?
Resource: https://example.com/worksheet.pdf

### Day 2

**Morning (15 min) - Reading**
Understanding Patterns
Read Chapter 1 of the mindset workbook. Take notes on key concepts.
Resource: https://example.com/chapter1.pdf

**Throughout Day - Action**
Apply Learning
Practice one concept from your reading during a conversation today.

**Evening (5 min) - Reflection**
Integration Review
Reflect on how you applied today's learning. What worked? What was challenging?

---

## Week 2: Building Momentum

### Day 1
[Continue with the same format...]
`;
}

/**
 * Parse Google Doc content into protocol data
 */
export function parseGoogleDoc(content: string): ParsedProtocolData {
  const lines = content.split('\n');
  const warnings: string[] = [];
  const errors: string[] = [];

  let title = '';
  let description = '';
  const weeks: ParsedProtocolWeek[] = [];

  let currentWeek: ParsedProtocolWeek | null = null;
  let currentDay: ParsedProtocolDay | null = null;
  let currentTask: Partial<ParsedProtocolTask> | null = null;
  let instructionBuffer: string[] = [];
  let taskOrder = 1;

  const flushTask = () => {
    if (currentTask && currentDay) {
      currentTask.instructions = instructionBuffer.join('\n').trim();
      if (currentTask.title && currentTask.instructions) {
        currentDay.tasks.push(currentTask as ParsedProtocolTask);
      }
    }
    currentTask = null;
    instructionBuffer = [];
  };

  const flushDay = () => {
    flushTask();
    if (currentDay && currentWeek) {
      if (currentDay.tasks.length > 0) {
        currentWeek.days.push(currentDay);
      }
    }
    currentDay = null;
    taskOrder = 1;
  };

  const flushWeek = () => {
    flushDay();
    if (currentWeek) {
      if (currentWeek.days.length > 0) {
        weeks.push(currentWeek);
      }
    }
    currentWeek = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines and separators
    if (!trimmedLine || trimmedLine === '---') {
      continue;
    }

    // Parse title: # Protocol Title
    if (trimmedLine.startsWith('# ') && !title) {
      title = trimmedLine.substring(2).trim();
      continue;
    }

    // Parse description header
    if (trimmedLine === '## Description') {
      // Collect description until next ##
      const descLines: string[] = [];
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('## ')) {
        i++;
        if (lines[i].trim() && lines[i].trim() !== '---') {
          descLines.push(lines[i].trim());
        }
      }
      description = descLines.join(' ').trim();
      continue;
    }

    // Parse week: ## Week N: Theme
    const weekMatch = trimmedLine.match(/^## Week (\d+)(?::\s*(.+))?$/i);
    if (weekMatch) {
      flushWeek();
      const weekNum = parseInt(weekMatch[1], 10);
      currentWeek = {
        week_number: weekNum,
        theme: weekMatch[2]?.trim(),
        days: [],
      };
      continue;
    }

    // Parse day: ### Day N
    const dayMatch = trimmedLine.match(/^### Day (\d+)$/i);
    if (dayMatch) {
      flushDay();
      const dayNum = parseInt(dayMatch[1], 10);
      currentDay = {
        day_number: dayNum,
        tasks: [],
      };
      continue;
    }

    // Parse task header: **TimeOfDay (Duration) - TaskType**
    const taskMatch = trimmedLine.match(
      /^\*\*(\w+)(?:\s+Day)?(?:\s*\((\d+)\s*min\))?\s*-\s*(\w+)\*\*$/i
    );
    if (taskMatch) {
      flushTask();

      const timeOfDayRaw = taskMatch[1].toLowerCase();
      const duration = taskMatch[2] ? parseInt(taskMatch[2], 10) : undefined;
      const taskTypeRaw = taskMatch[3].toLowerCase();

      // Map time of day
      let timeOfDay: TaskTimeOfDay = 'throughout';
      if (timeOfDayRaw === 'morning') timeOfDay = 'morning';
      else if (timeOfDayRaw === 'evening') timeOfDay = 'evening';
      else if (timeOfDayRaw === 'throughout') timeOfDay = 'throughout';

      // Map task type
      let taskType: CoachTaskType = 'action';
      if (VALID_TASK_TYPES.includes(taskTypeRaw as CoachTaskType)) {
        taskType = taskTypeRaw as CoachTaskType;
      } else if (taskTypeRaw === 'reflect') {
        taskType = 'reflection';
      } else if (taskTypeRaw === 'read') {
        taskType = 'reading';
      } else if (taskTypeRaw === 'watch') {
        taskType = 'video';
      }

      currentTask = {
        week_number: currentWeek?.week_number || 1,
        day_number: currentDay?.day_number || 1,
        task_order: taskOrder++,
        task_type: taskType,
        time_of_day: timeOfDay,
        estimated_minutes: duration,
        week_theme: currentWeek?.theme,
      };

      // Next line is the title
      if (i + 1 < lines.length) {
        i++;
        currentTask.title = lines[i].trim().substring(0, MAX_TITLE_LENGTH);
      }
      continue;
    }

    // Parse resource URL
    if (trimmedLine.toLowerCase().startsWith('resource:') && currentTask) {
      const url = trimmedLine.substring(9).trim();
      if (url && isValidUrl(url)) {
        currentTask.resource_url = url;
      }
      continue;
    }

    // Accumulate instruction text
    if (currentTask) {
      instructionBuffer.push(trimmedLine);
    }
  }

  // Flush remaining content
  flushWeek();

  // Calculate totals
  let totalTasks = 0;
  let totalDays = 0;
  for (const week of weeks) {
    for (const day of week.days) {
      totalTasks += day.tasks.length;
      totalDays++;
    }
  }

  // Validation
  if (!title) {
    errors.push('Missing protocol title. Add a line starting with "# " at the top.');
  }
  if (weeks.length === 0) {
    errors.push('No weeks found. Use "## Week 1: Theme" format.');
  }
  if (totalTasks === 0) {
    errors.push('No tasks found. Use "**Morning (5 min) - Action**" format.');
  }

  return {
    title,
    description,
    weeks,
    total_weeks: weeks.length,
    total_days: totalDays,
    total_tasks: totalTasks,
    validation_warnings: warnings,
    validation_errors: errors,
    is_valid: errors.length === 0,
  };
}

// =============================================
// GOOGLE SHEETS PARSING
// =============================================

/**
 * Parse Google Sheets data (2D array) into protocol data
 */
export function parseGoogleSheet(rows: string[][]): ParsedProtocolData {
  if (rows.length < 2) {
    return {
      title: '',
      weeks: [],
      total_weeks: 0,
      total_days: 0,
      total_tasks: 0,
      validation_warnings: [],
      validation_errors: ['Spreadsheet must have a header row and at least one data row'],
      is_valid: false,
    };
  }

  // Convert 2D array to CSV-like format
  const csvRows: CSVProtocolRow[] = [];
  const headers = rows[0].map((h) => h.toLowerCase().trim());

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((cell) => !cell || !cell.trim())) continue;

    csvRows.push({
      week: getSheetValue(row, headers, 'week'),
      day: getSheetValue(row, headers, 'day'),
      time_of_day: getSheetValue(row, headers, 'time_of_day'),
      task_type: getSheetValue(row, headers, 'task_type'),
      title: getSheetValue(row, headers, 'title'),
      instructions: getSheetValue(row, headers, 'instructions'),
      duration_minutes: getSheetValue(row, headers, 'duration_minutes'),
      resource_url: getSheetValue(row, headers, 'resource_url'),
      success_criteria: getSheetValue(row, headers, 'success_criteria'),
      week_theme: getSheetValue(row, headers, 'week_theme'),
    });
  }

  // Validate and convert
  const csvContent = [
    headers.join(','),
    ...csvRows.map((r) => Object.values(r).join(',')),
  ].join('\n');

  return parseCSV(csvContent);
}

function getSheetValue(row: string[], headers: string[], header: string): string {
  const index = headers.indexOf(header);
  return index >= 0 && index < row.length ? row[index] || '' : '';
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Check if a string is a valid URL
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Flatten parsed protocol data into task array for database insertion
 */
export function flattenParsedTasks(data: ParsedProtocolData): ParsedProtocolTask[] {
  const tasks: ParsedProtocolTask[] = [];

  for (const week of data.weeks) {
    for (const day of week.days) {
      for (const task of day.tasks) {
        tasks.push({
          ...task,
          week_theme: week.theme || task.week_theme,
        });
      }
    }
  }

  return tasks;
}

/**
 * Extract Google Doc/Sheet ID from URL
 */
export function extractGoogleId(url: string): { type: 'doc' | 'sheet'; id: string } | null {
  // Google Doc: https://docs.google.com/document/d/{ID}/edit
  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) {
    return { type: 'doc', id: docMatch[1] };
  }

  // Google Sheet: https://docs.google.com/spreadsheets/d/{ID}/edit
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch) {
    return { type: 'sheet', id: sheetMatch[1] };
  }

  return null;
}

/**
 * Validate parsed protocol data
 */
export function validateParsedData(data: ParsedProtocolData): ImportValidationResult {
  const errors: ImportValidationError[] = [];
  const warnings: ImportValidationWarning[] = [];

  if (!data.title) {
    errors.push({ field: 'title', message: 'Protocol title is required' });
  }

  if (data.total_weeks === 0) {
    errors.push({ field: 'weeks', message: 'At least one week is required' });
  }

  if (data.total_weeks > MAX_WEEKS) {
    errors.push({
      field: 'weeks',
      message: `Maximum ${MAX_WEEKS} weeks allowed`,
    });
  }

  if (data.total_tasks === 0) {
    errors.push({ field: 'tasks', message: 'At least one task is required' });
  }

  // Check for gaps in weeks
  const weekNumbers = data.weeks.map((w) => w.week_number);
  for (let i = 1; i <= data.total_weeks; i++) {
    if (!weekNumbers.includes(i)) {
      warnings.push({
        field: 'weeks',
        message: `Week ${i} is missing. Consider adding tasks for continuity.`,
      });
    }
  }

  // Check for gaps in days within weeks
  for (const week of data.weeks) {
    const dayNumbers = week.days.map((d) => d.day_number);
    for (let i = 1; i <= 7; i++) {
      if (!dayNumbers.includes(i) && dayNumbers.some((d) => d > i)) {
        warnings.push({
          field: 'days',
          message: `Week ${week.week_number}, Day ${i} is missing.`,
        });
      }
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}
