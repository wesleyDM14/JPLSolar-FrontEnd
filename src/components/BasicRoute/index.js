import { Navigate } from "react-router-dom";
import { connect } from "react-redux";

const BasicRoute = ({ children, isAuthenticated }) => {
    return !isAuthenticated ? children : <Navigate to='/dashboard' />
}

const mapStateToProps = ({ session }) => ({
    isAuthenticated: session.isAuthenticated
});

export default connect(mapStateToProps)(BasicRoute);