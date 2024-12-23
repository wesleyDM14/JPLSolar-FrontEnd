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
    background-color: ${colors.background};
    margin-right: 5px;
    box-shadow: 5px 5px 13px ${colors.background}, -5px -5px 13px ${colors.white};

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

export const NotificationContainer = styled.div`
    background-color: ${colors.background};
    width: 95%;
    height: 100%;
`;

export const NotificationHeader = styled.div`
    display: grid;
    grid-template-columns: 3fr 0.5fr;
    min-width: 100%;
    padding: 10px;
    background-color: ${colors.white};
    border-radius: 5px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;

    @media only screen and (max-width: 978px){
        grid-template-columns: 1fr 0.2fr;
    }
`;

export const NotificationLabel = styled.h5`
    font-size: 14px;
`;

export const NotificationValueArea = styled.div`
    display: flex;
    align-items: center;
`;

export const NotificationValue = styled.span`
    font-weight: ${props => props.$isRead ? 400 : 700};

    @media only screen and (max-width: 978px){
       font-size: 12px;
    }
`;

export const NotificationValueLabel = styled.span`
    svg {
        margin-right: 5px;
    }
`;

export const SingleNotification = styled.div`
    display: grid;
    grid-template-columns: 3fr 0.5fr;
    height: 50px;
    min-width: 100%;
    align-items: center;
    padding: 10px;
    background-color: ${colors.white};
    cursor: pointer;
    overflow: hidden;

    @media only screen and (max-width: 978px){
        grid-template-columns: 1fr 0.2fr;
    }
`;

export const AdminNotificationContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: center;

    @media only screen and (max-width: 978px){
       flex-direction: column;
    }
`;

export const EditIconContainer = styled.div`
    margin-right: 45%;
    font-size: 18px;
    color: ${colors.mainText};

    @media only screen and (max-width: 978px){
       margin-right: 0;
       font-size: 14px;
    }
`;

export const DeleteIconContainer = styled.div`
    font-size: 18px;
    color: ${colors.red};

    @media only screen and (max-width: 978px){
       font-size: 14px;
    }
`;

export const DeleteContainer = styled.div`
    align-items: center;
    justify-content: center;
    display: flex;
    flex-direction: column;
    padding: 25px;
`;

export const DeleteTitle = styled.h5`
    font-size: 20px;
    color: ${colors.title};

    @media only screen and (max-width: 978px){
        font-size: 14px;
    }
`;

export const DeleteButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    margin-top: 25px;
    width: 100%;

    @media only screen and (max-width: 978px){
        flex-direction: column;
    }
`;
