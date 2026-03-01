const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const monitor = require('./monitor');

const PORT = 3000;
const HISTORY_FILE = path.join(__dirname, 'history.json');
const DASHBOARD_FILE = path.join(__dirname, 'index.html');

const server = http.createServer(async (req, res) => {
    // API: Get History
    if (req.url === '/api/history' && req.method === 'GET') {
        db.all('', [], (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Failed to read history" }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        });
        return;
    }

    // API: Get Settings
    if (req.url === '/api/settings' && req.method === 'GET') {
        const settings = db.getSettings();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(settings));
    }

    // API: Update Settings
    if (req.url === '/api/settings' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const newSettings = JSON.parse(body);
                const updated = db.updateSettings(newSettings);
                monitor.updateSchedule(); // Restart cron with new interval/state
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(updated));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Invalid settings data" }));
            }
        });
        return;
    }

    // API: Run Manual Test
    if (req.url === '/api/test-now' && req.method === 'POST') {
        try {
            const stats = await monitor.runSpeedCheck(true);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(stats));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // Static: Serve index.html
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(DASHBOARD_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end("Error loading dashboard");
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`Dashboard server running at http://localhost:${PORT}`);
});
