import styled, { keyframes } from "styled-components";
import { colors } from "../../utils/GlobalStyles";

const LoadingScreenAnimation = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

export const HomeContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: ${colors.white};
    position: relative;
`;

export const Content = styled.div`
    display: grid;
    grid-template-columns: 1fr 2fr;
    background-color: ${colors.background};
    height: 50%;
    border-radius: 15px;

    @media only screen and (max-width: 978px){
        display: flex;
        flex-direction: column;
    }
`;

export const FirstColumn = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${colors.background};
    align-items: center;
    justify-content: center;
    padding: 45px;
`;

export const SecondColumn = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${colors.sidebar};
    align-items: center;
    justify-content: center;
    padding: 45px;
`;

export const Logo = styled.img`
    width: 120px;
    height: auto;
    margin: 5px;

    @media only screen and (max-width: 978px){
        width: 85px;
    }
`;

export const Title = styled.h2`
    font-size: ${props => props.size ? `${props.size}px` : '28px'};
    color: ${props => props.color ? props.color : colors.title};
    font-weight: bold;
    text-transform: capitalize;

    @media only screen and (max-width: 978px){
        font-size: 18px;
    }
`;

export const Description = styled.p`
    font-size: 18px;
    font-weight: 300;
    color: ${colors.description};
    margin-top: ${props => props.$marginTop ? props.$marginTop : '0'};

    @media only screen and (max-width: 978px){
        font-size: 14px;
    }
`;

export const Button = styled.button`
    cursor: pointer;
    font-weight: 600;
    border: 1px solid ${colors.btnSecondary};
    border-radius: 4px;
    padding: 20px;
    width: 30%;
    transition: all .2s ease-out;
    background-color: ${colors.btnPrimary};
    color: ${colors.title};
    margin-top: 15px;

    &:hover{
        background-color: ${colors.btnSecondary};
    }

    @media only screen and (max-width: 978px){
        width: 80%;
    }
`;

export const IconsContainer = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-around;
`;

export const Icon = styled.a`
    color: ${colors.icon};
    font-size: 45px;
    margin-top: 15px;
    transition: transform 0.3s ease-in-out;

    &:hover{
        transform: scale(1.2);
    }

    @media only screen and (max-width: 978px){
        font-size: 30px;
    }
`;

export const FormArea = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    align-items: center;
    justify-content: center;
`;

export const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: ${LoadingScreenAnimation} 1s;
`;