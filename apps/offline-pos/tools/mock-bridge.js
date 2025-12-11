// mock-bridge.js - Mock peripheral bridge for development
// Run with: node tools/mock-bridge.js

import { WebSocketServer } from 'ws';
import readline from 'readline';

const wss = new WebSocketServer({ port: 9100 });
const clients = new Set();

const capabilities = {
    type: 'capabilities',
    timestamp: new Date().toISOString(),
    deviceId: 'mock-device',
    capabilities: {
        scanner: { available: true, mode: 'keyboard', symbologies: ['ean13', 'upc-a', 'qr'] },
        payment: { available: true, methods: ['chip', 'contactless'], cashback: false },
        printer: { available: true, type: 'thermal' },
        lights: { available: false }
    }
};

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    ws.on('message', (data) => {
        const msg = data.toString();
        console.log('Received:', msg);

        // Handle STOMP CONNECT
        if (msg.startsWith('CONNECT')) {
            ws.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\x00');
            // Send capabilities after connect
            setTimeout(() => {
                sendMessage(ws, '/topic/capabilities', capabilities);
            }, 100);
        }

        // Handle SUBSCRIBE
        if (msg.startsWith('SUBSCRIBE')) {
            console.log('Subscription registered');
        }

        // Handle payment collect
        if (msg.includes('/app/payment/collect')) {
            console.log('Payment requested - simulating approval in 2s');
            setTimeout(() => {
                sendMessage(ws, '/topic/payment/events', {
                    event: 'approved',
                    status: 'approved',
                    transactionId: 'mock-' + Date.now(),
                    method: 'contactless',
                    cardBrand: 'visa',
                    last4: '4242',
                    authCode: 'MOCK123'
                });
            }, 2000);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

function sendMessage(ws, destination, body) {
    const frame = [
        'MESSAGE',
        `destination:${destination}`,
        'content-type:application/json',
        `message-id:msg-${Date.now()}`,
        '',
        JSON.stringify(body),
        '\x00'
    ].join('\n');
    ws.send(frame);
}

// CLI for simulating scans
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('Mock peripheral bridge running on ws://localhost:9100');
console.log('Type a barcode and press Enter to simulate a scan:');

rl.on('line', (barcode) => {
    if (barcode.trim()) {
        for (const ws of clients) {
            sendMessage(ws, '/topic/scanner/events', {
                event: 'scan',
                barcode: barcode.trim(),
                symbology: 'ean13'
            });
        }
        console.log(`Sent scan event: ${barcode}`);
    }
});

console.log('\nReady. Clients: 0');
