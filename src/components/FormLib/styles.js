import styled from "styled-components";
import { colors } from "../../utils/GlobalStyles";

export const InputContainer = styled.div`
    position: relative;
    width: 80%;

    @media only screen and (max-width: 978px){
        width: 100%;
    }
`;

export const InputLabel = styled.label`
    color: ${colors.title};
    
    &::after {
        display: inline-block;
        content: "*";
        margin-left: 2px;
        color: ${colors.red};
    }

    @media only screen and (max-width: 978px){
        font-size: 14px;
    }
`;

export const StyledInput = styled.input`
    width: 100%;
    padding: 15px;
    padding-left: 50px;
    font-size: 17px;
    letter-spacing: 1px;
    color: ${colors.mainText};
    background-color:${colors.white};
    border: 0;
    outline: 0;
    display: block;
    margin: 5px auto 10px auto;
    transition: ease-in-out 0.3s;
`;

export const StyledIcon = styled.div`
    position: absolute;
    margin: auto;
    top: 35%;
    color: ${colors.icon};
    font-size: 25px;
    ${(props) => props.$right && `right: 15px;`};
    ${(props) => !props.$right && `left: 15px;`};

    @media only screen and (max-width: 978px){
        top: 40%;
        font-size: 18px;
    }
`;

export const ErrorMsg = styled.div`
    font-size: 11px;
    color: ${colors.red};
`;

export const StyledTextInputContainer = styled.div`
    position: relative;
    width: 100%;
`;

export const StyledTextInput = styled.input`
    width: 100%;
    padding: 15px;
    font-size: 17px;
    letter-spacing: 1px;
    color: ${colors.mainText};
    background-color:${colors.background};
    border-radius: 5px;
    border: 0;
    outline: 0;
    display: block;
    margin: 5px auto 10px auto;
    transition: ease-in-out 0.3s;
`;

export const StyledTextInputLabel = styled.label`
    color: ${colors.mainText};
    
    &::after {
        display: inline-block;
        content: "*";
        margin-left: 2px;
        color: ${colors.red};
    }
`;