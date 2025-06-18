import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import FileUploader from './FileUploader';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import BatchHistory from './components/BatchHistory';

// Create router with future flags enabled
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<FileUploader />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/batch-history" element={<BatchHistory />} />
    </>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

export default router;