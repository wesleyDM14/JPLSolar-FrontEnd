import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from 'react-redux';
import { hasPermission } from "../../utils/permissions";

const AuthRoute = ({ children }) => {

    const isAuthenticated = useSelector((state) => state.session.isAuthenticated);
    const userRole = useSelector((state) => state.session.user?.userRole);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/" />
    }

    if (!hasPermission(userRole, location.pathname)) {
        return <Navigate to="/not-authorized" />
    }

    return children;
}

export default AuthRoute;