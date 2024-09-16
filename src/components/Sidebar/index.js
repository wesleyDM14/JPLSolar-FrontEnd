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


const Sidebar = ({ sidebarOpen, closeSidebar, logoutUser, navigate, user, dispatch }) => {
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
                <MenuTitleSection>ADMINISTRATIVO</MenuTitleSection>
                <MenuItemContainer onClick={() => navigate('/clientes')}>
                    <FaUsers />
                    <MenuItemTitle>Clientes</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer onClick={() => navigate('/contratos')}>
                    <FaFileAlt />
                    <MenuItemTitle>Contratos</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer onClick={() => navigate('/financeiro')}>
                    <FaMoneyBill />
                    <MenuItemTitle>Financeiro</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer onClick={() => navigate('/plantas-solares')}>
                    <TbSolarPanel2 />
                    <MenuItemTitle>Plantas Solares</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer onClick={() => navigate('/relatorios')}>
                    <TbReportAnalytics />
                    <MenuItemTitle>Relatórios</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer onClick={() => navigate('/tarefas')}>
                    <FaTasks />
                    <MenuItemTitle>Tarefas</MenuItemTitle>
                </MenuItemContainer>
                <MenuTitleSection>PESSOAL</MenuTitleSection>
                <MenuItemContainer onClick={() => navigate('/perfil')}>
                    <FaUserAlt />
                    <MenuItemTitle>Perfil</MenuItemTitle>
                </MenuItemContainer>
                <LogoutContainer onClick={() => logoutUser(navigate, dispatch)}>
                    <FaPowerOff />
                    <LogoutTitle>Logout</LogoutTitle>
                </LogoutContainer>
            </MenuContainer>
        </div>
    )
}

export default Sidebar;