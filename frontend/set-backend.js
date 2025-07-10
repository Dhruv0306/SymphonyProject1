/**
 * Backend Configuration and React App Launcher
 * 
 * This script configures and launches the Symphony Logo Detection React application with
 * customizable backend and frontend parameters. It handles command-line arguments to 
 * dynamically set the backend URL, WebSocket URL, host interface, and port.
 * 
 * Features:
 * - Dynamic backend URL configuration
 * - WebSocket URL auto-generation
 * - Flexible host and port configuration
 * - Environment variable injection for React application
 * - Cross-platform support via cross-env
 * 
 * Usage:
 *   node set-backend.js [options]
 * 
 * Options:
 *   --backend=<url>     Set custom backend URL
 *   --backend <url>     Alternative syntax for setting backend URL
 *   --port=<port>       Set custom frontend port (default: 3000)
 *   --host <host>       Set custom host interface (default: localhost)
 * 
 * Examples:
 *   node set-backend.js --backend=http://api.example.com --port=3001
 *   node set-backend.js --host 0.0.0.0 --backend http://localhost:8000
 * 
 * Environment Variables Set:
 *   REACT_APP_BACKEND_URL: The URL of the backend API server
 *   REACT_APP_WS_URL: WebSocket URL derived from the backend URL
 *   HOST: The network interface to bind the frontend server to
 *   PORT: The port number for the frontend server
 * 
 * @module set-backend
 * @author Symphony AI Team
 * @version 1.2.0
 */

// Production Notes:
// - For production deployment, ensure to:
//   1. Set appropriate production backend URL
//   2. Configure proper SSL/TLS for WebSocket connections
//   3. Update environment variables in deployment configuration
//   4. Consider using process.env.NODE_ENV to handle production vs development logic

const { exec } = require('child_process');

/**
 * Parse and process command-line arguments.
 * 
 * Extracts options like backend URL, port, and host from command-line arguments
 * using both --option=value and --option value syntax patterns.
 */

// Parse command line arguments
const args = process.argv.slice(2);
console.log('Received arguments:', args);

/**
 * Default configuration values for the application.
 * 
 * These defaults are used when no command-line arguments are provided.
 * For production environments, these should be updated via environment variables
 * or deployment configuration.
 */

// Set default values
// Production: Update these defaults based on your production environment
let backendUrl = 'http://localhost:8000'; // Default backend URL
let frontendPort = '3000';                // Default React dev server port
let hostIP = 'localhost';                 // Default host for React dev server

/**
 * Process backend URL from command-line arguments.
 * 
 * Supports two syntax patterns:
 * 1. --backend=http://example.com
 * 2. --backend http://example.com
 */

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

/**
 * Process frontend port configuration from command-line arguments.
 * 
 * In production environments, the port should be configured through
 * environment variables rather than command-line arguments.
 */

// Check for custom frontend port in --port=<port> format
// Production: Port should be configured via environment variables in production
const portArg = args.find(arg => arg.startsWith('--port='));
if (portArg) {
    frontendPort = portArg.split('=')[1];
}

/**
 * Process host interface configuration from command-line arguments.
 * 
 * Setting host to '0.0.0.0' allows connections from any network interface,
 * which is useful for development across devices or in containerized environments.
 */

// Check for custom host in --host <host> format
// Production: Host should be configured via environment variables in production
const hostIndex = args.indexOf('--host');
if (hostIndex !== -1 && args[hostIndex + 1]) {
    hostIP = args[hostIndex + 1];
}

/**
 * Generate access URLs for local and network access.
 * 
 * These URLs are displayed in the console to help developers
 * access the application during development.
 */

// Construct URLs for local and network access
// Production: These URLs should be configured via environment variables
const localUrl = `http://localhost:${frontendPort}`;
const networkUrl = `http://${hostIP}:${frontendPort}`;

/**
 * Display application access information.
 * 
 * Shows URLs for accessing the frontend application locally,
 * over the network (if applicable), and the admin dashboard.
 */

// Display frontend access URLs
console.log('\n📡 Frontend Access URLs:');
console.log(`   Local:    ${localUrl}`);
if (hostIP !== 'localhost') {
    console.log(`   Network:  ${networkUrl}`);
}
console.log(`   Admin Dashboard: ${localUrl}/admin/dashboard`);
console.log(`\n🚀 Starting React app with backend: ${backendUrl}`);

/**
 * Generate WebSocket URL from backend URL.
 * 
 * Converts HTTP URLs to WebSocket URLs:
 * - http:// → ws://
 * - https:// → wss://
 * 
 * In production, always use secure WebSockets (wss://) for security.
 */

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

/**
 * Execute the React development server with configured environment variables.
 * 
 * In production environments, this would be replaced with a build and
 * deployment process using a production-grade web server.
 */

// Start the React development server with the specified environment variables
// Production: This should be replaced with production server deployment
const child = exec(command, { shell: true });

/**
 * Forward child process output to parent process.
 * 
 * This ensures that React development server output is visible
 * in the console that launched this script.
 */

// Pipe output to parent process
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

/**
 * Handle child process exit events.
 * 
 * Propagates the exit code from the React development server
 * to the parent process for proper error handling.
 */

// Handle process exit
child.on('exit', (code) => {
    console.log(`React app exited with code ${code}`);
    process.exit(code);
});

/**
 * Handle child process error events.
 * 
 * Logs errors that occur when attempting to start the React
 * development server and exits with an error code.
 */

// Handle errors
child.on('error', (error) => {
    console.error('Error starting React app:', error);
    process.exit(1);
});
