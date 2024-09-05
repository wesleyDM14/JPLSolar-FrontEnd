import { BrowserRouter as Router } from "react-router-dom";
import { connect } from "react-redux";

import { AppRoutes } from "./routes";

const App = ({ checked }) => {
  return (
    <Router>
      {checked && <AppRoutes />}
    </Router>
  );
}

const mapStateToProps = ({ session }) => ({
  checked: session.checked
});

export default connect(mapStateToProps)(App);