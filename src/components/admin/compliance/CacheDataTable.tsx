/**
 * Cache Data Table Component
 * Displays county_compliance_cache records with status and actions
 */

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CacheRecordSummary } from '@/types/binderGeneration';
import type { StateCode } from '@/types/compliance';
import { STATE_NAMES } from '@/types/compliance';
import { getCacheRecordsSummary } from '@/services/binderGenerationService';

interface CacheDataTableProps {
  onPreview: (recordId: string) => void;
  onGenerate: (recordIds: string[]) => void;
  selectedRecords: string[];
  onSelectionChange: (recordIds: string[]) => void;
}

export function CacheDataTable({
  onPreview,
  onGenerate,
  selectedRecords,
  onSelectionChange,
}: CacheDataTableProps) {
  const [records, setRecords] = useState<CacheRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<StateCode | 'all'>('all');

  useEffect(() => {
    loadRecords();
  }, [stateFilter]);

  const loadRecords = async () => {
    setIsLoading(true);
    setError(null);
    console.log('[CacheDataTable] Loading records with filter:', stateFilter);
    try {
      const data = await getCacheRecordsSummary(
        stateFilter === 'all' ? undefined : stateFilter
      );
      console.log('[CacheDataTable] Loaded records:', data.length, data);
      setRecords(data);
    } catch (err) {
      console.error('[CacheDataTable] Error loading records:', err);
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const suitableIds = records
        .filter(r => r.isSuitable && !r.hasBinder)
        .map(r => r.id);
      onSelectionChange(suitableIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedRecords, recordId]);
    } else {
      onSelectionChange(selectedRecords.filter(id => id !== recordId));
    }
  };

  const getConfidenceBadge = (score: number | null) => {
    if (score === null) return <Badge variant="outline">N/A</Badge>;
    if (score >= 80) return <Badge className="bg-green-500">High ({score})</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Medium ({score})</Badge>;
    return <Badge variant="destructive">Low ({score})</Badge>;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'permitted':
        return <Badge className="bg-green-500">Permitted</Badge>;
      case 'permitted_with_conditions':
        return <Badge className="bg-yellow-500">Conditional</Badge>;
      case 'not_permitted':
        return <Badge variant="destructive">Not Permitted</Badge>;
      case 'unclear':
        return <Badge variant="outline">Unclear</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get unique states from records for filter
  const availableStates = Array.from(
    new Set(records.map(r => r.stateCode))
  ).sort();

  const suitableCount = records.filter(r => r.isSuitable && !r.hasBinder).length;
  const selectedSuitableCount = selectedRecords.filter(id =>
    records.find(r => r.id === id && r.isSuitable && !r.hasBinder)
  ).length;

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 p-4">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={loadRecords}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={stateFilter}
            onValueChange={(value) => setStateFilter(value as StateCode | 'all')}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {availableStates.map(state => (
                <SelectItem key={state} value={state}>
                  {STATE_NAMES[state] || state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground">
            {records.length} records | {suitableCount} suitable for generation
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedRecords.length > 0 && (
            <Button
              onClick={() => onGenerate(selectedRecords)}
              disabled={selectedSuitableCount === 0}
            >
              Generate {selectedSuitableCount} Binder(s)
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedRecords.length > 0 &&
                    selectedRecords.length === suitableCount
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all suitable records"
                />
              </TableHead>
              <TableHead>County</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Binder</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <span className="text-sm text-muted-foreground mt-2 block">
                    Loading cache records...
                  </span>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="space-y-2">
                    <span className="text-muted-foreground block">
                      No cache records found
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      The county_compliance_cache table may be empty. Use N8n workflows to scrape compliance data first.
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      Check the browser console for detailed logs.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map(record => (
                <TableRow
                  key={record.id}
                  className={!record.isSuitable ? 'opacity-60' : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRecords.includes(record.id)}
                      onCheckedChange={(checked) =>
                        handleSelectRecord(record.id, checked as boolean)
                      }
                      disabled={!record.isSuitable || record.hasBinder}
                      aria-label={`Select ${record.countyName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {record.countyName}
                  </TableCell>
                  <TableCell>{record.stateName}</TableCell>
                  <TableCell>
                    {getConfidenceBadge(record.confidenceScore)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record.complianceStatus)}
                  </TableCell>
                  <TableCell>
                    {record.hasBinder ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Exists</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Not generated
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(record.lastUpdated).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          console.log('[CacheDataTable] View button clicked for record:', record.id, record.countyName);
                          onPreview(record.id);
                        }}
                        title="Preview binder"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!record.hasBinder && record.isSuitable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onGenerate([record.id])}
                          title="Generate binder"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default CacheDataTable;
