// status.js - Connectivity status polling

export async function pollStatus() {
    const banner = document.getElementById('status-banner');
    if (!banner) return;

    const check = async () => {
        try {
            const resp = await fetch('/api/status');
            const status = await resp.json();
            updateBanner(banner, status);
        } catch (e) {
            banner.textContent = 'System error - contact support';
            banner.className = 'banner error';
        }
    };

    // Check immediately, then every 30s
    await check();
    setInterval(check, 30000);
}

function updateBanner(banner, status) {
    if (status.online) {
        banner.textContent = 'Primary systems available. Consider using main POS.';
        banner.className = 'banner online';
    } else {
        banner.className = 'banner hidden';
    }

    // Show sync status
    if (status.pendingTransactions > 0 && status.online) {
        banner.textContent = `Syncing ${status.pendingTransactions} transactions...`;
        banner.className = 'banner online';
    }
}
