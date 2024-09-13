import styled from "styled-components";
import { Link } from "react-router-dom";
import { colors } from "../../utils/GlobalStyles";

export const NavbarContainer = styled.nav`
    background: ${colors.navbar};
    grid-area: nav;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;
    border-bottom: 1px solid ${colors.sidebar};
`;

export const LeftContainer = styled.div`
    display: flex;
    align-items: center;

    @media only screen and (max-width: 978px) {
        display: none;
    }
`;

export const RightContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const NavbarLogo = styled.img`
    width: 30px;
    height: 30px;
    margin: auto;
    cursor: pointer;
`;

export const NavbarItemContainer = styled.div`
    position: relative;
`;

export const NavbarItemLabel = styled(Link)`
    color: ${colors.white};
    font-family: 'Montserrat', sans-serif;
    margin-left: 5px;
    text-decoration: none;
`;

export const NavbarShowIcon = styled.div`
    display: none;
    color: ${colors.white};
    margin-right: 15px;

    @media only screen and (max-width: 978px) {
        display: inline;
    }
`;

export const NavbarAvatar = styled.div`
    width: 30px;
    height: 30px;
    background-image: url(${props => props.$image});
    background-size: cover;
    background-position: center;
    margin: auto;
    cursor: pointer;
    filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(360deg) brightness(100%) contrast(100%);
`;

export const DropDownMenu = styled.div`
    position: absolute;
    top: 58px;
    width: 150px;
    transform: translateX(-70%);
    background-color: ${colors.sidebar};
    border: 1px solid ${colors.navbar};
    border-radius: 8px;
    padding: 1rem;
    z-index: 9999;
`;

export const DropDownMenuIndicator = styled.div`
    width: 20px;
    height: 20px;
    position: absolute;
    right: 20px;
    top: -8px;
    z-index: 10;
    background-color: ${colors.sidebar};
    transform: rotate(45deg);
    border-radius: 3px 10px 24px;
`;

export const DropDownMenuItem = styled.a`
    height: 50px;
    display: flex;
    align-items: center;
    border-radius: 15px;
    transition: background 500ms;
    padding: 0.5rem;
    color: ${props => props.color ? props.color : colors.white};
    cursor: pointer;

    &:hover{
        background-color: rgba(62, 161, 117, 0.3);
    }
`;

export const SearchBar = styled.input`
    height: 30px;
    border-radius: 15px;
    border: none;
    padding: 0 10px;
    margin-right: 15px;
    background-color: ${colors.white};
    color: ${colors.mainText};

    &:focus {
        outline: none;
        box-shadow: 0px 0px 5px ${colors.sidebar};
    }
`;

export const SearchIconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    cursor: pointer;
    color: ${colors.white};
`;

export const NotificationIconContainer = styled.div`
    display: flex;
    position: relative;
    font-size: 24px;
    margin-right: 20px;
    cursor: pointer;
    color: ${colors.white};
`;

export const NotificationBadge = styled.div`
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: ${colors.red}; // Cor vermelha para indicar notificações
    color: ${colors.icon};
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
`;