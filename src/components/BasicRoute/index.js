import { Navigate } from "react-router-dom";
import { connect } from "react-redux";

const BasicRoute = ({ children, authenticated }) => {
    return !authenticated ? children : <Navigate to='/dashboard' />
}

const mapStateToProps = ({ session }) => ({
    authenticated: session.authenticated
});

export default connect(mapStateToProps)(BasicRoute);