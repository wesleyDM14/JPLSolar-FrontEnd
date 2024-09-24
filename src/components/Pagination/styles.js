import styled from "styled-components";
import { colors } from "../../utils/GlobalStyles";

export const PaginationContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 20px;
`;

export const PaginationButton = styled.button`
    background-color: ${colors.white};
    border: 1px solid ${colors.background};
    margin: 0 5px;
    padding: 5px 10px;
    cursor: pointer;

    &:disabled {
        background-color: ${colors.background};
        cursor: not-allowed;
    }
`;