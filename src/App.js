import { BrowserRouter } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppRoutes } from "./routes";
import { useEffect } from "react";
import { login, logout, setChecked } from "./actions/sessionActions";
import GlobalStyle from "./utils/GlobalStyles";
import ErrorBoundary from "./components/ErrorBoundary";

const App = () => {
  const dispatch = useDispatch();
  const { checked } = useSelector((state) => state.session);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const { loginTime, accessToken, user } = JSON.parse(storedUser);
      const currentTime = new Date().getTime();
      const timeout = 7 * 24 * 60 * 60 * 1000; // 7 dias (acompanha a validade do token)

      if (currentTime - loginTime <= timeout) {
        dispatch(login({ accessToken, loginTime, user }));
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
        <ErrorBoundary>{checked && <AppRoutes />}</ErrorBoundary>
      </BrowserRouter>
    </>
  );
}

export default App;