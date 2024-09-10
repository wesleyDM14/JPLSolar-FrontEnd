import { configureStore } from "@reduxjs/toolkit";
import sessionReducer from "../reducers/sessionReducer";

const store = configureStore({
    reducer: {
        session: sessionReducer,
    },
});

export default store;