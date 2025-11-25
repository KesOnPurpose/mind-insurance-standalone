// AI-Powered Metadata Extraction Service
// Uses Claude API (Anthropic) to analyze documents and suggest metadata

import type {
  AIMetadataSuggestion,
  ClaudeAnalysisResponse,
} from '@/types/bulkUpload';
import type { DocumentCategory } from '@/types/documents';

// Note: Anthropic API is now called via Supabase Edge Function to avoid CORS issues

/**
 * Extract text from PDF files (first 2-3 pages)
 * Uses PDF.js in browser with local worker file (fixes 404 error)
 */
const extractPDFText = async (file: File): Promise<string> => {
  try {
    // Dynamic import to avoid bundling issues
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker path to local file (fixes CORS and 404 issues)
    // Worker file is copied to public/ during build
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Extract first 3 pages max
    const pagesToExtract = Math.min(3, pdf.numPages);
    let text = '';

    for (let i = 1; i <= pagesToExtract; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n\n';
    }

    return text.slice(0, 4000); // Limit to ~4k chars for API efficiency
  } catch (error) {
    console.error('PDF extraction error:', error);
    // Return empty string instead of throwing - allows fallback to filename-only analysis
    return '';
  }
};

/**
 * Convert image file to base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Build analysis prompt for Claude
 */
const buildAnalysisPrompt = (filename: string, content: string): string => {
  return `Analyze this group home training document and extract structured metadata.

Document filename: ${filename}
Content preview: ${content}

You must respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "category": "operations|marketing|financial|legal|revenue|compliance",
  "description": "1-2 sentence description",
  "applicable_states": ["STATE_CODE" or "ALL"],
  "ownership_model": ["individual"|"llc"|"corporation"|"partnership"|"nonprofit"],
  "applicable_populations": ["adult"|"youth"|"seniors"|"veterans"|"special_needs"],
  "difficulty": "beginner"|"intermediate"|"advanced"|null,
  "confidence": {
    "category": 0-100,
    "description": 0-100,
    "applicable_states": 0-100,
    "ownership_model": 0-100,
    "applicable_populations": 0-100,
    "difficulty": 0-100
  },
  "notes": "brief analysis rationale"
}

IMPORTANT RULES:
- Use lowercase for all enum values
- applicable_states must be 2-letter state codes (e.g., ["CA", "TX"]) or ["ALL"]
- ownership_model must be an array (can be empty if not applicable)
- applicable_populations must be an array (can be empty if universal)
- difficulty can be null if not determinable
- Confidence scores: 90-100 = very certain, 70-89 = confident, 50-69 = uncertain, <50 = needs review
- Set confidence based on how clearly the document indicates each field
- Return ONLY the JSON object, no other text`;
};

/**
 * Call Claude API via Supabase Edge Function (fixes CORS issue)
 */
const callClaudeAPI = async (
  filename: string,
  content: string,
  imageData?: string,
  fileType?: string
): Promise<ClaudeAnalysisResponse> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables must be set');
  }

  // Call Supabase Edge Function instead of direct Anthropic API
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/analyze-document-metadata`;

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      filename,
      fileContent: content,
      fileType: fileType || 'application/pdf',
      imageData,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Edge Function error:', errorData);
    throw new Error(`Edge Function error: ${response.status} - ${errorData.error || 'Unknown error'}`);
  }

  // Response is already parsed JSON from Edge Function
  const result = await response.json();
  return result as ClaudeAnalysisResponse;
};

/**
 * Clean and normalize filename
 */
export const cleanFilename = (filename: string): string => {
  return filename
    .replace(/\.pdf\.pdf$/i, '.pdf') // Remove double .pdf.pdf
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w.-]/g, '') // Remove special characters
    .replace(/_+/g, '_') // Collapse multiple underscores
    .trim();
};

/**
 * Main function: Analyze document and return metadata suggestion
 */
export const analyzeDocumentMetadata = async (
  file: File
): Promise<AIMetadataSuggestion> => {
  const fileType = file.type || file.name.split('.').pop()?.toLowerCase() || '';
  const isPDF = fileType.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
  const isImage = fileType.includes('image') || /\.(png|jpg|jpeg)$/i.test(file.name);

  let textContent = '';
  let imageData: string | undefined;

  try {
    // Extract content based on file type
    if (isPDF) {
      textContent = await extractPDFText(file);
    } else if (isImage) {
      imageData = await fileToBase64(file);
      textContent = `Image file: ${file.name}`;
    } else {
      // Unsupported type - use filename only
      textContent = `Document type: ${fileType}`;
    }

    // Call Claude API via Edge Function
    const aiResponse = await callClaudeAPI(file.name, textContent, imageData, fileType);

    // Calculate if needs review (any confidence < 70)
    const confidenceScores = aiResponse.confidence;
    const needsReview =
      Object.values(confidenceScores).some((score) => score < 70);

    // Build suggestion object
    const suggestion: AIMetadataSuggestion = {
      filename: file.name,
      suggestedMetadata: {
        document_name: cleanFilename(file.name.replace(/\.[^/.]+$/, '')), // Remove extension
        category: aiResponse.category,
        description: aiResponse.description,
        applicable_states: aiResponse.applicable_states,
        ownership_model: aiResponse.ownership_model,
        applicable_populations: aiResponse.applicable_populations,
        difficulty: aiResponse.difficulty,
      },
      confidenceScores: {
        category: confidenceScores.category,
        description: confidenceScores.description,
        applicable_states: confidenceScores.applicable_states,
        ownership_model: confidenceScores.ownership_model,
        applicable_populations: confidenceScores.applicable_populations,
        difficulty: confidenceScores.difficulty,
      },
      analysisNotes: aiResponse.notes,
      needsReview,
    };

    return suggestion;
  } catch (error) {
    console.error('Metadata extraction failed:', error);

    // Return fallback suggestion with low confidence
    return {
      filename: file.name,
      suggestedMetadata: {
        document_name: cleanFilename(file.name.replace(/\.[^/.]+$/, '')),
        category: 'operations' as DocumentCategory,
        description: 'AI analysis failed - please provide description',
        applicable_states: [],
        ownership_model: [],
        applicable_populations: [],
        difficulty: null,
      },
      confidenceScores: {
        category: 0,
        description: 0,
        applicable_states: 0,
        ownership_model: 0,
        applicable_populations: 0,
        difficulty: 0,
      },
      analysisNotes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      needsReview: true,
    };
  }
};

/**
 * Batch analyze multiple files
 * Processes files in batches to avoid rate limits
 */
export const analyzeBatchDocuments = async (
  files: File[],
  batchSize: number = 5,
  onProgress?: (analyzed: number, total: number) => void
): Promise<AIMetadataSuggestion[]> => {
  const results: AIMetadataSuggestion[] = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map((file) => analyzeDocumentMetadata(file))
    );

    results.push(...batchResults);

    // Report progress
    if (onProgress) {
      onProgress(results.length, files.length);
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < files.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
};
