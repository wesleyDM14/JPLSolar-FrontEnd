import { createGlobalStyle } from "styled-components"
import { isSmallScreen } from "../functions/layoutFuntions";

export const colors = {
    title: '#F9A825',
    background: '#E3F2FD',
    sidebar: '#0D47A1',
    mainText: '#263238',
    description: '#757575',
    icon: '#FFB300',
    hover: '#C0CA33',
    btnPrimary: '#00897B',
    btnSecondary: '#039BE5',
    white: '#ffffff',
    red: '#FF4D4D',
    greenNeutral: '#4CAF50',
    darkGray: '#888888',
    slimGray: '#E0E0E0',
    navbar: '#1976D2'
}

export const ModalStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: isSmallScreen() ? '10%' : 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        overflowY: 'auto',
        maxHeight: '600px',
        padding: '0',
        maxWidth: '90%'
    }
}

const GlobalStyle = createGlobalStyle`

    * {
        margin: 0;
        padding: 0;
    }

    body {
        font-family: 'Roboto', sans-serif;
        background-color: ${colors.background};
    }

    h1, h2, h3, h4, h5, h6 {
        font-family: 'Montserrat', sans-serif;
    }

    p, span, a, li {
        font-family: 'Open Sans', sans-serif;
    }

    main{
        grid-area: main;
        padding: 15px;
    }

    .main-container {
        display: grid;
        height: 100vh;
        width: 100%;
        grid-template-columns: 0.8fr repeat(3, 1fr);
        grid-template-rows: 0.2fr 3fr;
        grid-template-areas: 
            'sidebar nav nav nav'
            'sidebar main main main'
        ;

        @media only screen and (max-width: 978px) {
            grid-template-columns: 1fr;
            grid-template-rows: 0.2fr 3fr;
            grid-template-areas: "nav" "main";
        }
    }

    .sidebar-responsive {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        background: ${colors.sidebar};
        padding: 20px;
        z-index: 9999 !important;
        overflow-y: auto;
        display: flex !important;
        flex-direction: column;
    }

    .label-responsive {
        display: flex;

        @media only screen and (max-width: 978px){
            display: none;
        }
    }

    .first-label {
        margin-left: 5px;
    }

    #sidebar {
        background: ${colors.sidebar};
        grid-area: sidebar;
        overflow-y: hidden;
        padding: 20px;
        -webkit-transition: all 0.5s;
        transition: all 0.5s;

        @media only screen and (max-width: 978px){
            display: none;
        }
    }

    .react-datepicker-wrapper {
        display: flex !important;
    }
    .react-datepicker__input-container {
        display: flex !important;
    }

    .react-datepicker__input-container>input {
        width: 100%;
        padding: 10px 2px;
        font-size: 17px;
        letter-spacing: 1px;
        color: ${colors.mainText};
        background-color:${colors.background};
        border-radius: 5px;
        border: 0;
        outline: 0;
        margin: 0px 0 10px 0;
        transition: ease-in-out 0.3s;
        display: block;
    }

    .responsive-header {
        @media only screen and (max-width: 978px){
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
        }
    }

    .eyeIcon {
        top: 20% !important;
        color: ${colors.mainText} !important;
        font-size: 16px !important;
    }

    main {
        background-color: ${colors.background};
        grid-area: main;
        overflow-y: auto;
    }

    ::-webkit-scrollbar {
        width: 5px;
        height: 6px;
    }

    ::-webkit-scrollbar-track {
        background-color: ${colors.slimGray};
        border-radius: 10px;
        box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.2);
    }

    ::-webkit-scrollbar-thumb {
        background-color: ${colors.greenNeutral};
        border-radius: 10px;

        &:hover {
            background-color: ${colors.darkGray};
        }
    }
`;

export default GlobalStyle;