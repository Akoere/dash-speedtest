const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'history.json');

// If the file doesn't exist, create it with an empty list
if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify([]));
}

const db = {
    // This mimics the 'db.run' command you already have in monitor.js
    run: (query, params) => {
        try {
            const fileData = fs.readFileSync(FILE, 'utf8');
            const data = JSON.parse(fileData);
            
            data.push({
                timestamp: new Date().toISOString(),
                download: params[0],
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