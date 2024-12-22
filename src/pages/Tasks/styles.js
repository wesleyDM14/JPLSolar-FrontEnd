import styled from 'styled-components';
import { colors } from '../../utils/GlobalStyles';

export const BoardContainer = styled.div`
    display: flex;
    justify-content: space-around;
    padding: 20px;
    gap: 20px;

    @media only screen and (max-width: 978px){
        flex-direction: column;
    }
`;

export const ColumnTitle = styled.h2`
  font-size: 26px;
    color: ${colors.title};
    font-weight: 700;
`;

export const TaskContainer = styled.div`
    grid-area: main;
    display: block;

    @media only screen and (max-width: 978px){
        padding: 5px 10px;
    }
`;

export const TaskHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 35px;

    @media only screen and (max-width: 978px){
        padding: 0;
    }
`;

export const TaskTitle = styled.h1`
    display: flex;
    align-items: center;
    font-size: 26px;
    color: ${colors.title};
    font-weight: 700;

    @media only screen and (max-width: 978px){
        font-size: 18px;
    }
`;

export const ColumnContainer = styled.div`
  background: ${colors.background};
  border: 1px solid ${colors.hover};
  border-radius: 5px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const TaskItem = styled.div`
  background: ${colors.btnSecondary};
  border: 1px solid ${colors.hover};
  margin: 5px 0;
  padding: 5px;
  border-radius: 3px;
  cursor: grab;
  user-select: none;
`;

export const ColumnHeader = styled.div`
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
`;

export const AddTaskButton = styled.button`
  background: ${colors.greenNeutral};
  border: 1px solid ${colors.hover};
  padding: 5px;
  border-radius: 3px;
  cursor: pointer;
`;

export const DeleteColumnButton = styled.button`
  background: ${colors.hover};
  color: ${colors.white};
  border: 1px solid ${colors.hover};
  padding: 5px;
  border-radius: 3px;
  cursor: pointer;
`;