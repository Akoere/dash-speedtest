const https = require('https');
const axios = require('axios');
const cron = require('node-cron');
const db = require('./db');

// --- CONFIGURATION ---
const NTFY_TOPIC = 'dash-speedtest'; // Change this to your unique topic
const DOWNLOAD_THRESHOLD = 5; // Alert if speed is below 5 Mbps

async function measureSpeed() {
    const url = 'https://speed.cloudflare.com/__down?bytes=1000000'; // 1MB test file
    let receivedBytes = 0;
    const startTime = Date.now();

    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.get(url, options, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download: ${res.statusCode}`));
                return;
            }

            res.on('data', (chunk) => {
                receivedBytes += chunk.length;
            });

            res.on('end', () => {
                const durationSeconds = (Date.now() - startTime) / 1000;
                // If duration is 0 (very fast), avoid division by zero
                const speedMbps = (receivedBytes * 8 / (1000 * 1000) / (durationSeconds || 0.001)).toFixed(2);
                resolve(speedMbps);
            });
        });

        req.on('error', (err) => reject(err));
        req.setTimeout(20000, () => {
            req.destroy();
            reject(new Error('Speed test timed out'));
        });
    });
}

async function runSpeedCheck() {
    console.log(`[${new Date().toLocaleTimeString()}] Checking speed via Cloudflare (1MB)...`);

    try {
        const downloadMbps = await measureSpeed();
        console.log(`Current Speed: ${downloadMbps} Mbps`);

        // Save to JSON "database"
        db.run('', [downloadMbps, 'Cloudflare Speedtest', 'online']);

        // Only notify if speed is below your threshold
        if (parseFloat(downloadMbps) < DOWNLOAD_THRESHOLD) {
            await axios.post(`https://ntfy.sh/${NTFY_TOPIC}`, 
                `Speed Alert: Internet speed is ${downloadMbps} Mbps`, 
                {
                    headers: { 'Title': 'Internet Speed' }
                }
            );
            console.log('Notification sent to phone.');
        }

    } catch (err) {
        console.error("Speed test failed:", err.message);
        // Save failure to database
        db.run('', [0, 'Unknown', 'offline']);
        
        try {
            await axios.post(`https://ntfy.sh/${NTFY_TOPIC}`, `🚨 Connection Issue: ${err.message}`);
        } catch (notifyErr) {
            console.error("Failed to send notification:", notifyErr.message);
        }
    }
}

// Set it to run every 30 minutes
cron.schedule('*/30 * * * *', () => {
    runSpeedCheck();
});

// Run once immediately when you start the script
runSpeedCheck();