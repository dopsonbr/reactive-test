// peripheral.js - High-level peripheral bridge client

import { StompClient } from './stomp.js';

let client = null;
let capabilities = null;
let scanCallback = null;
let paymentCallback = null;

export async function connectPeripherals(url) {
    client = new StompClient(url);

    try {
        await client.connect();

        // Subscribe to capability updates
        client.subscribe('/topic/capabilities', (data) => {
            capabilities = data.capabilities;
            console.log('Capabilities updated:', capabilities);
        });

        // Subscribe to scanner events
        client.subscribe('/topic/scanner/events', (data) => {
            if (data.event === 'scan' && scanCallback) {
                scanCallback(data.barcode, data.symbology);
            }
        });

        // Subscribe to payment events
        client.subscribe('/topic/payment/events', (data) => {
            if (paymentCallback) {
                paymentCallback(data);
            }
        });

        return true;
    } catch (err) {
        console.error('Failed to connect to peripheral bridge:', err);
        return false;
    }
}

export function getCapabilities() {
    return capabilities;
}

export function isConnected() {
    return client?.connected ?? false;
}

// Scanner
export function onScan(callback) {
    scanCallback = callback;
}

export function enableScanner() {
    if (!client?.connected) return;
    client.sendMessage('/app/scanner/enable', {});
}

export function disableScanner() {
    if (!client?.connected) return;
    client.sendMessage('/app/scanner/disable', {});
}

// Payment
export function onPaymentResult(callback) {
    paymentCallback = callback;
}

export function collectPayment(amountCents, options = {}) {
    if (!client?.connected) {
        paymentCallback?.({ status: 'error', reason: 'Bridge not connected' });
        return;
    }

    client.sendMessage('/app/payment/collect', {
        amount: amountCents,
        currency: 'USD',
        allowCashback: options.allowCashback ?? false,
        offlineFloorLimit: options.floorLimit ?? 200000, // $2000 default
        timeout: options.timeout ?? 60000
    });
}

export function cancelPayment() {
    if (!client?.connected) return;
    client.sendMessage('/app/payment/cancel', {});
}

// Receipt Printer
export function printReceipt(receipt) {
    if (!client?.connected) {
        console.log('Receipt print skipped - bridge not connected');
        return;
    }

    if (!capabilities?.printer?.available) {
        console.log('Receipt print skipped - printer not available');
        return;
    }

    client.sendMessage('/app/printer/print', {
        type: 'receipt',
        data: receipt
    });
}

// Lane Lights (optional visual feedback)
export function setLightColor(color) {
    if (!client?.connected) return;
    if (!capabilities?.lights?.available) return;

    client.sendMessage('/app/lights/set', { color });
}

export function flashLight(color, count = 3) {
    if (!client?.connected) return;
    if (!capabilities?.lights?.available) return;

    client.sendMessage('/app/lights/flash', { color, count });
}
