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

export const getSolarPlantById = async (solarPlantId, user, setSolarPlant, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + `/api/plantasSolar/${solarPlantId}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setSolarPlant(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const getSolarPlantParams = async (solarPlant, user, setSolarPlantParams, setLoadingParams, setPowerData, setErrorList) => {
    await axios.post(process.env.REACT_APP_BASE_URL + '/api/params/solarPlant', solarPlant, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setSolarPlantParams(data);
        if (data.deviceSN.deviceTypeName === 'max') {
            setPowerData(data.chart.pac);
        } else if (data.deviceSN.deviceTypeName === 'tlx') {
            setPowerData(data.chart.charts.ppv);
        }
        setErrorList(data.errorLog);
    }).catch((err) => {
        console.error(err);
        window.alert(err.response.data.message);
        window.location.reload();
    }).finally(() => {
        setLoadingParams(false);
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

export const getErrorListData = async (solarPlant, solarPlantParams, year, user, setErrorList, setLoadingErrorList) => {
    await axios.post(process.env.REACT_APP_BASE_URL + '/api/plantasSolar/errorList', {
        login: solarPlant.login,
        password: solarPlant.password,
        year: year,
        plantId: solarPlantParams.plantData.id,
        inversor: solarPlant.inversor
    }, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setErrorList(data.errorLog);
    }).catch((err) => {
        window.alert(err.response.data.message);
        console.log(err.response.data.message);
    }).finally(() => {
        setLoadingErrorList(false);
    });
}