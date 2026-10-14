import axios from 'axios';
import store from '../store';
import { logout } from '../actions/sessionActions';

// Cliente HTTP único da aplicação: base URL, token e tratamento de sessão expirada em um só lugar.
export const api = axios.create({
    baseURL: `${process.env.REACT_APP_BASE_URL}/api`,
    timeout: 60000,
});

api.interceptors.request.use((config) => {
    const token = store.getState().session.user?.accessToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLogin = error.config?.url?.includes('/auth/login');

        // Token expirado/inválido: encerra a sessão (a rota protegida redireciona para o login).
        if (error.response?.status === 401 && !isLogin) {
            store.dispatch(logout());
        }

        return Promise.reject(error);
    },
);

/** Mensagem legível para exibir ao usuário a partir de um erro de requisição. */
export function errorMessage(error, fallback = 'Ocorreu um erro inesperado. Tente novamente.') {
    if (!error?.response) {
        return error?.code === 'ECONNABORTED'
            ? 'A requisição demorou demais. Tente novamente.'
            : 'Não foi possível conectar ao servidor.';
    }

    const { message, details } = error.response.data || {};

    // Erros de validação trazem o primeiro problema de campo para ficar acionável.
    if (Array.isArray(details) && details.length > 0 && details[0]?.message) {
        return `${message ?? 'Dados inválidos.'} ${details[0].field ? `(${details[0].field}) ` : ''}${details[0].message}`;
    }

    return message || fallback;
}

/** Converte erros de validação da API em { campo: mensagem } para o Formik (setErrors). */
export function fieldErrors(error) {
    const details = error?.response?.data?.details;

    if (!Array.isArray(details)) {
        return {};
    }

    return details.reduce((acc, item) => {
        if (item?.field && !acc[item.field]) {
            acc[item.field] = item.message;
        }
        return acc;
    }, {});
}
