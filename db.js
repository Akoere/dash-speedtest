const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'history.json');

const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// Initialize settings if not exists
if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ enabled: true, interval: 30 }, null, 2));
}

// If the file doesn't exist, create it with an empty list
if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify([]));
}

const db = {
    getSettings: () => {
        try {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        } catch (err) {
            return { enabled: true, interval: 30 };
        }
    },
    updateSettings: (newSettings) => {
        try {
            const current = db.getSettings();
            const updated = { ...current, ...newSettings };
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));
            return updated;
        } catch (err) {
            console.error("Failed to save settings:", err);
            return null;
        }
    },
    // This mimics the 'db.run' command you already have in monitor.js
    run: (query, params) => {
        try {
            const fileData = fs.readFileSync(FILE, 'utf8');
            const data = JSON.parse(fileData);
            
            data.push({
                timestamp: new Date().toISOString(),
                download: params[0],
                upload: params[3] || 0, // Store upload speed
                isp: params[1],
                status: params[2]
            });

            fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("Failed to save to JSON file:", err);
        }
    },
    
    // This will help the dashboard read the data later
    all: (query, params, callback) => {
        try {
            const fileData = fs.readFileSync(FILE, 'utf8');
            const data = JSON.parse(fileData);
            callback(null, data);
        } catch (err) {
            callback(err, null);
        }
    }
};

module.exports = db;