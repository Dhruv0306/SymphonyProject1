// set-backend.js
const { exec } = require('child_process');

// Get all command line arguments
const args = process.argv.slice(2);
console.log('Received arguments:', args);

let backendUrl = 'http://localhost:8000'; // Default

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

console.log(`🚀 Starting React app with backend: ${backendUrl}`);

const command = `cross-env REACT_APP_BACKEND_URL=${backendUrl} react-scripts start`;
console.log('Executing command:', command);

exec(command, { stdio: 'inherit', shell: true }); 