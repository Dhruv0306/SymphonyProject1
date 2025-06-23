/**
 * @file App.js
 * @description Entry point for the Symphony Logo Detection Web Application frontend.
 * Sets up the main application component and routing.
 * 
 * @module App
 */

import { RouterProvider } from 'react-router-dom';
import router from './router';

/**
 * App Component
 * Renders the RouterProvider with the application's router.
 * 
 * @returns {JSX.Element} The main application component.
 */
function App() {
  // In production, ensure router is configured for deployment environment.
  return <RouterProvider router={router} />;
}

export default App;