/**
 * Symphony Logo Detection Web Application
 * 
 * A React-based web interface for detecting Symphony logos in images.
 * Features:
 * - Single and batch image processing
 * - File upload and URL input support
 * - Real-time progress tracking
 * - Responsive design with mobile support
 * - Material-UI components for modern UI
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import BatchHistory from './components/BatchHistory';
import FileUploader from './FileUploader';


// Theme constants for consistent branding

// Sidebar width for responsive layout

// Add retry utility function at the top level

/**
 * Main application component handling logo detection functionality
 * @component
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FileUploader />}/>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/batch-history" element={<BatchHistory />} />
      </Routes>
    </Router>
  );
}


export default App;