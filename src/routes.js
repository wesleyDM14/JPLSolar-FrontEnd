import React from 'react';
import { Routes, Route } from 'react-router-dom';

import BasicRoute from './components/BasicRoute';

import Home from './pages/Home';

export const AppRoutes = () => (
    <Routes>
        <Route path='/' element={<BasicRoute><Home /></BasicRoute>} />
    </Routes>
);