import axios from "axios";

export const createSolarPlant = async (solarPlant, user, navigate, setSubmitting, setFieldError) => {
    await axios.post(process.env.REACT_APP_BASE_URL + `/api/plantasSolar`, solarPlant, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        window.alert('Planta Solar cadastrada com sucesso.');
        console.log(data);
        navigate(`/plantas-solares/cliente/${solarPlant.clientId}`);
    }).catch((err) => {
        console.error(err.response.data.message);
        setFieldError('code', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const getSolarPlantsByUserLoggedIn = async (user, setSolarPlants, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + `/api/mySolarPlants`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setSolarPlants(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const getSolarPlantsByClientId = async (clientId, user, setSolarPlants, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + `/api/clients/${clientId}/solarPlants`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setSolarPlants(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const updateSolarPlant = async (solarPlant, user, setFieldError, setSubmitting, setLoading) => {
    await axios.put(process.env.REACT_APP_BASE_URL + `/api/plantasSolar/${solarPlant.id}`, solarPlant, {
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
        setFieldError('code', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const deleteSolarPlant = async (solarPlantId, user, setLoading) => {
    await axios.delete(process.env.REACT_APP_BASE_URL + `/api/plantasSolar/${solarPlantId}`, {
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