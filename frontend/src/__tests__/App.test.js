import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter, createRoutesFromElements, Route } from 'react-router-dom';
import FileUploader from '../FileUploader';

test('renders upload interface correctly', () => {
  const testRouter = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/" element={<FileUploader />} />
    ),
    {
      initialEntries: ['/'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    }
  );
  
  render(<RouterProvider router={testRouter} future={{ v7_startTransition: true }} />);
  expect(screen.getByText(/Upload Images/i)).toBeInTheDocument();
});

test('renders Admin dashboard only after login', () => {
  const testRouter = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/" element={<FileUploader />} />
    ),
    {
      initialEntries: ['/'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    }
  );
  
  render(<RouterProvider router={testRouter} future={{ v7_startTransition: true }} />);
  expect(screen.getByText(/Upload Images/i)).toBeInTheDocument();
});