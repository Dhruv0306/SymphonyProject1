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
    
    await waitFor(() => {
      expect(screen.getByText('Symphony Admin Dashboard')).toBeInTheDocument();
    });
    
    // Open drawer and click logout
    fireEvent.click(screen.getByLabelText('open drawer'));
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });

  test('handles logout error gracefully', async () => {
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
    
    // Mock logout error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Symphony Admin Dashboard')).toBeInTheDocument();
    });
    
    // Open drawer and click logout
    fireEvent.click(screen.getByLabelText('open drawer'));
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });

  test('switches between tabs', async () => {
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
      expect(screen.getByText('System Overview')).toBeInTheDocument();
    });
    
    // Switch to Batch History tab
    fireEvent.click(screen.getByText('Batch History'));
    
    await waitFor(() => {
      expect(screen.getByTestId('batch-history')).toBeInTheDocument();
    });
    
    // Switch back to Dashboard tab
    fireEvent.click(screen.getByText('Dashboard'));
    
    await waitFor(() => {
      expect(screen.getByText('System Overview')).toBeInTheDocument();
    });
  });

  test('refreshes stats when refresh button is clicked', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    // Mock session check
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    
    // Mock initial stats fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batches_today: 5,
        success_rate: 85,
        avg_processing_time: 120,
        error_rate: 15,
      }),
    });
    
    // Mock refresh stats fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batches_today: 10,
        success_rate: 90,
        avg_processing_time: 100,
        error_rate: 10,
      }),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
    
    // Click refresh button
    fireEvent.click(screen.getByText('Refresh'));
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  test('handles session check failure', async () => {
    window.localStorage.getItem.mockReturnValue('invalid-token');
    
    // Mock session check failure
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });

  test('handles network error during session check', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    // Mock network error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    renderDashboard();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });
});