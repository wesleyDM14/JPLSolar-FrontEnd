import axios from "axios";

export const getResumeInfo = async (setData, setLoading, user) => {
    await axios.get(process.env.REACT_APP_BASE_URL + '/api/financeiro/resumo', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setData(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const createConta = async (conta, user, setLoading, setSubmitting, setFieldError, closeAddContaModal) => {
    await axios.post(process.env.REACT_APP_BASE_URL + '/api/financeiro/conta', conta, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        console.log(data);
        window.alert('Conta cadastrada com sucesso.');
        setLoading(true);
        closeAddContaModal();
    }).catch((err) => {
        console.error(err.response.data.message);
        setFieldError('banco', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const getContaByUser = () => {

}

export const updateConta = async (conta, user, setSubmitting, setFieldError, closeEditContaModal, setLoading) => {
    await axios.put(process.env.REACT_APP_BASE_URL + `/api/financeiro/conta/${conta.id}`, conta, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        console.log(data);
        window.alert('Conta atualizada com sucesso.');
        closeEditContaModal();
        setLoading(true);
    }).catch((err) => {
        console.error(err.response.data.message);
        setFieldError('banco', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const deleteConta = async (contaId, user, setIsDeleting, setLoading, closeDeleteContaModal) => {
    setIsDeleting(true);
    await axios.delete(process.env.REACT_APP_BASE_URL + `/api/financeiro/conta/${contaId}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        window.alert(data.message);
        setLoading(true);
        closeDeleteContaModal();
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setIsDeleting(false);
    });
}

export const createBoletosByContract = () => {

}

export const createIndividualBoleto = () => {

}

export const getBoletosByUserId = () => {

}

export const getBoletosByClientId = () => {

}

export const updateBoletoById = () => {

}

export const deleteBoletoById = () => {

}