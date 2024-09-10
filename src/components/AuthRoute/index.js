import { Navigate } from "react-router-dom";
import { connect } from 'react-redux';

const AuthRoute = ({ children, isAuthenticated }) => {
    return isAuthenticated ? children : <Navigate to='/' />
}

const mapStateToProps = ({ session }) => ({
    isAuthenticated: session.isAuthenticated,
})

export default connect(mapStateToProps)(AuthRoute);