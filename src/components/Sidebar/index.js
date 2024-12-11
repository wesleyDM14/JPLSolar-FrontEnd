import React from "react";
import {
    Avatar,
    CloseContainer,
    LogoutContainer,
    LogoutTitle,
    MenuContainer,
    MenuItemContainer,
    MenuItemTitle,
    MenuTitleSection,
    Title,
    TitleContainer,
} from "./style";
import { FaFileAlt, FaMoneyBill, FaPowerOff, FaTasks, FaTimes, FaUserAlt, FaUsers } from "react-icons/fa";
import Logo from '../../assets/logo.png';
import { TbReportAnalytics, TbSolarPanel2 } from "react-icons/tb";
import { GrUserWorker } from "react-icons/gr";
import { hasPermission } from "../../utils/permissions";

const Sidebar = ({ sidebarOpen, closeSidebar, logoutUser, navigate, user, dispatch }) => {

    const userRole = user?.userRole || "CLIENTE";

    const menuSections = [
        {
            title: 'Gerenciamento',
            items: [
                { path: '/clientes', title: 'Clientes', icon: <FaUsers /> },
                { path: '/contratos', title: 'Contratos', icon: <FaFileAlt /> },
                { path: '/financeiro', title: 'Financeiro', icon: <FaMoneyBill /> },
                { path: '/parceiros', title: 'Parceiros', icon: <GrUserWorker /> },
                { path: '/plantas-solares', title: 'Plantas Solares', icon: <TbSolarPanel2 /> },
            ],
        },
        {
            title: 'Operacional',
            items: [
                { path: '/relatorios', title: 'Relatórios', icon: <TbReportAnalytics /> },
                { path: '/tarefas', title: 'Tarefas', icon: <FaTasks /> },
            ],
        },
        {
            title: 'Configurações',
            items: [
                { path: '/perfil', title: 'Perfil', icon: <FaUserAlt /> },
            ],
        },
    ];

    return (
        <div className={sidebarOpen ? 'sidebar-responsive' : ''} id="sidebar">
            <TitleContainer>
                <Avatar src={Logo} alt="Logo da Empresa" onClick={() => navigate('/dashboard')} />
                <Title>JPL Solar</Title>
                <CloseContainer>
                    <FaTimes onClick={() => closeSidebar()} aria-hidden={true} />
                </CloseContainer>
            </TitleContainer>
            <MenuContainer>
                {
                    menuSections.map((section) => {
                        const visibleItems = section.items.filter(item => hasPermission(userRole, item.path));

                        if (visibleItems.length === 0) return null;

                        return (
                            <React.Fragment key={section.title}>
                                <MenuTitleSection>{section.title}</MenuTitleSection>
                                {
                                    visibleItems.map((item) => (
                                        <MenuItemContainer key={item.path} onClick={() => navigate(item.path)}>
                                            {item.icon}
                                            <MenuItemTitle>{item.title}</MenuItemTitle>
                                        </MenuItemContainer>
                                    ))
                                }
                            </React.Fragment>
                        );
                    })
                }
                <LogoutContainer onClick={() => logoutUser(navigate, dispatch)}>
                    <FaPowerOff />
                    <LogoutTitle>Logout</LogoutTitle>
                </LogoutContainer>
            </MenuContainer>
        </div>
    )
}

export default Sidebar;