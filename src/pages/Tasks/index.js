import { useEffect, useState } from "react";
import { getColumnsForUserId, updateColumn } from "../../services/tasksService";
import {
    BoardContainer,
    TaskContainer,
    TaskHeader,
    TaskTitle
} from "./styles";
import Loading from "../../components/Loading";
import { FaTasks } from "react-icons/fa";
import { DragDropContext } from 'react-beautiful-dnd';
import TaskColumn from "./taskColumn";

const Tasks = ({ navigate, user }) => {

    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);

    const columnsTest = [
        {
          id: 'column-1',
          title: 'Usinas',
          tasks: [
            { id: 'task-1', name: 'Planejar instalação' },
            { id: 'task-2', name: 'Comprar equipamentos' },
          ],
        },
        {
          id: 'column-2',
          title: 'Concluído',
          tasks: [
            { id: 'task-3', name: 'Análise do terreno' },
            { id: 'task-4', name: 'Aprovação regulatória' },
          ],
        },
        {
          id: 'column-3',
          title: 'A fazer',
          tasks: [
            { id: 'task-5', name: 'Conferir painéis' },
            { id: 'task-6', name: 'Testar inversores' },
          ],
        },
      ];

    useEffect(() => {
        setColumns(columnsTest);
        /*if (loading) {
            getColumnsForUserId(user, setColumns, setLoading);
        }*/
    }, []);

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

            const draggedTask = sourceColumn.tasks.find(
                (task) => task.id === draggableId
            );

            if (!draggedTask) return;

            sourceColumn.tasks.splice(source.index, 1);
            destColumn.tasks.splice(destination.index, 0, draggedTask);

            setColumns([...columns]);

            await updateColumn(user, draggableId, destination.droppableId);
        } else {
            const columnIndex = columns.findIndex(
                (col) => col.id === source.droppableId
            );
            const column = columns[columnIndex];
            const [movedTask] = column.tasks.splice(source.index, 1);
            column.tasks.splice(destination.index, 0, movedTask);
            setColumns([...columns]);
        }
    }

    return (
        <TaskContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <TaskHeader>
                            <TaskTitle><FaTasks style={{ marginRight: '10px' }} /> Tarefas</TaskTitle>
                        </TaskHeader>
                        <DragDropContext>
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