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

export const updateColumn = async (user, taskId, columnId) => {

}

export const createTask = async (user, name, columnId) => {

}

export const createColumn = async (user, title, setLoading) => {
  await axios.post(process.env.REACT_APP_BASE_URL + '/api/columns', { name: title }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${user.accessToken}`
    }
  }).then((response) => {
    const { data } = response;
    console.log(data);
    setLoading(true);
  }).catch((err) => {
    console.error(err.response.data.message);
    window.alert(err.response.data.message);
  });
}