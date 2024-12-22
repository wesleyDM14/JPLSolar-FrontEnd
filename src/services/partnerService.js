import axios from "axios";

export const createPartner = async (partner, user, navigate, setSubmitting, setFieldError) => {
    await axios.post(process.env.REACT_APP_BASE_URL + '/api/parceiros', partner, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then(() => {
        window.alert('Parceiro cadastrado com sucesso.');
        navigate('/parceiros');
    }).catch((err) => {
        console.error(err.response.data.message);
        setFieldError('name', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const getPartnersByUserLoggedIn = async (user, setPartners, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + '/api/myPartners', {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setPartners(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const getPartnerById = async (partnerId, user, setPartner, setLoading, setReceita) => {
    await axios.get(process.env.REACT_APP_BASE_URL + `/api/parceiros/${partnerId}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        let contractsPartners = data.contracts;
        let totalReceita = 0;
        for (let index = 0; index < contractsPartners.length; index++) {
            const contract = contractsPartners[index];
            totalReceita += contract.priceTotal;
        }
        setReceita(totalReceita);
        setPartner(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const updatePartner = async (partner, user, setFieldError, setSubmitting, setLoading) => {
    await axios.put(process.env.REACT_APP_BASE_URL + `/api/parceiros/${partner.id}`, partner, {
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

export const deletePartner = async (partnerId, user, setLoading) => {
    await axios.delete(process.env.REACT_APP_BASE_URL + `/api/parceiros/${partnerId}`, {
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