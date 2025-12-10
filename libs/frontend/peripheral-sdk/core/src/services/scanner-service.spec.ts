import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScannerService } from './scanner-service';
import { StompClient } from '../client';
import { ScanEvent, ScannerEventMessage } from '../types';

describe('ScannerService', () => {
  let service: ScannerService;
  let mockStomp: {
    subscribe: ReturnType<typeof vi.fn>;
    publish: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStomp = {
      subscribe: vi.fn().mockReturnValue(vi.fn()),
      publish: vi.fn(),
    };
    service = new ScannerService(mockStomp as unknown as StompClient);
  });

  describe('enable', () => {
    it('should publish enable command', async () => {
      await service.enable();
      expect(mockStomp.publish).toHaveBeenCalledWith('/app/scanner/enable', {
        action: 'enable',
      });
    });

    it('should set enabled state to true', async () => {
      await service.enable();
      expect(service.enabled).toBe(true);
    });
  });

  describe('disable', () => {
    it('should publish disable command', async () => {
      await service.disable();
      expect(mockStomp.publish).toHaveBeenCalledWith('/app/scanner/disable', {
        action: 'disable',
      });
    });

    it('should set enabled state to false', async () => {
      await service.enable();
      await service.disable();
      expect(service.enabled).toBe(false);
    });
  });

  describe('onScan', () => {
    it('should subscribe to scanner events', () => {
      const handler = vi.fn();
      service.onScan(handler);

      expect(mockStomp.subscribe).toHaveBeenCalledWith(
        '/topic/scanner/events',
        expect.any(Function)
      );
    });

    it('should call handler when scan event received', () => {
      let stompHandler: (msg: ScannerEventMessage) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/scanner/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const scanHandler = vi.fn();
      service.onScan(scanHandler);

      const scanEvent: ScanEvent = {
        barcode: '0012345678905',
        symbology: 'ean13',
        timestamp: new Date().toISOString(),
      };

      stompHandler!({ type: 'scan', event: scanEvent });

      expect(scanHandler).toHaveBeenCalledWith(scanEvent);
    });

    it('should return unsubscribe function', () => {
      const unsubscribeMock = vi.fn();
      mockStomp.subscribe.mockReturnValue(unsubscribeMock);

      const handler = vi.fn();
      const unsubscribe = service.onScan(handler);

      unsubscribe();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});
