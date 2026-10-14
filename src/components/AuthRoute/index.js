import { Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';

// Todo usuário autenticado é administrador; basta estar logado.
const AuthRoute = ({ children }) => {
    const isAuthenticated = useSelector((state) => state.session.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/" />
    }

    return children;
}

export default AuthRoute;
