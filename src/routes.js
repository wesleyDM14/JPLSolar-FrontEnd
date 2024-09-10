import React from 'react';
import { Routes, Route } from 'react-router-dom';

import BasicRoute from './components/BasicRoute';
import AuthRoute from './components/AuthRoute';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';


export const AppRoutes = () => (
    <Routes>
        <Route path='/' element={<BasicRoute><Home /></BasicRoute>} />
        <Route path='/dashboard' element={<AuthRoute><Dashboard /></AuthRoute>} />
    </Routes>
);