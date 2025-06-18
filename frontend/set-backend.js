// set-backend.js

const { exec } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
console.log('Received arguments:', args);

// Set default values
let backendUrl = 'http://localhost:8000'; // Default backend URL
let frontendPort = '3000';                // Default React dev server port
let hostIP = 'localhost';                 // Default host for React dev server

// Check for backend URL in --backend=<url> format
const backendArg = args.find(arg => arg.startsWith('--backend='));
if (backendArg) {
    backendUrl = backendArg.split('=')[1];
    console.log('Found backend URL from --backend= format:', backendUrl);
} else {
    // Check for backend URL in --backend <url> format
    const backendIndex = args.indexOf('--backend');
    if (backendIndex !== -1 && args[backendIndex + 1]) {
        backendUrl = args[backendIndex + 1];
        console.log('Found backend URL from --backend <url> format:', backendUrl);
    }
}

// Check for custom frontend port in --port=<port> format
const portArg = args.find(arg => arg.startsWith('--port='));
if (portArg) {
    frontendPort = portArg.split('=')[1];
}

// Check for custom host in --host <host> format
const hostIndex = args.indexOf('--host');
if (hostIndex !== -1 && args[hostIndex + 1]) {
    hostIP = args[hostIndex + 1];
}

// Construct URLs for local and network access
const localUrl = `http://localhost:${frontendPort}`;
const networkUrl = `http://${hostIP}:${frontendPort}`;

// Display frontend access URLs
console.log('\n📡 Frontend Access URLs:');
console.log(`   Local:    ${localUrl}`);
if (hostIP !== 'localhost') {
    console.log(`   Network:  ${networkUrl}`);
}
console.log(`   Admin Dashboard: ${localUrl}/admin/dashboard`);
console.log(`\n🚀 Starting React app with backend: ${backendUrl}`);

// Build the command to start the React app with environment variables
const command = `cross-env REACT_APP_BACKEND_URL=${backendUrl} HOST=${hostIP} PORT=${frontendPort} react-scripts start`;
console.log('Executing command:', command);

// Start the React development server with the specified environment variables
exec(command, { stdio: 'inherit', shell: true });