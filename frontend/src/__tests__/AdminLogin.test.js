import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLogin from '../components/AdminLogin';
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

beforeEach(() => {
  global.fetch = jest.fn();
  mockNavigate.mockClear();
  localStorage.clear();
});

test('submit form with valid credentials → mock backend → redirect', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ token: 'test-token' })
  });
  
  render(
    <MemoryRouter>
      <AdminLogin />
    </MemoryRouter>
  );
  
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'admin' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/login'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
  });
});

test('handle invalid credentials gracefully', async () => {
  global.fetch.mockRejectedValueOnce(new Error('Invalid credentials'));
  
  render(
    <MemoryRouter>
      <AdminLogin />
    </MemoryRouter>
  );
  
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wrong' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
  });
});