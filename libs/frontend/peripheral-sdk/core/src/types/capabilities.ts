/**
 * Scanner capability information
 */
export interface ScannerCapability {
  /** Whether scanner is available */
  available: boolean;
  /** Connection mode */
  mode?: 'bridge' | 'keyboard_wedge';
  /** Supported barcode symbologies */
  symbologies?: string[];
}

/**
 * Payment terminal capability information
 */
export interface PaymentCapability {
  /** Whether payment terminal is available */
  available: boolean;
  /** Supported payment methods */
  methods?: ('chip' | 'contactless' | 'swipe')[];
  /** Whether cashback is supported */
  cashback?: boolean;
}

/**
 * All device capabilities advertised by the bridge
 */
export interface Capabilities {
  scanner?: ScannerCapability;
  payment?: PaymentCapability;
}

/**
 * Capabilities message from bridge
 */
export interface CapabilitiesMessage {
  type: 'capabilities';
  timestamp: string;
  deviceId: string;
  capabilities: Capabilities;
}
