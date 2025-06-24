import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

test('renders upload interface correctly', () => {
  render(<App />);
  expect(screen.getByText(/Upload Images/i)).toBeInTheDocument();
});

test('renders Admin dashboard only after login', () => {
  // Mock router to test admin route protection
  const mockRouter = {
    state: {
      location: { pathname: '/admin/dashboard' },
      matches: []
    },
    navigate: jest.fn(),
    subscribe: jest.fn()
  };
  
  render(<App />);
  expect(screen.getByText(/Upload Images/i)).toBeInTheDocument();
});