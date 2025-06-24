import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BatchHistory from '../components/BatchHistory';
import { API_BASE_URL } from '../config';

describe('BatchHistory Component', () => {
  beforeEach(() => {
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
    
    // Mock window.open
    window.open = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders loading state initially', () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<BatchHistory />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders error when authentication required', async () => {
    window.localStorage.getItem.mockReturnValue(null);
    
    render(<BatchHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Authentication required')).toBeInTheDocument();
    });
  });

  test('fetches and displays batch history successfully', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    const mockBatches = [
      {
        batch_id: 'batch_123',
        created_at: '2024-01-15T10:30:00Z',
        valid_count: 25,
        invalid_count: 5,
        file_size: 1048576, // 1MB
        download_url: '/api/download/batch_123.csv'
      },
      {
        batch_id: 'batch_456',
        created_at: '2024-01-14T15:45:00Z',
        valid_count: 10,
        invalid_count: 2,
        file_size: 524288, // 512KB
        download_url: '/api/download/batch_456.csv'
      }
    ];
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBatches,
    });

    render(<BatchHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Batch Processing History')).toBeInTheDocument();
      expect(screen.getByText('batch_123')).toBeInTheDocument();
      expect(screen.getByText('batch_456')).toBeInTheDocument();
      expect(screen.getByText('25 Valid')).toBeInTheDocument();
      expect(screen.getByText('5 Invalid')).toBeInTheDocument();
      expect(screen.getByText('1 MB')).toBeInTheDocument();
      expect(screen.getByText('512 KB')).toBeInTheDocument();
    });
  });

  test('handles fetch error gracefully', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Server error' }),
    });

    render(<BatchHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  test('displays empty state when no batches', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<BatchHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('No batch history found.')).toBeInTheDocument();
    });
  });

  test('refreshes batch history when refresh button clicked', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    // Initial fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<BatchHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
    
    // Mock second fetch for refresh
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          batch_id: 'new_batch',
          created_at: '2024-01-16T12:00:00Z',
          valid_count: 15,
          invalid_count: 3,
          file_size: 2097152,
          download_url: '/api/download/new_batch.csv'
        }
      ],
    });
    
    fireEvent.click(screen.getByText('Refresh'));
    
    await waitFor(() => {
      expect(screen.getByText('new_batch')).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('handles download functionality', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    const mockBatch = {
      batch_id: 'batch_123',
      created_at: '2024-01-15T10:30:00Z',
      valid_count: 25,
      invalid_count: 5,
      file_size: 1048576,
      download_url: '/api/download/batch_123.csv'
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockBatch],
    });

    render(<BatchHistory />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Download CSV')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByLabelText('Download CSV'));
    
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('/api/download/batch_123.csv?token=valid-token'),
      '_blank'
    );
  });

  test('opens and closes preview dialog', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    const mockBatch = {
      batch_id: 'batch_123',
      created_at: '2024-01-15T10:30:00Z',
      valid_count: 25,
      invalid_count: 5,
      file_size: 1048576,
      download_url: '/api/download/batch_123.csv'
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockBatch],
    });

    render(<BatchHistory />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Preview Results')).toBeInTheDocument();
    });
    
    // Mock preview fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preview: [
          { filename: 'image1.jpg', result: 'Valid', confidence: 0.95 },
          { filename: 'image2.jpg', result: 'Invalid', confidence: 0.2 }
        ]
      }),
    });
    
    fireEvent.click(screen.getByLabelText('Preview Results'));
    
    await waitFor(() => {
      expect(screen.getByText('Batch Results Preview')).toBeInTheDocument();
      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });
    
    // Close dialog
    fireEvent.click(screen.getByText('Close'));
    
    await waitFor(() => {
      expect(screen.queryByText('Batch Results Preview')).not.toBeInTheDocument();
    });
  });

  test('handles preview fetch error', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    const mockBatch = {
      batch_id: 'batch_123',
      created_at: '2024-01-15T10:30:00Z',
      valid_count: 25,
      invalid_count: 5,
      file_size: 1048576,
      download_url: '/api/download/batch_123.csv'
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockBatch],
    });

    render(<BatchHistory />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Preview Results')).toBeInTheDocument();
    });
    
    // Mock preview fetch error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Preview not available' }),
    });
    
    fireEvent.click(screen.getByLabelText('Preview Results'));
    
    await waitFor(() => {
      expect(screen.getByText('No results available for preview.')).toBeInTheDocument();
    });
  });

  test('formats dates correctly', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    const mockBatch = {
      batch_id: 'batch_123',
      created_at: '2024-01-15T10:30:00Z',
      valid_count: 25,
      invalid_count: 5,
      file_size: 1048576,
      download_url: '/api/download/batch_123.csv'
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockBatch],
    });

    render(<BatchHistory />);
    
    await waitFor(() => {
      // Check that date is formatted (exact format may vary by locale)
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });
  });

  test('formats file sizes correctly', async () => {
    window.localStorage.getItem.mockReturnValue('valid-token');
    
    const mockBatches = [
      {
        batch_id: 'batch_1',
        created_at: '2024-01-15T10:30:00Z',
        valid_count: 1,
        invalid_count: 0,
        file_size: 0,
        download_url: '/api/download/batch_1.csv'
      },
      {
        batch_id: 'batch_2',
        created_at: '2024-01-15T10:30:00Z',
        valid_count: 1,
        invalid_count: 0,
        file_size: 1024,
        download_url: '/api/download/batch_2.csv'
      },
      {
        batch_id: 'batch_3',
        created_at: '2024-01-15T10:30:00Z',
        valid_count: 1,
        invalid_count: 0,
        file_size: 1073741824, // 1GB
        download_url: '/api/download/batch_3.csv'
      }
    ];
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBatches,
    });

    render(<BatchHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('0 Bytes')).toBeInTheDocument();
      expect(screen.getByText('1 KB')).toBeInTheDocument();
      expect(screen.getByText('1 GB')).toBeInTheDocument();
    });
  });
});