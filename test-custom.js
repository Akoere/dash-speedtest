const https = require('https');

async function measureSpeed() {
    const url = 'https://speed.cloudflare.com/__down?bytes=10000000'; // 10MB test file
    const startTime = Date.now();
    let receivedBytes = 0;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            res.on('data', (chunk) => {
                receivedBytes += chunk.length;
            });

            res.on('end', () => {
                const endTime = Date.now();
                const durationSeconds = (endTime - startTime) / 1000;
                const speedMbps = (receivedBytes * 8 / (1000 * 1000) / durationSeconds).toFixed(2);
                resolve(speedMbps);
            });

            res.on('error', (err) => reject(err));
        }).on('error', (err) => reject(err));
    });
}

measureSpeed()
    .then(speed => console.log(`Measured Speed: ${speed} Mbps`))
    .catch(err => console.error('Error:', err));
