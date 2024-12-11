import { BrowserRouter } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppRoutes } from "./routes";
import { useEffect } from "react";
import { login, logout, setChecked } from "./actions/sessionActions";
import GlobalStyle from "./utils/GlobalStyles";

const App = () => {
  const dispatch = useDispatch();
  const { checked } = useSelector((state) => state.session);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const { loginTime, accessToken, userRole } = JSON.parse(storedUser);
      const currentTime = new Date().getTime();
      const timeout = 30 * 24 * 60 * 60 * 1000; // 30 dias

      if (currentTime - loginTime <= timeout) {
        dispatch(login({ accessToken, loginTime, userRole })); // Dispatch the login action with user data
      } else {
        dispatch(logout());
      }
    } else {
      dispatch(logout());
    }
    dispatch(setChecked());
  }, [dispatch]);

  return (
    <>
      <GlobalStyle />
      <BrowserRouter>
        {checked && <AppRoutes />}
      </BrowserRouter>
    </>
  );
}

export default App;