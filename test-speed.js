const speedTest = require('speedtest-net');
const test = speedTest({ maxTime: 20000 });

test.on('data', data => {
    console.log('Data received:', JSON.stringify(data, null, 2));
    process.exit(0);
});

test.on('error', err => {
    console.error('Error:', err);
    process.exit(1);
});

test.on('config', config => console.log('Config received'));
test.on('servers', servers => console.log('Servers received:', servers.length));
