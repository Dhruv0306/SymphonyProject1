import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import FileUploader from './FileUploader';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import BatchHistory from './components/BatchHistory';

// Router configuration for production environment
// - Uses React Router v6+ API
// - Enables future flags for improved performance and compatibility
// - Defines main application routes

/**
 * Application router configuration using React Router.
 *
 * Defines the main navigation structure for the frontend, including:
 * - File upload page at the root path ("/")
 * - Admin login page ("/admin/login")
 * - Admin dashboard ("/admin/dashboard")
 * - Admin batch history page ("/admin/batch-history")
 *
 * Also enables future React Router v7 features for improved performance and routing capabilities.
 *
 * @constant
 * @type {import('react-router-dom').Router}
 */
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Main file upload page */}
      <Route path="/" element={<FileUploader />} />
      {/* Admin login page */}
      <Route path="/admin/login" element={<AdminLogin />} />
      {/* Admin dashboard */}
      <Route path="/admin/dashboard" element={<Dashboard />} />
      {/* Batch history page for admin */}
      <Route path="/admin/batch-history" element={<BatchHistory />} />
    </>
  ),
  {
    // Future flags for production readiness
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

export default router;