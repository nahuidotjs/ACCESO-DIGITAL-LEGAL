
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CONVERTER = 'CONVERTER',
  STRATEGY = 'STRATEGY',
  ANALYTICS = 'ANALYTICS'
}

export interface LawDocument {
  id: string;
  name: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'error';
  originalSize: string;
  structuredFormat?: 'latex' | 'markdown' | 'json';
  content?: string; 
  summary?: string;
}

export interface PolicyStep {
  phase: string;
  title: string;
  description: string;
  actionItems: string[];
}

export interface LawChunk {
  id: string;        // e.g., "Art. 1", "I."
  title: string;     // e.g., "Objeto de la Ley"
  page: number;      // Physical page number in PDF
  content: string;   // The verbatim text content
  tags?: string[];    // Auto-generated tags (Optional now)
  lastModified?: string; // Date string extracted from text
  officialCitation?: string; // Standard citation string
  paragraphs?: { text: string; reformDate?: string }[];
}

// -- NEW HIERARCHICAL INDEX TYPES --

export type IndexNodeType = 'LEY' | 'PRESENTACION' | 'TITULO' | 'CAPITULO' | 'ARTICULO' | 'INCISO';

export interface IndexNode {
  type: IndexNodeType;
  id: string;          // "Capítulo I", "Art. 3"
  description?: string;// Only for Chapters (e.g., "De los Derechos Humanos")
  pageRange?: string;  // "10-12" to know where to look
  children?: IndexNode[];
}

export interface LawMetadata {
  lawTitle: string;
  lastReformDate: string;
  presentationText: string; // The full text of the preamble/presentation
  structure: IndexNode[];   // The hierarchical tree
  docKey?: string;          // NEW: Document Key/Identifier (e.g., CONXNA...)
}

export interface ProcessingResult {
  markdown: string;
  latex: string;
  json: string;
  xml: string; // Added XML support
  html?: string; // Added HTML support
  chunks: LawChunk[]; 
  summary?: string; // Optional
  keyEntities?: string[]; // Optional
}
