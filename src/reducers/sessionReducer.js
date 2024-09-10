const initialState = {
    isAuthenticated: false,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loginTime: JSON.parse(localStorage.getItem('user'))?.loginTime || null,
    checked: false,
};

export default function sessionReducer(state = initialState, action) {
    switch (action.type) {
        case 'LOGIN':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload,
                loginTime: new Date().getTime(),
                checked: true,
            };
        case 'LOGOUT':
            localStorage.removeItem('user');
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                loginTime: null,
                checked: true,
            };
        case 'SET_CHECKED':
            return {
                ...state,
                checked: true,
            }
        default:
            return state;
    }
}