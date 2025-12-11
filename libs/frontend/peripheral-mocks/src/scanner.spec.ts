import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  triggerScan,
  enableMockScanner,
  disableMockScanner,
  onMockScan,
  resetMockScanner,
  getMockScannerState,
} from './scanner';

describe('Mock Scanner', () => {
  beforeEach(() => {
    resetMockScanner();
  });

  describe('triggerScan', () => {
    it('should emit scan event with default values', () => {
      const listener = vi.fn();
      onMockScan(listener);

      triggerScan();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          barcode: '0012345678905',
          symbology: 'ean13',
        })
      );
    });

    it('should emit scan event with custom values', () => {
      const listener = vi.fn();
      onMockScan(listener);

      triggerScan({ barcode: '1234567890', symbology: 'qr' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          barcode: '1234567890',
          symbology: 'qr',
        })
      );
    });

    it('should not emit when scanner disabled', () => {
      const listener = vi.fn();
      onMockScan(listener);

      disableMockScanner();
      triggerScan();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('enable/disable', () => {
    it('should enable scanner', () => {
      disableMockScanner();
      enableMockScanner();

      expect(getMockScannerState().enabled).toBe(true);
    });

    it('should disable scanner', () => {
      disableMockScanner();

      expect(getMockScannerState().enabled).toBe(false);
    });
  });

  describe('onMockScan', () => {
    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = onMockScan(listener);

      unsubscribe();
      triggerScan();

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
