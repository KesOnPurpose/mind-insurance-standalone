# Document-Tactic Links CSV Import/Export Guide

## Overview

The CSV Import/Export feature allows administrators to bulk manage document-tactic links by importing and exporting data in CSV (Comma-Separated Values) format. This enables offline editing using spreadsheet applications like Excel, Google Sheets, or Numbers.

---

## Features Implemented

### 1. CSV Export
- **Location**: Document Management page (`/admin/documents`)
- **Button**: "Export Links to CSV" in the page header
- **Output**: Downloads all current document-tactic links as a CSV file
- **Filename Format**: `document-links-export-YYYY-MM-DD.csv`

### 2. CSV Import
- **Location**: Document Management page (`/admin/documents`)
- **Button**: "Import Links from CSV" in the page header
- **Features**:
  - Client-side file validation
  - Data validation against database
  - Preview dialog with validation results
  - Bulk insert with error handling
  - Duplicate detection

### 3. CSV Template Download
- **Location**: Inside import preview dialog
- **Button**: "Download Template" (small button in dialog header)
- **Purpose**: Provides a sample CSV structure for users

---

## CSV File Format

### Required Columns

The CSV file must include these three required columns:

| Column Name | Type | Description | Valid Values |
|-------------|------|-------------|--------------|
| `document_id` | Integer | ID of the document | Must exist in `gh_documents` table |
| `tactic_id` | String | ID of the tactic | Must exist in `gh_tactic_instructions` table |
| `link_type` | String | Type of link relationship | `required`, `recommended`, or `supplemental` |

### Optional Columns (Export Only)

These columns are included in exports for reference but are NOT required for imports:

| Column Name | Description |
|-------------|-------------|
| `document_name` | Human-readable document name |
| `tactic_name` | Human-readable tactic name |
| `created_at` | Timestamp when link was created |

### Example CSV

```csv
document_id,tactic_id,link_type
1,tactic_001,required
2,tactic_002,recommended
3,tactic_003,supplemental
```

### Example CSV with Optional Columns (Export Format)

```csv
document_id,document_name,tactic_id,tactic_name,link_type,created_at
1,"Business Plan Template",tactic_001,"Create Business Plan",required,2025-01-15
2,"LLC Formation Guide",tactic_002,"Register LLC",recommended,2025-01-16
3,"Tax Checklist",tactic_003,"File Taxes",supplemental,2025-01-17
```

---

## How to Use

### Exporting Links

1. Navigate to **Document Management** page (`/admin/documents`)
2. Click **"Export Links to CSV"** button in the header
3. File automatically downloads to your browser's download folder
4. Open file in Excel, Google Sheets, or any spreadsheet application
5. Edit as needed (keep required columns!)

### Importing Links

1. Prepare your CSV file with required columns: `document_id`, `tactic_id`, `link_type`
2. Navigate to **Document Management** page
3. Click **"Import Links from CSV"** button
4. Select your CSV file from your computer
5. Review the **Preview Dialog**:
   - **Valid rows**: Will be imported (shown in green)
   - **Errors**: Rows with validation issues (shown in red)
   - **Duplicates**: Links that already exist (will be skipped)
6. Click **"Import X Link(s)"** to proceed
7. Page automatically refreshes after successful import

### Using the Template

1. Click **"Import Links from CSV"**
2. In the preview dialog, click **"Download Template"** (top right)
3. Template includes example rows showing the correct format
4. Replace example data with your actual data
5. Import the completed file

---

## Validation Rules

The importer validates each row against these rules:

### Document ID Validation
- **Must not be empty**
- **Must be a valid number**
- **Must exist in the database** (`gh_documents` table)

### Tactic ID Validation
- **Must not be empty**
- **Must exist in the database** (`gh_tactic_instructions` table)

### Link Type Validation
- **Must not be empty**
- **Must be one of**: `required`, `recommended`, or `supplemental`
- Case-sensitive (must be lowercase)

### Duplicate Detection
- Checks if the document-tactic link already exists in the database
- Duplicates are shown separately and will be skipped during import
- No error occurs for duplicates (they are simply ignored)

---

## Error Handling

### File Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "File must be a .csv file" | Wrong file type selected | Select a file with `.csv` extension |
| "File size must be less than 5MB" | File too large | Split into smaller files or clean up data |
| "File is empty" | No data in file | Add data to the file |

### Data Validation Errors

Errors are displayed in a table showing:
- **Row number** (line number in CSV file)
- **Field name** (which column has the issue)
- **Error message** (description of the problem)
- **Value** (the invalid data)

