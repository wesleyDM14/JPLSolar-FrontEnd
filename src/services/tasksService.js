import axios from "axios";

export const getColumnsForUserId = async (user, setColumns, setLoading) => {
  await axios.get(process.env.REACT_APP_BASE_URL + '/api/columns', {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.accessToken}`
    }
  }).then((response) => {
    const { data } = response;
    setColumns(data);
  }).catch((err) => {
    console.error(err.response.data.message);
    window.alert(err.response.data.message);
  }).finally(() => {
    setLoading(false);
  });
}

export const updateTask = async (user, task, setSubmitting, setFieldError, setLoading) => {
  await axios.put(process.env.REACT_APP_BASE_URL + `/api/tasks/${task.id}`, task, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.accessToken}`
    }
  }).then((response) => {
    const { data } = response;
    window.alert(data.message);
    setSubmitting(false);
    setLoading(true);
  }).catch((err) => {
    console.error(err.response.data.message);
    setFieldError('name', err.response.data.message);
    setSubmitting(false);
  });
}

export const createTask = async (user, values, setSubmitting, setFieldError, setLoading) => {
  await axios.post(process.env.REACT_APP_BASE_URL + '/api/tasks', values, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.accessToken}`
    }
  }).then(() => {
    window.alert('Tarefa cadastrada com sucesso.');
    setLoading(true);
  }).catch((err) => {
    console.error(err.response.data.message);
    setFieldError('name', err.response.data.message);
  }).finally(() => {
    setSubmitting(false);
  });
}

export const createColumn = async (user, title, setLoading) => {
  await axios.post(process.env.REACT_APP_BASE_URL + '/api/columns', { name: title }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.accessToken}`
    }
  }).then(() => {
    window.alert('Nova coluna de tarefas criada com sucesso.');
    setLoading(true);
  }).catch((err) => {
    console.error(err.response.data.message);
    window.alert(err.response.data.message);
  });
}

export const deleteColumn = async (user, columnId, setLoading, setDeleting) => {
  await axios.delete(process.env.REACT_APP_BASE_URL + `/api/columns/${columnId}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.accessToken}`
    }
  }).then((response) => {
    const { data } = response;
    window.alert(data.message);
    setLoading(true);
  }).catch((err) => {
    console.error(err.response.data.message);
    window.alert(err.response.data.message);
    setDeleting(false);
  });
}

export const deleteTask = async (user, taskId, setLoading, setDeleting) => {
  await axios.delete(process.env.REACT_APP_BASE_URL + `/api/tasks/${taskId}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.accessToken}`
    }
  }).then((response) => {
    const { data } = response;
    window.alert(data.message);
    setLoading(true);
  }).catch((err) => {
    console.error(err.response.data.message);
    window.alert(err.response.data.message);
    setDeleting(false);
  });
}

export const updateTaskPosition = async (user, activeTaskId, activeColumnId, overColumnId, destinationTaskIndex) => {
  await axios.put(process.env.REACT_APP_BASE_URL + `/api/tasks/${activeTaskId}`, {
    position: destinationTaskIndex,
    columnId: overColumnId,
  }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.accessToken}`
    }
  }).catch((err) => {
    console.error(err.response.data.message);
    window.alert(err.response.data.message);
  });
}