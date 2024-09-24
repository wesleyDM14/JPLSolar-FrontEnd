import styled from "styled-components";
import { colors } from "../../utils/GlobalStyles";

export const SearchContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

export const SearchInput = styled.input`
    width: 90%;
    margin-top: 15px;
    padding: 15px;
    padding-left: 55px;
    border: 0;
    border-radius: 15px;

    @media only screen and (max-width: 978px) {
        width: 80%;
    }
`;

export const SearchIcon = styled.p`
    margin: auto;
    color: ${colors.icon};
    position: absolute;
    font-size: 25px;
    top: 40%;
    left: 4%;
`;