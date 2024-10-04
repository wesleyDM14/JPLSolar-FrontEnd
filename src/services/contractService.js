import axios from "axios";

export const createContract = async (contract, user, navigate, setSubmitting, setFieldError) => {
    await axios.post(process.env.REACT_APP_BASE_URL + '/api/contratos', contract, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        console.log(data);
        window.alert('Contrato cadastrado com sucesso.');
        navigate('/contratos');
    }).catch((err) => {
        window.alert(err.response.data.message);
        console.error(err.response.data.message);
        setFieldError('dataContrato', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const getContractsByUserId = async (user, setContratos, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + '/api/myContracts', {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setContratos(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const getContractById = () => {

}

export const updateContract = async (contract, user, setSubmitting, setFieldError, setLoading, closeEditModal) => {
    await axios.put(process.env.REACT_APP_BASE_URL + `/api/contratos/${contract.id}`, contract, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        console.log(data);
        window.alert('Contrato atualizado com sucesso');
        setSubmitting(false);
        closeEditModal();
        setLoading(true);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
        setFieldError('dataContrato', err.response.data.message);
        setSubmitting(false);
    });
}

export const deleteContract = async (contractId, user, setLoading, closeDeleteModal) => {
    await axios.delete(process.env.REACT_APP_BASE_URL + `/api/contratos/${contractId}`, {
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        window.alert(data.message);
        closeDeleteModal();
        setLoading(true);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    });
}