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

export const updatedLoggedUser = (user, setIsLoading, setSubmitting, setFieldError) => {

}
