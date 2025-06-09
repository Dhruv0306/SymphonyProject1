// set-backend.js
const { exec } = require('child_process');

// Get all command line arguments
const args = process.argv.slice(2);
console.log('Received arguments:', args);

let backendUrl = 'http://localhost:8000'; // Default
let frontendPort = '3000'; // Default React port
let hostIP = 'localhost'; // Default host

// First try to find --backend=url format
const backendArg = args.find(arg => arg.startsWith('--backend='));
if (backendArg) {
    backendUrl = backendArg.split('=')[1];
    console.log('Found backend URL from --backend= format:', backendUrl);
}
// Then try to find --backend url format
else {
    const backendIndex = args.indexOf('--backend');
    if (backendIndex !== -1 && args[backendIndex + 1]) {
        backendUrl = args[backendIndex + 1];
        console.log('Found backend URL from --backend <url> format:', backendUrl);
    }
}

// Check for custom port in arguments
const portArg = args.find(arg => arg.startsWith('--port='));
if (portArg) {
    frontendPort = portArg.split('=')[1];
}

// Check for host in arguments
const hostIndex = args.indexOf('--host');
if (hostIndex !== -1 && args[hostIndex + 1]) {
    hostIP = args[hostIndex + 1];
}

const localUrl = `http://localhost:${frontendPort}`;
const networkUrl = `http://${hostIP}:${frontendPort}`;

console.log('\n📡 Frontend Access URLs:');
console.log(`   Local:    ${localUrl}`);
if (hostIP !== 'localhost') {
    console.log(`   Network:  ${networkUrl}`);
}
console.log(`\n🚀 Starting React app with backend: ${backendUrl}`);

const command = `cross-env REACT_APP_BACKEND_URL=${backendUrl} HOST=${hostIP} PORT=${frontendPort} react-scripts start`;
console.log('Executing command:', command);

exec(command, { stdio: 'inherit', shell: true }); 