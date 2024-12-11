import styled from "styled-components";
import { colors } from "../../utils/GlobalStyles";

export const NotAuthorizedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: ${colors.background};
`;

export const Title = styled.h1`
  font-size: 3rem;
  color: ${colors.title};
  margin-bottom: 20px;
  display: flex;
  align-items: center;
`;

export const IconWrapper = styled.div`
  font-size: 4rem;
  color: ${colors.icon};
  margin-right: 15px;
`;

export const Message = styled.p`
  font-size: 1.5rem;
  color: ${colors.mainText};
  max-width: 500px;
  text-align: center;
  margin-bottom: 30px;
`;

export const BackButton = styled.button`
  padding: 10px 20px;
  background-color: ${colors.btnPrimary};
  color: #fff;
  font-size: 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${colors.hover};
  }

  svg {
    margin-right: 8px;
  }
`;