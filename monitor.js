const axios = require('axios');
const cron = require('node-cron');
const db = require('./db');

// --- CONFIGURATION ---
const NTFY_TOPIC = 'dash-speedtest'; // Change name to unique
const DOWNLOAD_THRESHOLD = 5;

let cronJob = null;

async function measureSpeed() {
    console.log(`[${new Date().toLocaleTimeString()}] Starting custom speed test...`);
    
    // Download Test (10MB file from Cloudflare)
    const downloadUrl = 'https://speed.cloudflare.com/__down?bytes=10000000';
    const downStart = Date.now();
    const downRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    const downDuration = (Date.now() - downStart) / 1000;
    const downloadMbps = (downRes.data.byteLength * 8 / (1000 * 1000) / downDuration).toFixed(2);

    // Upload Test (POST 5MB dummy data)
    const uploadUrl = 'https://speed.cloudflare.com/__up';
    const uploadData = Buffer.alloc(5000000, 'x'); // 5MB
    const upStart = Date.now();
    await axios.post(uploadUrl, uploadData);
    const upDuration = (Date.now() - upStart) / 1000;
    const uploadMbps = (uploadData.length * 8 / (1000 * 1000) / upDuration).toFixed(2);

    return {
        download: downloadMbps,
        upload: uploadMbps,
        isp: 'Cloudflare',
        server: 'Anycast'
    };
}

async function runSpeedCheck(isManual = false) {
    const settings = db.getSettings();
    if (!settings.enabled && !isManual) {
        console.log(`[${new Date().toLocaleTimeString()}] Speed check skipped.`);
        return;
    }

    try {
        const stats = await measureSpeed();
        console.log(`Speed: ${stats.download} Mbps down / ${stats.upload} Mbps up`);

        db.run('', [stats.download, stats.isp, 'online', stats.upload]);

        if (parseFloat(stats.download) < DOWNLOAD_THRESHOLD) {
            await axios.post(`https://ntfy.sh/${NTFY_TOPIC}`, 
                `Speed Alert: ${stats.download} Mbps down / ${stats.upload} Mbps up`, 
                { headers: { 'Title': 'Internet Speed Alert' } }
            );
        }
        return stats;

    } catch (err) {
        console.error("Speed test failed:", err.message);
        db.run('', [0, 'Unknown', 'offline', 0]);
        
        try {
            await axios.post(`https://ntfy.sh/${NTFY_TOPIC}`, `🚨 Connection Issue: ${err.message}`);
        } catch (notifyErr) {}
        throw err;
    }
}

function updateSchedule() {
    const settings = db.getSettings();
    if (cronJob) cronJob.stop();
    
    cronJob = cron.schedule(`*/${settings.interval} * * * *`, () => {
        runSpeedCheck();
    });
    console.log(`Service scheduled every ${settings.interval} minutes.`);
}

updateSchedule();

const initialSettings = db.getSettings();
if (initialSettings.enabled) {
    runSpeedCheck();
}

module.exports = { runSpeedCheck, updateSchedule };
