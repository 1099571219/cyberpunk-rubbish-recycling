import React from 'react';
import { BrowserRouter as Router, Route, createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/home/Home';
import About from '@/pages/about/About';
import NotFound from '@/pages/not-found/NotFound';

const router = createBrowserRouter([
  {
    element: <Home />,
    index:true
  },
  {
    path: "/About",
    element: <About />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;