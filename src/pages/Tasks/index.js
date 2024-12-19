import { useEffect, useState } from "react";
import { createColumn, getColumnsForUserId, updateColumn } from "../../services/tasksService";
import {
    BoardContainer,
    TaskContainer,
    TaskHeader,
    TaskTitle
} from "./styles";
import Loading from "../../components/Loading";
import { FaPlusCircle, FaTasks } from "react-icons/fa";
import { DragDropContext } from 'react-beautiful-dnd';
import TaskColumn from "./taskColumn";
import { AddIcon, AddPartnerContainer, AddText } from "../Parterns/styles";

const Tasks = ({ navigate, user }) => {

    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loading) {
            getColumnsForUserId(user, setColumns, setLoading);
        }
    }, [loading, user]);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (source.droppableId !== destination.droppableId) {
            const sourceColumnIndex = columns.findIndex(
                (col) => col.id === source.droppableId
            );
            const destColumnIndex = columns.findIndex(
                (col) => col.id === destination.droppableId
            );

            const sourceColumn = columns[sourceColumnIndex];
            const destColumn = columns[destColumnIndex];

            const draggedTask = sourceColumn.Task.find(
                (task) => task.id === draggableId
            );

            if (!draggedTask) return;

            sourceColumn.Task.splice(source.index, 1);
            destColumn.Task.splice(destination.index, 0, draggedTask);

            setColumns([...columns]);

            await updateColumn(user, draggableId, destination.droppableId);
        } else {
            const columnIndex = columns.findIndex(
                (col) => col.id === source.droppableId
            );
            const column = columns[columnIndex];
            const [movedTask] = column.Task.splice(source.index, 1);
            column.Task.splice(destination.index, 0, movedTask);
            setColumns([...columns]);
        }
    };

    const addColumn = async () => {
        const columnName = prompt('Nome da nova coluna:');
        if (!columnName) return;
        try {
            await createColumn(user, columnName, setLoading);
        } catch (error) {
            console.error('Erro ao criar nova coluna:', error);
        }
    };

    return (
        <TaskContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <TaskHeader>
                            <TaskTitle><FaTasks style={{ marginRight: '10px' }} /> Tarefas</TaskTitle>
                            <AddPartnerContainer onClick={addColumn}>
                                <AddIcon>
                                    <FaPlusCircle />
                                </AddIcon>
                                <AddText>Adicionar Coluna</AddText>
                            </AddPartnerContainer>
                        </TaskHeader>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <BoardContainer>
                                {
                                    columns.map((column) => (
                                        <TaskColumn
                                            key={column.id}
                                            column={column}
                                            columns={columns}
                                            setColumns={setColumns}
                                            user={user}
                                        />
                                    ))
                                }
                            </BoardContainer>
                        </DragDropContext>
                    </>
                )
            }
        </TaskContainer>
    )
}

export default Tasks;