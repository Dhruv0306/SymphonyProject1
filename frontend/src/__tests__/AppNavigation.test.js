import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppNavigation from '../components/AppNavigation';

test('navigation links work', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppNavigation />
    </MemoryRouter>
  );
  
  const adminLink = screen.getByRole('link', { name: /admin/i });
  expect(adminLink).toBeInTheDocument();
  expect(adminLink).toHaveAttribute('href', '/admin/login');
});