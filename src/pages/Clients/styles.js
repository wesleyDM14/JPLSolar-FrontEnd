import styled from "styled-components";
import { colors } from "../../utils/GlobalStyles";

export const ClientsContainer = styled.div`
    grid-area: main;
    display: block;

    @media only screen and (max-width: 978px){
        padding: 0 10px;
    }
`;

export const ClientHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 35px;

    @media only screen and (max-width: 978px){
        padding: 0;
    }
`

export const ClientTitle = styled.h1`
    display: flex;
    align-items: center;
    font-size: 26px;
    color: ${colors.title};
    font-weight: 700;

    @media only screen and (max-width: 978px){
        font-size: 18px;
    }
`;

export const AddClientContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`;

export const AddIcon = styled.div`
    font-size: 28px;
    display: flex;
    align-items: center;
    color: ${colors.icon};
    margin-right: 15px;

    @media only screen and (max-width: 978px){
        font-size: 18px;
        margin-right: 5px;
    }
`;

export const AddText = styled.h3`
    color: ${colors.mainText};
    font-size: 1.1rem;
    font-weight: 700;

    @media only screen and (max-width: 978px){
        font-size: 0.9rem;
    }
`;

export const ClientContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

export const NoContentContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90%;
    margin-top: 10px;
    padding: 50px 35px;
    background-color: ${colors.white};
    border-radius: 5px;
    box-shadow: 5px 5px 13px #ededed, -5px -5px 13px #fff;

    @media only screen and (max-width: 978px){
        padding: 30px 10px;
        flex-direction: column;
    }
`;

export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;

    svg {
        font-size: 150px;
        color: ${colors.icon};
    }

    @media only screen and (max-width: 978px){
        svg {
            font-size: 80px;  
        }
    }
`;

export const NoContentActionContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-left: 30px;

    @media only screen and (max-width: 978px){
        margin-left: 0;
    }
`;

export const TextContent = styled.h5`
    font-size: 1.3rem;
    color: ${colors.mainText};

    @media only screen and (max-width: 978px){
        font-size: 0.9rem;
    }
`;

export const AddClientButton = styled.button`
    display: flex;
    width: 180px;
    align-items: center;
    justify-content: center;
    margin-top: 15px;
    padding: 10px 25px;
    background-color: ${colors.btnPrimary};
    border: 1px solid green;
    border-radius: 3px;
    font-size: 14px;
    color: ${colors.white};
    cursor: pointer;

    svg {
        margin-right: 15px;
    }

    &:hover{
        background-color: ${colors.greenNeutral};
    }

    @media only screen and (max-width: 978px){
        padding: 5px 15px;
    }
`;

export const ClientListContainer = styled.div`
    background-color: ${colors.background};
    width: 95%;
`;

export const ClientListHeader = styled.div`
    display: grid;
    grid-template-columns: 3fr 1fr 1fr 0.5fr;
    max-width: 100%;
    margin-top: 15px;
    padding: 10px;
    background-color: ${colors.white};
    border-radius: 5px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;

    @media only screen and (max-width: 978px){
        font-size: 80%;
        grid-template-columns: 2fr 1fr 0.5fr;
        padding: 5px 1px;
    }
`;

export const ClientListHeaderLabel = styled.h5`
    font-size: 14px;
`;

export const StyledFormArea = styled.div`
    margin-top: 10px;
    padding: 30px 30px;
    background-color: ${colors.white};
    border-radius: 5px;
    box-shadow: 5px 5px 13px ${colors.background}, -5px -5px 13px ${colors.white};

    @media only screen and (max-width: 978px){
        padding: 30px 10px;
    }
`;

export const FormContent = styled.div`
    display: flex;
    flex-direction: column;
`;

export const FormInputArea = styled.div`
    box-sizing: inherit;
    width: 100%;
    margin-bottom: 20px;

    @media only screen and (max-width: 978px){
        width: 90%;
        margin-bottom: 5px;
    }
`;

export const Limitador = styled.div`
    width: 90%;

    @media only screen and (max-width: 978px){
        width: 100%;
    }
`;

export const FormInputLabelRequired = styled.p`
    font-weight: 600;
    margin-bottom: 5px;

    &::after{
        display: inline-block;
        content: "*";
        margin-left: 2px;
        color: ${colors.icon};
    }
`;

export const FormInputLabel = styled.p`
    font-weight: 600;
    margin-bottom: 5px;
`;

export const SubItensContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);

    @media only screen and (max-width: 978px){
        display: flex;
        flex-direction: column;
    }
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

export const SingleClient = styled.div`
    display: grid;
    grid-template-columns: 3fr 1fr 1fr 0.5fr;
    height: 50px;
    max-width: 100%;
    align-items: center;
    padding: 10px;
    background-color: ${colors.white};
    cursor: pointer;

    @media only screen and (max-width: 978px){
        grid-template-columns: 2fr 1fr 0.5fr;
    }
`;

export const ClientValueContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
`;

export const ClientValue = styled.a`
    font-size: 15px;
    font-weight: bold;
    color: ${colors.mainText};
    text-decoration: none;

    @media only screen and (max-width: 978px){
       font-size: 12px;
    }
`;

export const ClientLabel = styled.p`
    font-size: 15px;
    color: ${colors.description};
    margin-right: 5px;

    @media only screen and (max-width: 978px){
       font-size: 10px;
    }
`;

export const AdminContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;

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
