/**
 * Barcode symbology types
 */
export type BarcodeSymbology =
  | 'ean13'
  | 'ean8'
  | 'upc-a'
  | 'upc-e'
  | 'qr'
  | 'pdf417'
  | 'code128'
  | 'code39'
  | 'datamatrix';

/**
 * Event emitted when a barcode is scanned
 */
export interface ScanEvent {
  /** The scanned barcode data */
  barcode: string;
  /** The symbology of the barcode */
  symbology: BarcodeSymbology;
  /** Timestamp of the scan */
  timestamp: string;
}

/**
 * Scanner event message from bridge
 */
export interface ScannerEventMessage {
  type: 'scan';
  event: ScanEvent;
}

/**
 * Scanner command to enable/disable
 */
export interface ScannerCommand {
  action: 'enable' | 'disable';
}
