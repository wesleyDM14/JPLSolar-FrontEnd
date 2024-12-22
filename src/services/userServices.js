import axios from "axios";

export const getLoggedUserInfo = async (user, setIsLoading, setUserData) => {
    await axios.get(process.env.REACT_APP_BASE_URL + '/api/meu-perfil', {
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        setUserData(data);
    }).catch((err) => {
        console.error(err.response.data.message);
        window.alert(err.response.data.message);
    }).finally(() => {
        setIsLoading(false);
    });
}

export const updatedLoggedUser = async (values, userId, user, setIsLoading, setSubmitting, setFieldError) => {
    await axios.put(process.env.REACT_APP_BASE_URL + `/api/usuarios/${userId}`, values, {
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        window.alert(data.message);
        setIsLoading(true);
    }).catch((err) => {
        console.error(err);
        setFieldError('nome', err.response.data.message);
    }).finally(() => {
        setSubmitting(false);
    });
}
