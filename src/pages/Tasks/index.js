import { useEffect, useState } from "react";
import { createColumn, getColumnsForUserId, updateTaskPosition } from "../../services/tasksService";
import {
    BoardContainer,
    TaskContainer,
    TaskHeader,
    TaskTitle
} from "./styles";
import Loading from "../../components/Loading";
import { FaPlusCircle, FaTasks } from "react-icons/fa";
import { closestCenter, DndContext } from "@dnd-kit/core";
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

    const onDragEnd = async (event) => {
        const { active, over } = event;

        const [activeColumnId, activeTaskId] = active.id.split(":");
        const [overColumnId, overTaskId] = over?.id.split(":") || [];

        if (!overColumnId || activeColumnId === overColumnId) return;

        const sourceColumnIndex = columns.findIndex((col) => col.id === activeColumnId);
        const destinationColumnIndex = columns.findIndex((col) => col.id === overColumnId);

        if (sourceColumnIndex < 0 || destinationColumnIndex < 0) return;

        const sourceTaskIndex = columns[sourceColumnIndex].Task.findIndex(
            (task) => task.id === activeTaskId
        );

        if (sourceTaskIndex < 0) return;

        const destinationTaskIndex = overTaskId
            ? columns[destinationColumnIndex].Task.findIndex((task) => task.id === overTaskId)
            : columns[destinationColumnIndex].Task.length;

        const task = columns[sourceColumnIndex].Task[sourceTaskIndex];
        const updatedColumns = [...columns];

        // Atualiza as tarefas das colunas
        updatedColumns[sourceColumnIndex].Task.splice(sourceTaskIndex, 1);
        updatedColumns[destinationColumnIndex].Task.splice(destinationTaskIndex, 0, task);

        setColumns(updatedColumns);

        // Atualiza no backend
        try {
            await updateTaskPosition(user, activeTaskId, activeColumnId, overColumnId, destinationTaskIndex);
        } catch (error) {
            console.error("Erro ao atualizar posição da tarefa:", error);
            setLoading(true);
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
                        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                            <BoardContainer>
                                {
                                    columns.map((column) => (
                                        <TaskColumn
                                            key={column.id}
                                            column={column}
                                            setLoading={setLoading}
                                            user={user}
                                        />
                                    ))
                                }
                            </BoardContainer>
                        </DndContext>
                    </>
                )
            }
        </TaskContainer>
    )
}

export default Tasks;