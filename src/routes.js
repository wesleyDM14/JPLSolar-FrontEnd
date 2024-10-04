import React from 'react';
import { Routes, Route } from 'react-router-dom';

import BasicRoute from './components/BasicRoute';
import AuthRoute from './components/AuthRoute';

import MainLayout from './layouts/MainLayout';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Contracts from './pages/Contracts';
import Financial from './pages/Financial';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import SolarPlants from './pages/SolarPlants';
import Tasks from './pages/Tasks';

import NewClient from './pages/Clients/newClient.js';
import NewContract from './pages/Contracts/newContract.js';


export const AppRoutes = () => (
    <Routes>
        <Route path='/' element={<BasicRoute><Home /></BasicRoute>} />
        <Route path='/dashboard' element={<AuthRoute><MainLayout><Dashboard /></MainLayout></AuthRoute>} />
        <Route path='/clientes' element={<AuthRoute><MainLayout><Clients /></MainLayout></AuthRoute>} />
        <Route path='/clientes/novo' element={<AuthRoute><MainLayout><NewClient /></MainLayout></AuthRoute>} />
        <Route path='/contratos' element={<AuthRoute><MainLayout><Contracts /></MainLayout></AuthRoute>} />
        <Route path='/contratos/novo' element={<AuthRoute><MainLayout><NewContract /></MainLayout></AuthRoute>} />
        <Route path='/financeiro' element={<AuthRoute><MainLayout><Financial /></MainLayout></AuthRoute>} />
        <Route path='/perfil' element={<AuthRoute><MainLayout><Profile /></MainLayout></AuthRoute>} />
        <Route path='/relatorios' element={<AuthRoute><MainLayout><Reports /></MainLayout></AuthRoute>} />
        <Route path='/plantas-solares' element={<AuthRoute><MainLayout><SolarPlants /></MainLayout></AuthRoute>} />
        <Route path='/tarefas' element={<AuthRoute><MainLayout><Tasks /></MainLayout></AuthRoute>} />
    </Routes>
);