### Common Validation Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Missing document_id" | Column is empty | Fill in document ID |
| "Invalid document_id (must be a number)" | Non-numeric value | Use only numbers (e.g., 1, 2, 3) |
| "Document ID does not exist in database" | ID not found | Verify document exists, check ID value |
| "Missing tactic_id" | Column is empty | Fill in tactic ID |
| "Tactic ID does not exist in database" | ID not found | Verify tactic exists, check ID value |
| "Missing link_type" | Column is empty | Fill in link type |
| "Invalid link_type" | Wrong value | Use `required`, `recommended`, or `supplemental` |

---

## Technical Implementation

### Files Created

1. **`/src/utils/csvHelpers.ts`**
   - CSV parsing and generation utilities
   - Validation logic
   - File handling functions

2. **`/src/components/admin/documents/DocumentLinkExporter.tsx`**
   - Export button component
   - Queries database for link data
   - Generates and downloads CSV file

3. **`/src/components/admin/documents/DocumentLinkImporter.tsx`**
   - Import button and dialog component
   - File upload handling
   - Validation and preview UI
   - Bulk insert functionality

4. **`/src/components/admin/documents/CSVTemplateDownloader.tsx`**
   - Template download button
   - Generates sample CSV structure

### Database Tables Used

- **`gh_documents`**: Document metadata
- **`gh_tactic_instructions`**: Tactic metadata
- **`gh_document_tactic_links`**: Many-to-many relationship links

### Security

- **Client-side only**: No server uploads (files processed in browser)
- **File size limit**: 5MB maximum
- **File type validation**: Only `.csv` files accepted
- **RLS policies**: Uses existing Supabase Row Level Security
- **Admin-only**: Only authenticated admin users can import/export

### Performance

- **Bulk insert**: Uses single Supabase query for all rows
- **Client-side parsing**: Uses `csv-parse` library (already in dependencies)
- **Preview limits**: Shows first 10 rows in preview tables
- **Memory safe**: 5MB file size limit prevents browser crashes

---

## Use Cases

### Bulk Link Creation
- Create 100+ links at once using spreadsheet
- Faster than clicking through UI for each link

### Offline Editing
- Export current links
- Review and edit in Excel/Google Sheets
- Import updated links back

### Data Migration
- Move links between environments
- Backup and restore link configurations

### Bulk Updates
- Export, modify link types in spreadsheet
- Re-import with updated values
- (Note: Currently inserts only; delete old links first if updating)

---

## Best Practices

1. **Always export before importing**: Create a backup of current links
2. **Validate IDs first**: Verify document and tactic IDs exist before creating CSV
3. **Use template**: Download template to ensure correct format
4. **Review preview**: Always check validation results before confirming import
5. **Small batches**: For large datasets, import in batches of 100-500 rows
6. **Test with sample data**: Try with 2-3 rows first to verify format

---

## Troubleshooting

### Import button doesn't work
- Check if file input is being blocked by browser
- Try clearing browser cache
- Ensure JavaScript is enabled

### "Failed to parse CSV file" error
- Open file in text editor to check format
- Ensure file uses commas (not semicolons or tabs)
- Check for special characters or encoding issues
- Save as CSV UTF-8 format

### All rows show as errors
- Verify column names match exactly: `document_id`, `tactic_id`, `link_type`
- Check for extra spaces in column headers
- Ensure first row is headers, not data

### "Document ID does not exist" errors
- Run this query to check valid document IDs:
  ```sql
  SELECT id, document_name FROM gh_documents ORDER BY id;
  ```
- Use exact ID values from database

### "Tactic ID does not exist" errors
- Run this query to check valid tactic IDs:
  ```sql
  SELECT tactic_id, tactic_name FROM gh_tactic_instructions ORDER BY tactic_id;
  ```
- Use exact ID values from database (case-sensitive)

---

## Future Enhancements (Not Yet Implemented)

- [ ] Update existing links (currently only creates new links)
- [ ] Delete links via CSV (import with special flag)
- [ ] Export with filters (by document, by tactic, by link type)
- [ ] Import progress bar for large files
- [ ] CSV validation before file selection
- [ ] Drag-and-drop file upload
- [ ] Multi-file import
- [ ] Export to Excel format (.xlsx)

---

## Support

For issues or questions:
1. Check this guide first
2. Verify file format matches template
3. Check browser console for detailed errors
4. Contact system administrator with error screenshots
