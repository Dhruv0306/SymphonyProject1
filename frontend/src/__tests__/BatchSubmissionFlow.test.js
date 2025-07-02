import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import { API_BASE_URL } from '../config';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock ProgressBar component
jest.mock('../components/ProgressBar', () => {
  return function MockProgressBar({ batchId }) {
    return (
      <div data-testid="progress-bar">
        <div>Batch: {batchId}</div>
        <div>Progress: 0%</div>
      </div>
    );
  };
});

// Mock BatchHistory component
jest.mock('../components/BatchHistory', () => {
  return function MockBatchHistory() {
    return <div data-testid="batch-history">Batch History Component</div>;
  };
});

const renderDashboard = () => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Batch Submission Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue('valid-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
    
    // Mock fetch
    global.fetch = jest.fn();
    
    // Mock clipboard and alert
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn() },
    });
    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('complete batch submission workflow', async () => {
    // Mock session check
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    
    // Mock initial stats fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batches_today: 3,
        success_rate: 90,
        avg_processing_time: 45,
        error_rate: 10,
      }),
    });

    renderDashboard();
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Start New Batch')).toBeInTheDocument();
    });
    
    // Step 1: Start a new batch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ batch_id: 'batch_integration_test' }),
    });
    
    fireEvent.click(screen.getByText('Start New Batch'));
    
    await waitFor(() => {
      expect(screen.getByText('Active Batch: batch_integration_test')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });
    
    // Step 2: Copy batch ID
    fireEvent.click(screen.getByText('Copy Batch ID'));
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('batch_integration_test');
    expect(window.alert).toHaveBeenCalledWith('Batch ID copied to clipboard!');
  });

  test('batch management workflow', async () => {
    // Mock session check
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    
    // Mock stats fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Start New Batch')).toBeInTheDocument();
    });
    
    // Start first batch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ batch_id: 'batch_001' }),
    });
    
    fireEvent.click(screen.getByText('Start New Batch'));
    
    await waitFor(() => {
      expect(screen.getByText('Active Batch: batch_001')).toBeInTheDocument();
    });
    
    // Clear current batch
    fireEvent.click(screen.getByText('Clear'));
    
    await waitFor(() => {
      expect(screen.queryByText('Active Batch: batch_001')).not.toBeInTheDocument();
      expect(screen.getByText('Start New Batch')).toBeInTheDocument();
    });
  });

  test('navigation between dashboard and batch history', async () => {
    // Mock session check
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    
    // Mock stats fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Batch Processing Dashboard')).toBeInTheDocument();
    });
    
    // Navigate to Batch History
    fireEvent.click(screen.getByText('Batch History'));
    
    await waitFor(() => {
      expect(screen.getByTestId('batch-history')).toBeInTheDocument();
      expect(screen.queryByText('Batch Processing Dashboard')).not.toBeInTheDocument();
    });
    
    // Navigate back to Dashboard
    fireEvent.click(screen.getByText('Dashboard'));
    
    await waitFor(() => {
      expect(screen.getByText('Batch Processing Dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('batch-history')).not.toBeInTheDocument();
    });
  });
});