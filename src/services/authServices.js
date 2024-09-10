import axios from "axios";
import { logout, login } from "../actions/sessionActions";

export const loginUser = async (credentials, navigate, setIsLoading, dispatch) => {
    console.log('entrou');
    await axios.post(process.env.REACT_APP_BASE_URL + '/api/login', credentials,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    ).then((response) => {
        const { accessToken, isAdmin } = response.data.accessToken;
        const loginTime = new Date().getTime();
        const userData = {
            accessToken,
            isAdmin,
            loginTime
        };

        localStorage.setItem('user', JSON.stringify(userData));
        dispatch(login(userData));

        navigate('/dashboard');
    }).catch((error) => {
        window.alert(error.response.data.message);
    }).finally(() => {
        setIsLoading(false);
    });
}

export const logoutUser = (navigate) => {
    return (dispatch) => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');

        dispatch(logout());

        navigate('/');
    };
}