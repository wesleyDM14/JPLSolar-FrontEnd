import { Draggable, Droppable } from "react-beautiful-dnd";
import { createTask } from "../../services/tasksService";
import { AddTaskButton, ColumnContainer, TaskItem } from "./styles";

const TaskColumn = ({ column, columns, setColumns, user }) => {
    const addTask = async () => {

        const taskName = prompt('Task name:');

        if (!taskName) return;

        const response = await createTask(user, taskName, column.id);

        const updatedColumns = columns.map((col) =>
            col.id === column.id ? { ...col, tasks: [...col.tasks, response.data] } : col
        );

        setColumns(updatedColumns);
    };

    return (
        <Droppable droppableId={column.id}>
            {
                (provided) => (
                    <ColumnContainer {...provided.droppableProps} ref={provided.innerRef}>
                        {
                            column.tasks.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {
                                        (provided) => (
                                            <TaskItem
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                {task.name}
                                            </TaskItem>
                                        )
                                    }
                                </Draggable>
                            ))
                        }
                        {provided.placeholder}
                        <AddTaskButton onClick={addTask}>Add Task</AddTaskButton>
                    </ColumnContainer>
                )
            }
        </Droppable>
    );
}

export default TaskColumn;