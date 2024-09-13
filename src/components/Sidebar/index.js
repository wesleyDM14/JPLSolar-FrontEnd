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
                <Avatar src={Logo} alt="Logo da Empresa" />
                <Title>JPL Solar</Title>
                <CloseContainer>
                    <FaTimes onClick={() => closeSidebar()} aria-hidden={true} />
                </CloseContainer>
            </TitleContainer>
            <MenuContainer>
                <MenuTitleSection>ADMINISTRATIVO</MenuTitleSection>
                <MenuItemContainer>
                    <FaUsers />
                    <MenuItemTitle>Clientes</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer>
                    <FaFileAlt />
                    <MenuItemTitle>Contratos</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer>
                    <FaMoneyBill />
                    <MenuItemTitle>Financeiro</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer>
                    <TbSolarPanel2 />
                    <MenuItemTitle>Plantas Solares</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer>
                    <TbReportAnalytics />
                    <MenuItemTitle>Relatórios</MenuItemTitle>
                </MenuItemContainer>
                <MenuItemContainer>
                    <FaTasks />
                    <MenuItemTitle>Tarefas</MenuItemTitle>
                </MenuItemContainer>
                <MenuTitleSection>PESSOAL</MenuTitleSection>
                <MenuItemContainer>
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