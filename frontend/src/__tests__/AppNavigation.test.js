import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppNavigation from '../components/AppNavigation';

test('navigation links work', () => {
  render(
    <MemoryRouter>
      <AppNavigation />
    </MemoryRouter>
  );
  
  const adminLink = screen.getByRole('link', { name: /admin/i });
  expect(adminLink).toBeInTheDocument();
  expect(adminLink).toHaveAttribute('href', '/admin/login');
});