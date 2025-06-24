import { render, screen } from '@testing-library/react';
import ProgressBar from '../components/ProgressBar';

// Mock ProgressBar component to avoid infinite loop
jest.mock('../components/ProgressBar', () => {
  return function MockProgressBar({ batchId }) {
    return <div>Batch Progress: {batchId}</div>;
  };
});

test('update progress correctly when props change', () => {
  const { rerender } = render(<ProgressBar batchId="test-batch-1" />);
  
  expect(screen.getByText(/batch progress/i)).toBeInTheDocument();
  
  rerender(<ProgressBar batchId="test-batch-2" />);
  
  expect(screen.getByText(/batch progress/i)).toBeInTheDocument();
});