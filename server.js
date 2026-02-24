const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HISTORY_FILE = path.join(__dirname, 'history.json');
const DASHBOARD_FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
    // API: Get History
    if (req.url === '/api/history' && req.method === 'GET') {
        if (!fs.existsSync(HISTORY_FILE)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify([]));
        }

        fs.readFile(HISTORY_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Failed to read history" }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // Static: Serve index.html
    if (req.url === '/' || req.url === '/index.html') {
        if (!fs.existsSync(DASHBOARD_FILE)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end("Dashboard index.html not found");
        }

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
    console.log(`- Dashboard: http://localhost:${PORT}/`);
    console.log(`- API:       http://localhost:${PORT}/api/history`);
});
