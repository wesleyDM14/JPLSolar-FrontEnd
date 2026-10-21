import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi, notificacoesApi } from '../../api/resources';
import { Avatar } from '../../ui';
import { useDispatch, useSelector } from 'react-redux';
import { FaBars, FaBell, FaFileAlt, FaHardHat, FaMoneyBill, FaPowerOff, FaTasks, FaTimes, FaToolbox, FaUserCog, FaUsers } from 'react-icons/fa';
import { MdSpaceDashboard } from 'react-icons/md';
import { TbReportAnalytics, TbSolarPanel2 } from 'react-icons/tb';
import { logoutUser } from '../../services/authServices';
import logo from '../../assets/logo.png';
import { ADMINISTRACAO_MENU } from '../../pages/Administracao/menu';
import { FINANCEIRO_MENU } from '../../pages/Financial/menu';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import {
    Backdrop,
    Brand,
    Column,
    ContadorMenu,
    SubItem,
    SubMenu,
    Content,
    PageTransition,
    Frame,
    IconButton,
    MenuButton,
    Nav,
    NavItem,
    NavSectionTitle,
    SidebarFooter,
    SidebarPanel,
    TopbarBar,
    TopbarSpacer,
    UserChip,
} from './shell.styles';

const SECTIONS = [
    {
        title: 'Visão geral',
        items: [{ path: '/dashboard', title: 'Painel', icon: <MdSpaceDashboard /> }],
    },
    {
        title: 'Gerenciamento',
        items: [
            { path: '/clientes', title: 'Clientes', icon: <FaUsers /> },
            { path: '/contratos', title: 'Contratos', icon: <FaFileAlt /> },
            { path: '/usinas', title: 'Usinas', icon: <TbSolarPanel2 /> },
            { path: '/financeiro', title: 'Financeiro', icon: <FaMoneyBill />, submenu: FINANCEIRO_MENU },
        ],
    },
    {
        title: 'Operacional',
        items: [
            { path: '/relatorios', title: 'Relatórios', icon: <TbReportAnalytics /> },
            { path: '/servicos', title: 'Serviços em campo', icon: <FaHardHat /> },
            { path: '/equipe', title: 'Equipe e acessos', icon: <FaUserCog /> },
            { path: '/tarefas', title: 'Tarefas', icon: <FaTasks /> },
            { path: '/notificacoes', title: 'Notificações', icon: <FaBell />, contador: true },
            { path: '/administracao', title: 'Administração', icon: <FaToolbox />, submenu: ADMINISTRACAO_MENU },
        ],
    },
];

// A sessão guarda { accessToken, user, loginTime }; o nome fica em session.user.
function sessionUser(session) {
    return session?.user ?? session ?? {};
}

/**
 * Estrutura das telas internas: menu lateral fixo (gaveta no celular) + barra superior com busca global.
 * As páginas recebem `navigate` e `user` por props por compatibilidade com telas antigas.
 */
export default function Shell({ children }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const session = useSelector((state) => state.session.user);
    const [menuOpen, setMenuOpen] = useState(false);
    const user = sessionUser(session);

    // Foto e nome atualizados (o perfil invalida esta consulta ao salvar).
    const { data: me } = useQuery({ queryKey: ['me'], queryFn: authApi.me, enabled: Boolean(session), staleTime: 5 * 60 * 1000 });
    const nomeExibido = me?.name || me?.login || user.name || user.login || 'Usuário';

    // Mesmo cache do sino: o contador do menu não gera outra requisição.
    const { data: contagem } = useQuery({
        queryKey: ['notificacoes-contagem'],
        queryFn: notificacoesApi.count,
        enabled: Boolean(session),
        refetchInterval: 45 * 1000,
    });
    const naoLidas = contagem?.count ?? 0;

    // Fecha a gaveta ao navegar e com Esc.
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!menuOpen) return undefined;
        const onKey = (event) => event.key === 'Escape' && setMenuOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [menuOpen]);

    return (
        <Frame>
            <SidebarPanel $open={menuOpen} aria-label="Menu principal">
                <Brand type="button" onClick={() => navigate('/dashboard')}>
                    <img src={logo} alt="" />
                    <div>
                        <strong>JPL Solar</strong>
                        <span>Engenharia</span>
                    </div>
                </Brand>

                <Nav>
                    {SECTIONS.map((section) => (
                        <div key={section.title}>
                            <NavSectionTitle>{section.title}</NavSectionTitle>
                            {section.items.map((item) => (
                                <div key={item.path}>
                                    <NavItem to={item.path}>
                                        {item.icon}
                                        {item.title}
                                        {item.contador && naoLidas > 0 && <ContadorMenu>{naoLidas > 99 ? '99+' : naoLidas}</ContadorMenu>}
                                    </NavItem>
                                    {/* Submenu: aparece quando a seção está aberta. */}
                                    {item.submenu && location.pathname.startsWith(item.path) && (
                                        <SubMenu>
                                            {item.submenu.map((sub) => {
                                                const Icone = sub.icon;
                                                return (
                                                    <SubItem key={sub.path} to={sub.path} end={sub.exato}>
                                                        <Icone />
                                                        {sub.rotulo}
                                                    </SubItem>
                                                );
                                            })}
                                        </SubMenu>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </Nav>

                <SidebarFooter>
                    <UserChip>
                        <button type="button" className="perfil" title="Abrir meu perfil" onClick={() => navigate('/perfil')}>
                            <Avatar nome={nomeExibido} src={me?.foto} size={36} />
                            <span className="info">
                                <span className="name">{nomeExibido}</span>
                                <span className="role">{me?.cargo || 'Administrador'}</span>
                            </span>
                        </button>
                        <IconButton type="button" title="Sair" aria-label="Sair" onClick={() => logoutUser(navigate, dispatch)}>
                            <FaPowerOff />
                        </IconButton>
                    </UserChip>
                </SidebarFooter>
            </SidebarPanel>

            {menuOpen && <Backdrop onClick={() => setMenuOpen(false)} />}

            <Column>
                <TopbarBar>
                    <MenuButton type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen((open) => !open)}>
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </MenuButton>

                    <GlobalSearch />
                    <TopbarSpacer />

                    <ThemeToggle />
                    <NotificationBell />
                    <button
                        type="button"
                        title="Meu perfil"
                        aria-label="Meu perfil"
                        onClick={() => navigate('/perfil')}
                        style={{ border: 0, background: 'transparent', padding: 2, borderRadius: '50%', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                    >
                        <Avatar nome={nomeExibido} src={me?.foto} size={36} />
                    </button>
                </TopbarBar>

                <Content>
                    <PageTransition key={location.pathname}>{children}</PageTransition>
                </Content>
            </Column>
        </Frame>
    );
}
