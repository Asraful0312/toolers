import { requireNativeModule } from 'expo-modules-core';

export interface PdfOptions {
  fileName?: string;
  pageSize?: 'A4' | 'Letter' | 'A3' | 'A5';
  quality?: number;
  fitMode?: 'contain' | 'cover' | 'fill';
}

export interface PdfResult {
  uri: string;
  fileName: string;
  pageCount: number;
}

export interface SaveResult {
  uri: string;
  fileName: string;
  success: boolean;
}

const ImageToPdf = requireNativeModule('ImageToPdf');

/**
 * Creates a PDF from an array of image URIs
 * @param imageUris Array of image URIs (file:// or content://)
 * @param options PDF generation options
 * @returns Promise with the PDF file info
 */
export async function createPdf(imageUris: string[], options: PdfOptions = {}): Promise<PdfResult> {
  return await ImageToPdf.createPdf(imageUris, {
    fileName: options.fileName || `images_${Date.now()}`,
    pageSize: options.pageSize || 'A4',
    quality: options.quality || 90,
    fitMode: options.fitMode || 'contain',
  });
}

/**
 * Saves a PDF to the device Downloads folder
 * @param sourceUri The source PDF file URI
 * @param fileName The name for the saved PDF (without extension)
 * @returns Promise with save result
 */
export async function savePdfToDownloads(sourceUri: string, fileName: string): Promise<SaveResult> {
  return await ImageToPdf.savePdfToDownloads(sourceUri, fileName);
}

// PDF Utilities

export interface MergeResult {
  uri: string;
  fileName: string;
  pageCount: number;
}

export interface ToImageResult {
  images: string[];
  pageCount: number;
}

export interface CompressResult {
  uri: string;
  originalSize: number;
  compressedSize: number;
  savings: number;
}

/**
 * Merge multiple PDF files into one
 */
export async function mergePdfs(pdfUris: string[], fileName?: string): Promise<MergeResult> {
  return await ImageToPdf.mergePdfs(pdfUris, fileName || `merged_${Date.now()}`);
}

/**
 * Convert PDF pages to images
 */
export async function pdfToImages(pdfUri: string, quality?: number): Promise<ToImageResult> {
  return await ImageToPdf.pdfToImages(pdfUri, quality || 90);
}

/**
 * Compress a PDF file
 */
export async function compressPdf(pdfUri: string, quality?: number): Promise<CompressResult> {
  return await ImageToPdf.compressPdf(pdfUri, quality || 70);
}

export interface WatermarkOptions {
  fontSize?: number;
  opacity?: number;
  rotation?: number;
  color?: string;
}

export interface WatermarkResult {
  uri: string;
  pageCount: number;
}

/**
 * Add text watermark to PDF
 */
export async function watermarkPdf(pdfUri: string, text: string, options?: WatermarkOptions): Promise<WatermarkResult> {
  return await ImageToPdf.watermarkPdf(pdfUri, text, options || {});
}

// PDF Edit Operations
export interface EditOperation {
  type: 'delete' | 'rotate';
  pageIndex: number;
  degrees?: number;
}

export interface EditResult {
  uri: string;
  pageCount: number;
}

/**
 * Edit PDF pages (delete, rotate, reorder)
 * @param pdfUri Source PDF file URI
 * @param operations Array of delete/rotate operations
 * @param pageOrder Optional array of original page indices specifying final order
 */
export async function editPdfPages(
  pdfUri: string,
  operations: EditOperation[],
  pageOrder?: number[]
): Promise<EditResult> {
  return await ImageToPdf.editPdfPages(pdfUri, operations, pageOrder || []);
}

// PDF Annotation
export interface TextAnnotation {
  type: 'text';
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  color?: string;
}

export interface ImageAnnotation {
  type: 'image';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUri: string;
}

export type Annotation = TextAnnotation | ImageAnnotation;

export interface AnnotateResult {
  uri: string;
  pageCount: number;
}

/**
 * Add text and image annotations to PDF
 */
export async function annotatePdf(pdfUri: string, annotations: Annotation[]): Promise<AnnotateResult> {
  return await ImageToPdf.annotatePdf(pdfUri, annotations);
}

export default {
  createPdf,
  savePdfToDownloads,
  mergePdfs,
  pdfToImages,
  compressPdf,
  watermarkPdf,
  editPdfPages,
  annotatePdf,
};

