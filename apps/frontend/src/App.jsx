import React from 'react';
import { RouterProvider, useLocation } from './router';
import HomePage from './pages/HomePage';
import JobPage from './pages/JobPage';

function AppRoutes() {
  const { pathname } = useLocation();

  if (pathname === '/jobs' || pathname === '/hot-jobs' || pathname === '/find-talent') {
    return <JobPage />;
  }

  return <HomePage />;
}

function App() {
  return (
    <RouterProvider>
      <AppRoutes />
    </RouterProvider>
  );
}

export default App;
