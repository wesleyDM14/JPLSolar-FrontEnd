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

export const getContaByUser = async (user, setConta, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + '/api/financeiro/selfConta', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setConta(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
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

export const createBoletosByContract = (boletos, user, setSubmitting, setFieldError, setLoading) => {

}

export const createIndividualBoleto = (boleto, user, setSubmitting, setFieldError, setLoading) => {

}

export const getBoletosByUserId = (user, setBoletos, setLoading) => {

}

export const getBoletosByClientId = (clientId, user, setBoletos, setLoading) => {

}

export const updateBoletoById = (boleto, user, setSubmitting, setFieldError, setLoading) => {

}

export const deleteBoletoById = (boletoId, user, setIsDeleting, setLoading) => {

}

export const createClientFinanceiro = async (client, user, setSubmitting, setFieldError, setLoading, toggleModal) => {
    await axios.post(process.env.REACT_APP_BASE_URL + '/api/financeiro/clientes', client, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        console.log(data);
        setLoading(true);
        toggleModal('add', false);
    }).catch((err) => {
        console.error(err.response.data.message);
        setFieldError('nome', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const createClientImporting = async (client, user, setSubmitting, setFieldError, setLoading, toggleModal, setContractsLoading, setCurrentClient, setImporting) => {
    await axios.post(process.env.REACT_APP_BASE_URL + '/api/financeiro/clientes/import-from-contract', client, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        console.log(data);
        window.alert('Cliente cadastrado com sucesso.');
        toggleModal('importar', false);
        setContractsLoading(true);
        setLoading(true);
        setCurrentClient({});
        setImporting(false);
    }).catch((err) => {
        console.error(err.response.data.message);
        setFieldError('nome', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const getClientsFinanceiro = async (user, setClients, setClientTerceiros, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + '/api/financeiro/myClients', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        const clients = [];
        const clientsTerceiro = [];
        data.forEach(element => {
            if (element.terceiro) {
                clientsTerceiro.push(element);
            } else {
                clients.push(element);
            }
        });
        setClients(clients);
        setClientTerceiros(clientsTerceiro);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setLoading(false);
    });
}

export const getClientFinanceiroId = async (user, clientId, setClient, setLoading) => {
    await axios.get(process.env.REACT_APP_BASE_URL + `/api/financeiro/clientes/${clientId}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
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

export const updateClientFinanceiro = async (client, user, setSubmitting, setFieldError, setLoading, toggleModal) => {
    await axios.put(process.env.REACT_APP_BASE_URL + `/api/financeiro/clientes/${client.id}`, client, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        window.alert(data.message);
        toggleModal('edit', false);
        setLoading(true);
    }).catch((err) => {
        console.error(err.response.data.message);
        setFieldError('nome', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}

export const deleteClientFinanceiro = async (clientId, user, setIsDeleting, setLoading, toggleModal, setContractsLoading) => {
    setIsDeleting(true);
    await axios.delete(process.env.REACT_APP_BASE_URL + `/api/financeiro/clientes/${clientId}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        window.alert(data.message);
        setLoading(true);
        setContractsLoading(true);
        toggleModal('delete', false);
    }).catch((err) => {
        console.log(err);
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setIsDeleting(false);
    });
}