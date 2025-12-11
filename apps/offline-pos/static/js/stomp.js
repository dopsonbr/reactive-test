// stomp.js - Minimal STOMP 1.2 client for peripheral bridge

export class StompClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.receiptCallbacks = new Map();
        this.messageId = 0;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                this.send('CONNECT', {
                    'accept-version': '1.2',
                    'host': 'localhost'
                });
            };

            this.ws.onmessage = (event) => {
                const frame = this.parseFrame(event.data);
                this.handleFrame(frame, resolve, reject);
            };

            this.ws.onerror = (err) => reject(err);
            this.ws.onclose = () => {
                this.connected = false;
                console.log('Peripheral bridge disconnected');
            };
        });
    }

    send(command, headers = {}, body = '') {
        const lines = [command];
        for (const [key, value] of Object.entries(headers)) {
            lines.push(`${key}:${value}`);
        }
        lines.push('');
        lines.push(body);
        lines.push('\x00');
        this.ws.send(lines.join('\n'));
    }

    subscribe(destination, callback) {
        const id = `sub-${this.messageId++}`;
        this.subscriptions.set(destination, { id, callback });
        this.send('SUBSCRIBE', {
            id,
            destination
        });
        return id;
    }

    sendMessage(destination, body, receipt = null) {
        const headers = {
            destination,
            'content-type': 'application/json'
        };
        if (receipt) {
            headers.receipt = receipt;
            return new Promise((resolve) => {
                this.receiptCallbacks.set(receipt, resolve);
                this.send('SEND', headers, JSON.stringify(body));
            });
        }
        this.send('SEND', headers, JSON.stringify(body));
    }

    parseFrame(data) {
        const lines = data.split('\n');
        const command = lines[0];
        const headers = {};
        let i = 1;
        while (lines[i] && lines[i] !== '') {
            const [key, ...rest] = lines[i].split(':');
            headers[key] = rest.join(':');
            i++;
        }
        const body = lines.slice(i + 1).join('\n').replace(/\x00$/, '');
        return { command, headers, body };
    }

    handleFrame(frame, resolve, reject) {
        switch (frame.command) {
            case 'CONNECTED':
                this.connected = true;
                console.log('Connected to peripheral bridge');
                resolve();
                break;

            case 'MESSAGE':
                const dest = frame.headers.destination;
                for (const [pattern, sub] of this.subscriptions) {
                    if (dest.startsWith(pattern) || dest === pattern) {
                        const data = frame.body ? JSON.parse(frame.body) : {};
                        sub.callback(data, frame.headers);
                    }
                }
                break;

            case 'RECEIPT':
                const receiptId = frame.headers['receipt-id'];
                if (this.receiptCallbacks.has(receiptId)) {
                    this.receiptCallbacks.get(receiptId)();
                    this.receiptCallbacks.delete(receiptId);
                }
                break;

            case 'ERROR':
                console.error('STOMP error:', frame.body);
                reject(new Error(frame.body));
                break;
        }
    }
}
