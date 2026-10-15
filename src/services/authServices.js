import toast from 'react-hot-toast';
import { authApi } from '../api/resources';
import { errorMessage } from '../api/client';
import { queryClient } from '../api/queryClient';
import { login, logout } from '../actions/sessionActions';

export const loginUser = async (credentials, navigate, setIsLoading, dispatch) => {
    try {
        const { accessToken, user } = await authApi.login(credentials);

        // O painel é só de administradores; instaladores trabalham pelo aplicativo de campo.
        if (user?.papel === 'INSTALADOR') {
            toast.error('Seu acesso é pelo aplicativo de campo. O painel é só para administradores.');
            return;
        }

        const session = { accessToken, user, loginTime: new Date().getTime() };

        localStorage.setItem('user', JSON.stringify(session));
        dispatch(login(session));

        navigate('/dashboard');
    } catch (error) {
        toast.error(errorMessage(error));
    } finally {
        setIsLoading(false);
    }
};

export const logoutUser = (navigate, dispatch) => {
    // Dados em cache pertencem ao usuário que saiu.
    queryClient.clear();
    dispatch(logout());
    navigate('/');
};
