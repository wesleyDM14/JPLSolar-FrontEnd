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

export const createConta = async (conta, user, setLoading, setSubmitting, setFieldError) => {

}

export const getContaByUser = () => {

}

export const updateConta = () => {

}

export const deleteConta = () => {

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