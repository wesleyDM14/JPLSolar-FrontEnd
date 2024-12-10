import styled from "styled-components";
import { Link } from "react-router-dom";
import { colors } from "../../utils/GlobalStyles";

export const TitleContainer = styled.div`
    display: grid;
    grid-template-columns: 1.5fr 2fr 0.5fr;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 30px;
    border-radius: 25px;
    background-color: rgba(255, 255, 255, 0.2);
`;

export const Avatar = styled.img`
    width: 80px;
    height: 80px;
    margin: auto;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        transform: scale(1.2);
    }

    @media only screen and (max-width: 978px) {
        width: 40px;
        height: 40px;
    }
`;

export const Title = styled.h1`
    font-size: 18px;
    display: inline;
    color: ${colors.title};

    @media only screen and (max-width: 978px) {
        font-size: 16px;
    }
`;

export const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

export const CloseContainer = styled.div`
    font-size: 18px;
    color: ${colors.icon};
    display: none;

    @media only screen and (max-width: 978px) {
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;

export const MenuTitleSection = styled.h2`
    color: ${colors.white};
    font-size: 20px;
    margin-top: 15px;
    margin-bottom: 5px;
    padding: 0 10px;
    font-weight: 700;

    @media only screen and (max-width: 978px) {
        font-size: 16px;
    }
`;

export const MenuItemContainer = styled.div`
    color: ${colors.icon};
    padding: 10px;
    border-radius: 3px;
    margin-bottom: 5px;
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 20px;
    cursor: pointer;

    &:hover{
        background: rgba(255, 161, 117, 0.3);
        border-radius: 3px;
    }

    @media only screen and (max-width: 978px) {
        font-size: 16px;
    }
`;

export const MenuItemTitle = styled(Link)`
    text-decoration: none;
    color: ${colors.white};
    font-weight: 700;
    font-size: 16px;
    margin-left: 15px;
    transition: all 0.2s;

    &:hover {
        transform: scale(1.1);
        margin-left: 20px;
    }

    @media only screen and (max-width: 978px) {
        font-size: 14px;
    }
`;

export const LogoutContainer = styled.div`
    display: flex;
    margin-top: 10px;
    padding: 10px;
    color: ${colors.red};
    align-items: center;
`;

export const LogoutTitle = styled.a`
    cursor: pointer;
    text-decoration: none;
    font-weight: 700;
    text-transform: uppercase;
    margin-left: 10px;
    transition: all 0.2s;

    &:hover {
        transform: scale(1.2);
        margin-left: 15px;
    }
`;