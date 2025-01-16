import styled from "styled-components";
import { colors } from "../../utils/GlobalStyles";

export const FinanceiroMainContainer = styled.div`
    grid-area: main;
    display: block;
    padding: 5px 10px;

    @media only screen and (max-width: 978px){
        padding: 5px 10px;
    }
`;

export const FinanceiroHeader = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    @media only screen and (max-width: 978px){
        flex-direction: column;
        padding: 0;
    }
`;

export const FinanceiroTitleContainer = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
`;

export const Title = styled.h5`
    font-size: 26px;
    font-weight: 700;
    color: ${colors.title};

    @media only screen and (max-width: 978px){
        font-size: 18px;
    }
`;

export const TitleIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        margin-right: 5px;
        font-size: 26px;
        color: ${colors.title};
    }

    @media only screen and (max-width: 978px){
        svg {
            font-size: 18px;
        }
    }
`;

export const HeaderMenu = styled.div`
    width: 30%;
    display: flex;
    align-items: center;
    justify-content: space-evenly;

    @media only screen and (max-width: 978px){
        justify-content: center;
        width: 100%;
        margin-top: 20px;
    }
`;

export const MenuItem = styled.a`
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    padding: 3px 10px;
    color: ${props => props.$active ? colors.white : colors.mainText};
    background-color: ${props => props.$active ? colors.navbar : null};
    border-radius: 5px;

    &:hover {
        background-color: ${colors.navbar};
        color: ${colors.white};
    }
`;

export const FinanceiroContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 40px;

    @media only screen and (max-width: 978px){
        margin: 20px;
    }
`;

export const FinanceiroMainContent = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    width: 100%;
    margin-top: 50px;

    @media only screen and (max-width: 978px){
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
`;

export const FinanceiroMainCard = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    height: 100px;
    width: 70%;
    padding: 25px;
    border-radius: 5px;
    background-color: #fff;
    box-shadow: 5px 5px 13px #ededed, -5px -5px 13px #fff;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
        transform: scale(1.1);
    }

    @media only screen and (max-width: 978px){
        width: 90%;
    }
`;

export const CardTitle = styled.h6`
    font-weight: 700;
    font-size: 16px;
`;

export const CardValue = styled.h4`
    font-weight: bold;
    font-size: 20px;
`;

export const CardCount = styled.span`
    font-size: 14px;
    font-weight: 300;
`;

export const ContaListContainer = styled.div`
    background-color: ${colors.background};
    width: 100%;
`;

export const ContaListHeader = styled.div`
    display: grid;
    grid-template-columns: 2fr 2fr 1fr 0.5fr 0.5fr;
    max-width: 100%;
    margin-top: 15px;
    padding: 10px;
    background-color: ${colors.white};
    border-radius: 5px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;

    @media only screen and (max-width: 978px){
        font-size: 80%;
        grid-template-columns: 1fr 1fr 0.5fr 0.5fr;
        padding: 5px 1px;
    }
`;

export const ContaListHeaderLabel = styled.h5`
     font-size: 14px;

     @media only screen and (max-width: 978px){
        font-size: 12px;
    }
`;

export const AddContaContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    margin-bottom: 15px;
`;

export const AddContaButtonIconContainer = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;

    svg {
        font-size: 20px;
        margin-right: 5px;
    }
`;

export const AddContaText = styled.h5`
    font-weight: 700;
    cursor: pointer;
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
    border: 1px solid ${colors.darkGray};
    border-radius: 4px;
    padding: 8px 12px;
    min-height: 40px;
    min-width: 100px;
    transition: all .2s ease-out;
    background-color: ${colors.btnSecondary};
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
    background-color: ${colors.white};
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