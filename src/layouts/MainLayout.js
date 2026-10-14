import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Shell from '../components/Shell';

// Moldura das telas internas (menu lateral + barra superior). As páginas ainda recebem
// `navigate` e `user` por props porque algumas telas antigas (Tarefas, Financeiro) dependem disso.
const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.session.user);

    return (
        <Shell>
            {React.cloneElement(children, { navigate, user })}
        </Shell>
    );
};

export default MainLayout;
