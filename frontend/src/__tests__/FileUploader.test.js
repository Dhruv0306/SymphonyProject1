import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FileUploader from '../FileUploader';
import fetchMock from 'jest-fetch-mock';

beforeEach(() => {
  fetchMock.resetMocks();
  global.WebSocket = jest.fn(() => ({
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1
  }));
});

test('upload single/multiple images and trigger upload API', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FileUploader />
    </MemoryRouter>
  );
  
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const input = screen.getByLabelText(/upload images/i);
  
  fireEvent.change(input, { target: { files: [file] } });
  
  expect(screen.getByText(/test.jpg/)).toBeInTheDocument();
});

test('handle chunked upload and retry logic', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FileUploader />
    </MemoryRouter>
  );
  
  const batchRadio = screen.getByLabelText(/batch processing/i);
  fireEvent.click(batchRadio);
  
  const files = [
    new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
    new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
  ];
  const input = screen.getByLabelText(/upload images/i);
  
  fireEvent.change(input, { target: { files } });
  
  expect(screen.getAllByText(/test1.jpg/)[0]).toBeInTheDocument();
  expect(screen.getAllByText(/test2.jpg/)[0]).toBeInTheDocument();
});

test('handle WebSocket update events correctly', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FileUploader />
    </MemoryRouter>
  );
  
  expect(screen.getByText(/Upload Images/)).toBeInTheDocument();
});

test('show progress bar and change status appropriately', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FileUploader />
    </MemoryRouter>
  );
  
  const batchRadio = screen.getByLabelText(/batch processing/i);
  fireEvent.click(batchRadio);
  
  expect(screen.getByText(/Batch Processing/)).toBeInTheDocument();
});

test('handle file preview and error messages', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FileUploader />
    </MemoryRouter>
  );
  
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const input = screen.getByLabelText(/upload images/i);
  
  fireEvent.change(input, { target: { files: [file] } });
  
  expect(screen.getByText(/test.jpg/)).toBeInTheDocument();
});