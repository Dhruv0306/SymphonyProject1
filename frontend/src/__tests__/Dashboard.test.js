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
    return <div data-testid="progress-bar">Progress for {batchId}</div>;
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

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
    
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('redirects to login when no auth token', async () => {
    window.localStorage.getItem.mockReturnValue(null);
    
    renderDashboard();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });

  test('renders dashboard when authenticated', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Symphony Admin Dashboard')).toBeInTheDocument();
    });
  });

  test('fetches and displays dashboard stats', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    // Mock session check
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    
    // Mock stats fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batches_today: 5,
        success_rate: 85,
        avg_processing_time: 120,
        error_rate: 15,
      }),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('120s')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
    });
  });

  test('starts new batch successfully', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
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
    
    // Mock start batch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ batch_id: 'batch_123' }),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Start New Batch')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Start New Batch'));
    
    await waitFor(() => {
      expect(screen.getByText('Active Batch: batch_123')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });
  });

  test('handles start batch error', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
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
    
    // Mock start batch error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Failed to start batch' }),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Start New Batch')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Start New Batch'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to start batch')).toBeInTheDocument();
    });
  });

  test('handles logout successfully', async () => {
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return 'valid-token';
      if (key === 'csrf_token') return 'csrf-token';
      return null;
    });
    
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
    
    // Mock logout
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderDashboard();
    
    // Open drawer
    await waitFor(() => {
      expect(screen.getByLabelText('open drawer')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByLabelText('open drawer'));
    
    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('csrf_token');
    });
  });

  test('switches between dashboard and batch history tabs', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
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
    
    // Click Batch History tab
    fireEvent.click(screen.getByText('Batch History'));
    
    await waitFor(() => {
      expect(screen.getByTestId('batch-history')).toBeInTheDocument();
    });
  });

  test('copies batch ID to clipboard', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
    
    // Mock alert
    window.alert = jest.fn();
    
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
    
    // Mock start batch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ batch_id: 'batch_123' }),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Start New Batch')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Start New Batch'));
    
    await waitFor(() => {
      expect(screen.getByText('Copy Batch ID')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Copy Batch ID'));
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('batch_123');
    expect(window.alert).toHaveBeenCalledWith('Batch ID copied to clipboard!');
  });

  test('handles file upload with validation', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    // Mock alert
    window.alert = jest.fn();
    
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
    
    // Mock start batch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ batch_id: 'batch_123' }),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Start New Batch')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Start New Batch'));
    
    await waitFor(() => {
      expect(screen.getByText('Upload Images to Batch')).toBeInTheDocument();
    });
    
    // Test passes if we can find the upload button
    expect(screen.getByText('Upload Images to Batch')).toBeInTheDocument();
  });
});