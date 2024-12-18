
export const getColumnsForUserId = async (user, setColumns, setLoading) => {
    const columnsTest = [
        {
          id: 'usinas',
          title: 'Usinas',
          tasks: [
            { id: 'task-1', name: 'Planejar instalação' },
            { id: 'task-2', name: 'Comprar equipamentos' },
          ],
        },
        {
          id: 'concluido',
          title: 'Concluído',
          tasks: [
            { id: 'task-3', name: 'Análise do terreno' },
            { id: 'task-4', name: 'Aprovação regulatória' },
          ],
        },
        {
          id: 'a-fazer',
          title: 'A fazer',
          tasks: [
            { id: 'task-5', name: 'Conferir painéis' },
            { id: 'task-6', name: 'Testar inversores' },
          ],
        },
      ];

    setColumns(columnsTest);
    setLoading(false);
}

export const updateColumn = async (user, taskId, columnId) => {

}

export const createTask = async (user, name, columnId) => {

}