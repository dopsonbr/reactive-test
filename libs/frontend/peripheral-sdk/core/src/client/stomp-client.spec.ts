import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StompClient, StompClientOptions } from './stomp-client';

// Mock @stomp/stompjs
vi.mock('@stomp/stompjs', () => {
  const Client = vi.fn(function(this: any) {
    this.activate = vi.fn();
    this.deactivate = vi.fn().mockResolvedValue(undefined);
    this.subscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
    this.publish = vi.fn();
    this.connected = false;
    this.onConnect = null;
    this.onDisconnect = null;
    this.onStompError = null;
  });

  return { Client };
});

describe('StompClient', () => {
  let client: StompClient;
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
      client = new StompClient(endpoint);
      expect(client).toBeDefined();
    });

    it('should create client with options', () => {
      const options: StompClientOptions = {
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      };
      client = new StompClient(endpoint, options);
      expect(client).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should call activate on stomp client', async () => {
      const { Client } = await import('@stomp/stompjs');
      client = new StompClient(endpoint);

      // Get the mock instance
      const mockInstance = vi.mocked(Client).mock.results[0].value;

      // Simulate connection by triggering onConnect
      setTimeout(() => {
        mockInstance.connected = true;
        mockInstance.onConnect?.({} as any);
      }, 0);

      await client.connect();

      expect(mockInstance.activate).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should call deactivate on stomp client', async () => {
      const { Client } = await import('@stomp/stompjs');
      client = new StompClient(endpoint);

      const mockInstance = vi.mocked(Client).mock.results[0].value;

      await client.disconnect();

      expect(mockInstance.deactivate).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should subscribe to destination and return unsubscribe function', async () => {
      const { Client } = await import('@stomp/stompjs');
      client = new StompClient(endpoint);

      const mockInstance = vi.mocked(Client).mock.results[0].value;
      const handler = vi.fn();

      const unsubscribe = client.subscribe('/topic/test', handler);

      expect(mockInstance.subscribe).toHaveBeenCalledWith(
        '/topic/test',
        expect.any(Function)
      );
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('publish', () => {
    it('should publish message to destination', async () => {
      const { Client } = vi.mocked(await import('@stomp/stompjs'));
      client = new StompClient(endpoint);

      const mockInstance = Client.mock.results[0].value;
      const body = { test: 'data' };

      client.publish('/app/test', body);

      expect(mockInstance.publish).toHaveBeenCalledWith({
        destination: '/app/test',
        body: JSON.stringify(body),
      });
    });
  });
});
