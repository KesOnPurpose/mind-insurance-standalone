// ============================================================================
// CSV TEMPLATE GENERATOR
// ============================================================================
// Generate downloadable CSV template for bulk user import
// Includes header row and example rows for all tier types
// ============================================================================

/**
 * Generate and download a CSV template file
 * Includes examples for all user tiers
 */
export function downloadCsvTemplate(): void {
  const template = `email,full_name,phone,tier,notes
user@example.com,John Doe,+1 234 567 8900,user,Bootcamp participant from Q4 2024
coach@example.com,Jane Smith,+1 555 123 4567,coach,Coach application approved - specializes in mindset
admin@example.com,Admin User,,admin,Content manager for Mind Insurance protocols
super_admin@example.com,Super Admin,,super_admin,Full system access for analytics and user management
owner@example.com,Owner User,,owner,Unrestricted access to all features`;

  // Create blob and download
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'user_import_template.csv';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL
  URL.revokeObjectURL(url);
}

/**
 * Get CSV template as string (for display or preview)
 * @returns CSV template string
 */
export function getCsvTemplateString(): string {
  return `email,full_name,phone,tier,notes
user@example.com,John Doe,+1 234 567 8900,user,Bootcamp participant
coach@example.com,Jane Smith,,coach,Coach application approved
admin@example.com,Admin User,,admin,Content manager`;
}
