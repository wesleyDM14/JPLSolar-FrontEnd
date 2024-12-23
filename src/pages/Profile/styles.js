import styled from "styled-components";
import { colors } from "../../utils/GlobalStyles";

export const ProfileMainContainer = styled.div`
    grid-area: main;
    display: block;
    padding: 10px;

    @media only screen and (max-width: 978px){
        padding: 5px 10px;
    }
`;

export const ProfileContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-area: main;

    @media only screen and (max-width: 978px){
        display: flex;
        flex-direction: column;
        padding: 0 10px;
    }
`;

export const ProfileHeaderContainer = styled.div`
    display: flex;
    margin-bottom: 15px;
`;

export const ProfileHeaderTitle = styled.h2`
    font-size: 25px;
    font-weight: bold;
    color: ${colors.title};
`;

export const LeftContainer = styled.div`
    padding: 15px;
    border-radius: 5px;
    background-color: ${colors.white};
    margin-right: 5px;
    box-shadow: 5px 5px 13px ${colors.background}, -5px -5px 13px ${colors.white};
    display: flex;
    align-items: center;
    justify-content: center;

    @media only screen and (max-width: 978px){
        margin-right: 0;
        margin-bottom: 15px;
    }
`;

export const RightContainer = styled.div`
    padding: 15px;
    border-radius: 5px;
    background-color: ${colors.white};
    box-shadow: 5px 5px 13px ${colors.background}, -5px -5px 13px ${colors.white};
    display: flex;
    flex-direction: column;
`;

export const WarningContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const WarningIconContainer = styled.div`
    margin-right: 5px;
    font-size: 80px;
    color: ${colors.icon};
`;

export const TextContent = styled.p`
    color: ${colors.description};
    font-size: 1.3rem;

    @media only screen and (max-width: 978px){
        font-size: 1.3rem;
        text-align: center;
    }
`;

export const StyledFormArea = styled.div`
    margin-top: 15px;
`;

export const ButtonGroup = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    padding: 0px 35px;

    @media only screen and (max-width: 978px){
        flex-direction: column;
    }
`;

export const SubmitButton = styled.button`
    cursor: pointer;
    font-weight: 600;
    border: 1px solid ${colors.btnSecondary};
    border-radius: 4px;
    padding: 8px 12px;
    min-height: 40px;
    min-width: 100px;
    transition: all .2s ease-out;
    background-color: ${colors.btnPrimary};
    color: ${colors.white};

    &:hover{
        background-color: ${colors.hover};
    }

    @media only screen and (max-width: 978px){
        min-width: 80%;
    }
`;

export const BackButton = styled.button`
    cursor: pointer;
    margin-right: 15px;
    font-weight: 600;
    border: 1px solid ${colors.btnPrimary};
    border-radius: 4px;
    padding: 8px 12px;
    min-height: 40px;
    min-width: 100px;
    transition: all .2s ease-out;
    background-color: ${colors.btnSecondary};
    color: ${colors.mainText};

    &:hover{
        background-color: ${colors.background};
    }

    @media only screen and (max-width: 978px){
        min-width: 80%;
        margin-right: 0;
        margin-bottom: 15px;
    }
`;