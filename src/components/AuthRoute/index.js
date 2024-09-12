import { Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';

const AuthRoute = ({ children }) => {

    const isAuthenticated = useSelector((state) => state.session.isAuthenticated);

    return isAuthenticated ? children : <Navigate to='/' />
}

export default AuthRoute;