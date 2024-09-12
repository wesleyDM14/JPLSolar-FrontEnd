import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const BasicRoute = ({ children }) => {

    const isAuthenticated = useSelector((state) => state.session.isAuthenticated);

    return !isAuthenticated ? children : <Navigate to='/dashboard' />
}

export default BasicRoute;