import { useState } from "react";
import {
    DropDownMenu,
    DropDownMenuIndicator,
    DropDownMenuItem,
    LeftContainer,
    NavbarAvatar,
    NavbarContainer,
    NavbarItemContainer,
    NavbarItemLabel,
    NavbarLogo,
    NavbarShowIcon,
    NotificationBadge,
    NotificationIconContainer,
    RightContainer,
    SearchBar,
    SearchIconContainer,
} from "./style";
import { FaBars, FaBell, FaPowerOff, FaSearch } from "react-icons/fa";
import { colors } from "../../utils/GlobalStyles";
import user from '../../assets/user.png';
import logo from '../../assets/logo.png';

const Navbar = ({ openSidebar, logoutUser, navigate, dispatch }) => {

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [unreadNotifications, setUnreadNotifications] = useState(3);

    /*const handleSearch = () => {
        console.log('Procurar por: ', search);
    }*/

    return (
        <NavbarContainer>
            <NavbarShowIcon onClick={() => openSidebar()}>
                <FaBars />
            </NavbarShowIcon>
            <LeftContainer>
                <NavbarLogo src={logo} alt='Logo da empresa' onClick={() => navigate('/dashboard')} />
                <NavbarItemLabel onClick={() => navigate('/dashboard')}>JPL Solar</NavbarItemLabel>
            </LeftContainer>
            <RightContainer>
                <SearchIconContainer>
                    <FaSearch />
                </SearchIconContainer>
                <SearchBar
                    type="text"
                    id='search-nav'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                />
                <NotificationIconContainer>
                    <FaBell />
                    {
                        unreadNotifications > 0 && (
                            <NotificationBadge>{unreadNotifications > 9 ? '9+' : unreadNotifications}</NotificationBadge>
                        )
                    }
                </NotificationIconContainer>
                <NavbarItemContainer>
                    <NavbarAvatar $image={user} onClick={() => setOpen(!open)} />
                    {
                        open && (
                            <DropDownMenu>
                                <DropDownMenuIndicator />
                                <DropDownMenuItem onClick={() => navigate('/perfil')}>Meu Perfil</DropDownMenuItem>
                                <DropDownMenuItem onClick={() => logoutUser(navigate, dispatch)} color={colors.red}> <FaPowerOff style={{ marginRight: '5px' }} /> Logout</DropDownMenuItem>
                            </DropDownMenu>
                        )
                    }
                </NavbarItemContainer>
            </RightContainer>
        </NavbarContainer>
    );
}

export default Navbar;