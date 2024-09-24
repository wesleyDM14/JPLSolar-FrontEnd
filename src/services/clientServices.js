import axios from "axios";

export const createClient = async (client, user, navigate, setSubmitting, setFieldError) => {
    await axios.post(process.env.REACT_APP_BASE_URL + '/api/clientes', client, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        window.alert('cliente cadastrado com sucesso.');
        console.log(data);
        navigate('/clientes');
    }).catch((err) => {
        console.error(err.response.data.message);
        setFieldError('name', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const getClientsByUserLoggedIn = async (user, setClients, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + '/api/myClients', {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setClients(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const getClientById = async (clientId, user, setClient, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + `/api/clientes/${clientId}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setClient(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const updateClient = async (client, user, setFieldError, setSubmitting, setLoading) => {
    await axios.put(process.env.REACT_APP_BASE_URL + `/api/clientes/${client.id}`, client, {
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
        setFieldError('name', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const deleteClient = async (clientId, user, setLoading) => {
    await axios.delete(process.env.REACT_APP_BASE_URL + `/api/clientes/${clientId}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        window.alert(data.message);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(true);
    });
}