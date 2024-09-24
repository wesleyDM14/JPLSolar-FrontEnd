import styled, { keyframes } from "styled-components";

const LoadingScreenAnimation = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

export const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 80vh;
    animation: ${LoadingScreenAnimation} 1s;
`;

export const Logo = styled.img`
    width: 120px;
    height: auto;
    margin: 5px;

    @media only screen and (max-width: 978px){
        width: 85px;
    }
`;