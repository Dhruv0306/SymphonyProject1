// set-backend.js
// Production Notes:
// - For production deployment, ensure to:
//   1. Set appropriate production backend URL
//   2. Configure proper SSL/TLS for WebSocket connections
//   3. Update environment variables in deployment configuration
//   4. Consider using process.env.NODE_ENV to handle production vs development logic

const { exec } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
console.log('Received arguments:', args);

// Set default values
// Production: Update these defaults based on your production environment
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
// Production: Port should be configured via environment variables in production
const portArg = args.find(arg => arg.startsWith('--port='));
if (portArg) {
    frontendPort = portArg.split('=')[1];
}

// Check for custom host in --host <host> format
// Production: Host should be configured via environment variables in production
const hostIndex = args.indexOf('--host');
if (hostIndex !== -1 && args[hostIndex + 1]) {
    hostIP = args[hostIndex + 1];
}

// Construct URLs for local and network access
// Production: These URLs should be configured via environment variables
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

// Generate WebSocket URL from backend URL
// Production: Ensure WSS (secure WebSocket) is used in production
const wsUrl = backendUrl.replace(/^http/, 'ws');
console.log(`📡 WebSocket URL: ${wsUrl}`);

// Build the command to start the React app with environment variables
// Production: Use production build command and environment-specific variables
/**
 * Constructs a shell command to start the React frontend with custom environment variables.
 *
 * - `REACT_APP_BACKEND_URL`: The URL of the backend server.
 * - `REACT_APP_WS_URL`: The WebSocket URL for real-time communication.
 * - `HOST`: The IP address to bind the frontend server.
 * - `PORT`: The port number for the frontend server.
 * - Uses `cross-env` to ensure environment variables work across platforms.
 * - Runs `react-scripts start` to launch the development server.
 *
 * @type {string}
 */
const command = `cross-env REACT_APP_BACKEND_URL=${backendUrl} REACT_APP_WS_URL=${wsUrl} HOST=${hostIP} PORT=${frontendPort} react-scripts start`;
console.log('Executing command:', command);

// Start the React development server with the specified environment variables
// Production: This should be replaced with production server deployment
const child = exec(command, { shell: true });

// Pipe output to parent process
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

// Handle process exit
child.on('exit', (code) => {
    console.log(`React app exited with code ${code}`);
    process.exit(code);
});

// Handle errors
child.on('error', (error) => {
    console.error('Error starting React app:', error);
    process.exit(1);
});
