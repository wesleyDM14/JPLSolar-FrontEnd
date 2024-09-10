export const login = (userData) => ({
    type: 'LOGIN',
    payload: userData,
});

export const logout = () => ({
    type: 'LOGOUT',
});

export const setChecked = () => ({
    type: 'SET_CHECKED',
});