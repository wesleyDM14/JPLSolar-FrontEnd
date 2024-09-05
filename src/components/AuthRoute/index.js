import { Navigate } from "react-router-dom";
import { connect } from 'react-redux';

const AuthRoute = ({ children, authenticated }) => {
    return authenticated ? children : <Navigate to='/login'/>
}

const mapStateToProps = ({ session }) => ({
    authenticated: session.authenticated
})

export default connect(mapStateToProps)(AuthRoute);