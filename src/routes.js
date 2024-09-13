import React from 'react';
import { Routes, Route } from 'react-router-dom';

import BasicRoute from './components/BasicRoute';
import AuthRoute from './components/AuthRoute';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';


export const AppRoutes = () => (
    <Routes>
        <Route path='/' element={<BasicRoute><Home /></BasicRoute>} />
        <Route path='/dashboard' element={<AuthRoute><MainLayout><Dashboard /></MainLayout></AuthRoute>} />
    </Routes>
);