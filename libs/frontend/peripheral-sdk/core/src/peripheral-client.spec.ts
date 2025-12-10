import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PeripheralClient, PeripheralClientOptions } from './peripheral-client';
import { Capabilities, CapabilitiesMessage } from './types';

// Mock the stomp client
vi.mock('./client/stomp-client', () => {
  const mockStompClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(vi.fn()),
    publish: vi.fn(),
    connected: false,
    onConnectionChange: vi.fn().mockReturnValue(vi.fn()),
  };

  return {
    StompClient: vi.fn(function (this: any) {
      return mockStompClient;
    }),
  };
});

describe('PeripheralClient', () => {
  let client: PeripheralClient;
  const endpoint = 'ws://localhost:9100/stomp';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create client with endpoint', () => {
      client = new PeripheralClient(endpoint);
      expect(client).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should connect and subscribe to capabilities', async () => {
      const { StompClient } = await import('./client/stomp-client');
      client = new PeripheralClient(endpoint);

      const mockStomp = vi.mocked(StompClient).mock.results[0].value;

      await client.connect();

      expect(mockStomp.connect).toHaveBeenCalled();
      expect(mockStomp.subscribe).toHaveBeenCalledWith(
        '/topic/capabilities',
        expect.any(Function)
      );
    });
  });

  describe('capabilities', () => {
    it('should return empty capabilities before receiving message', () => {
      client = new PeripheralClient(endpoint);
      expect(client.capabilities).toEqual({});
    });

    it('should notify handler when capabilities received', async () => {
      const { StompClient } = await import('./client/stomp-client');
      client = new PeripheralClient(endpoint);

      const mockStomp = vi.mocked(StompClient).mock.results[0].value;
      let capabilitiesHandler: (msg: CapabilitiesMessage) => void;

      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/capabilities') {
          capabilitiesHandler = handler;
        }
        return vi.fn();
      });

      const handler = vi.fn();
      client.onCapabilities(handler);

      await client.connect();

      // Simulate capabilities message
      const capsMessage: CapabilitiesMessage = {
        type: 'capabilities',
        timestamp: new Date().toISOString(),
        deviceId: 'test-device',
        capabilities: {
          scanner: { available: true },
          payment: { available: true, methods: ['chip', 'contactless'] },
        },
      };
      capabilitiesHandler!(capsMessage);

      expect(handler).toHaveBeenCalledWith(capsMessage.capabilities);
      expect(client.capabilities).toEqual(capsMessage.capabilities);
    });
  });

  describe('onConnectionChange', () => {
    it('should notify handler on connection state changes', async () => {
      const { StompClient } = await import('./client/stomp-client');
      client = new PeripheralClient(endpoint);

      const mockStomp = vi.mocked(StompClient).mock.results[0].value;

      const handler = vi.fn();
      client.onConnectionChange(handler);

      expect(mockStomp.onConnectionChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });
});
