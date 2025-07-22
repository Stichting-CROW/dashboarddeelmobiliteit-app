export interface BaseDocumentData {
  extraction_status: 'success' | 'partial' | 'failed';
  confidence: 'low' | 'medium' | 'high';
}

export interface InvoiceData extends BaseDocumentData {
  invoice_date: string;
  company_name: string;
  description: string;
  invoice_amount: string;
  invoice_currency: string;
}

export interface GenericDocumentData extends BaseDocumentData {
  document_date: string;
  document_category: string;
  description: string;
  source: string;
}

export interface MovieCoverData extends BaseDocumentData {
  movie_title: string;
  type: 'movie' | 'series' | undefined;
  season: number;
  disc_number: string;
  media_format: 'DVD' | 'Blu-ray' | undefined;
  description: string;
  duration: string;
  imdb_id: string;
}

export type DocumentData = InvoiceData | GenericDocumentData | MovieCoverData;

export enum DocumentType {
  INVOICE = 'invoice',
  GENERIC = 'generic',
  MOVIE_COVER = 'movie_cover'
}

export interface FileInfo {
  id: string; // uuidv4
  originalPath: string;      // Original absolute path
  currentPath: string;       // Current absolute path in filesystem
  data?: DocumentData;       // Document data after analysis
  timestamp: string;        // When the file was first seen
  // status no longer includes 'renamed'; use isRenamed (derived) instead
  status: 'new' | 'analyzed' | 'bad';
  error?: string;
  type: 'pdf' | 'image';
  documentType: DocumentType;
}

export interface RenamePlan {
  originalPath: string;
  newPath: string;
  data: DocumentData;
}

export interface State {
  knownFiles: FileInfo[];
  lastRun: string;
} 