import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    filter: brightness(100%);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(120%);
  }
  100% {
    transform: scale(1);
    filter: brightness(100%);
  }
`;

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
`;

export const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #1e1e2f;
  height: 100vh;
  overflow-y: auto;
  color: #fff;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(90deg, #4b79a1 0%, #283e51 100%);
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
`;

export const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  animation: ${fadeIn} 0.5s ease-in-out;

  @media only screen and (max-width: 978px){
    font-size: 18px;
  }
`;

export const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

export const Card = styled.div`
  background: linear-gradient(145deg, #232334, #1c1c2b);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: ${({ $isExiting }) => ($isExiting ? slideOut : slideIn)} 0.5s ease-in-out;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 8px 8px 15px rgba(0, 0, 0, 0.7);
  }
`;

export const CardIcon = styled.div`
  font-size: 45px;
  color: ${({ $status }) =>
    $status === '1' ? '#4caf50' : $status === '0' ? '#ffc107' : '#f44336'};
  animation: ${pulse} 1.5s infinite;
  margin-right: 10px;

  @media only screen and (max-width: 978px){
    font-size: 30px;
  }
`;

export const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
`;

export const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  color: #ffffff;

  @media only screen and (max-width: 978px){
    font-size: 16px;
  }
`;

export const CardDetail = styled.p`
  font-size: 14px;
  color: #b0b0b0;
  margin: 5px 0;
`;

export const CardProduction = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #f9a825;
  gap: 8px;
  font-weight: bold;

  @media only screen and (max-width: 978px){
    font-size: 14px;
  }
`;

export const ErrorSection = styled.div`
  margin-top: 30px;
  padding: 20px;
  background: #2d2d44;
  border-radius: 12px;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.5);
  position: relative;
  min-height: 350px;
  height: auto;
  transition: height 0.3s ease-in-out;

  overflow: hidden;

  @media only screen and (max-width: 978px){
    font-size: 18px;
    padding: 10px;
    overflow: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 24px;
  color: #f44336;
  margin-bottom: 20px;

  @media only screen and (max-width: 978px){
    font-size: 18px;
  }
`;

export const NavButton = styled.button`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: #007bff11;
    border: none;
    color: white;
    font-size: 3rem;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background-color 0.3s, transform 0.3s, box-shadow 0.3s;

    &:hover {
        background-color: #0056b3aa;
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }

    &:focus {
        outline: none;
    }

    // Botão para a esquerda
    &.left {
        left: 20px;
    }

    // Botão para a direita
    &.right {
        right: 20px;
    }

    @media only screen and (max-width: 978px){
      font-size: 1.5rem;
      width: 30px;
      height: 30px;

      &.left {
        left: 10px;
      }

    // Botão para a direita
      &.right {
          right: 10px;
      }
    }
`;