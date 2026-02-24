const speedTest = require('speed-test');
const axios = require('axios');
const cron = require('node-cron');

// --- CONFIGURATION ---
const NTFY_TOPIC = 'vic_speed_alerts_2026'; // Change this to your unique topic
const DOWNLOAD_THRESHOLD = 5; // Alert if speed is below 5 Mbps

async function runSpeedCheck() {
    console.log(`[${new Date().toLocaleTimeString()}] Checking speed...`);

    try {
        const result = await speedTest({json: true});
        const download = result.download;
        const isp = result.server.isp;

        console.log(`Current Speed: ${download} Mbps on ${isp}`);

        // Only notify if speed is below your threshold
        if (download < DOWNLOAD_THRESHOLD) {
            await axios.post(`https://ntfy.sh/${NTFY_TOPIC}`, 
                `⚠️ Speed Alert: ${isp} dropped to ${download} Mbps`, 
                {
                    headers: { 'Title': 'Internet Slow' }
                }
            );
            console.log('Notification sent to phone.');
        }

    } catch (err) {
        console.error("Speed test failed. Router might be offline.");
        // Optional: Notify that the internet is completely out
        await axios.post(`https://ntfy.sh/${NTFY_TOPIC}`, "🚨 Connection Lost: Router may be offline.");
    }
}

// Set it to run every 30 minutes
cron.schedule('*/30 * * * *', () => {
    runSpeedCheck();
});

// Run once immediately when you start the script
runSpeedCheck();