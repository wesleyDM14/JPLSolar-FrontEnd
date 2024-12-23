import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { logoutUser } from "../services/authServices";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";


const MainLayout = ({ children }) => {

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.session.user);

    const openSidebar = () => {
        setSidebarOpen(true);
    }

    const closeSidebar = () => {
        setSidebarOpen(false);
    }

    return (
        <div className="main-container">
            <Navbar
                logoutUser={logoutUser}
                openSidebar={openSidebar}
                navigate={navigate}
                dispatch={dispatch}
                user={user}
            />
            <main>
                {React.cloneElement(children, { navigate, user })}
            </main>
            <Sidebar
                sidebarOpen={sidebarOpen}
                closeSidebar={closeSidebar}
                navigate={navigate}
                logoutUser={logoutUser}
                user={user}
                dispatch={dispatch}
            />
        </div>
    )
}

export default MainLayout;