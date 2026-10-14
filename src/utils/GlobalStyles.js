import { createGlobalStyle } from "styled-components"
import { isSmallScreen } from "../functions/layoutFuntions";
import { themeCss } from "../ui/theme";

// Cores herdadas das telas antigas. As que dependem do tema apontam para as variáveis CSS (ui/theme.js).
export const colors = {
    title: '#D32F2F',
    background: 'var(--c-bg)',
    sidebar: '#212121',
    mainText: 'var(--c-text)',
    description: 'var(--c-muted)',
    icon: '#D32F2F',
    hover: '#B71C1C',
    btnPrimary: '#424242',
    btnSecondary: '#D32F2F',
    white: 'var(--c-surface)',
    red: '#D32F2F',
    greenNeutral: '#4CAF50',
    darkGray: 'var(--c-muted)',
    slimGray: 'var(--c-neutral-bg)',
    navbar: '#212121'
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
    ${themeCss}

    * {
        margin: 0;
        padding: 0;
    }

    /* Campos com width:100% + padding não podem ultrapassar a própria coluna (sobrepunham o vizinho). */
    input, select, textarea, button {
        box-sizing: border-box;
    }

    body {
        font-family: 'Roboto', sans-serif;
        background-color: var(--c-bg);
        color: var(--c-text);
        transition: background-color 0.2s;
    }

    h1, h2, h3, h4, h5, h6 {
        font-family: 'Montserrat', sans-serif;
    }

    p, span, a, li {
        font-family: 'Open Sans', sans-serif;
    }

    .label-responsive {
    
        @media only screen and (max-width: 978px){
            display: none !important;
        }
    }

    .first-label {
        margin-left: 5px;
    }

    .react-datepicker-wrapper {
        display: flex !important;
    }

    .react-datepicker__input-container {
        display: flex !important;
    }

    .react-datepicker__input-container>input {
        display: flex;
        align-items: center;
        justify-content: center;
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

    .react-date-picker {
        display: flex !important;
        width: 90%;
        background-color: #fff;
        border-color: #dbdbdb;
        border-radius: 4px;
    }

    .react-date-picker__inputGroup {
        padding-bottom: calc(.5em - 1px) !important;
        padding-left: calc(.75em - 1px) !important;
        padding-right: calc(.75em - 1px) !important;
        padding-top: calc(.5em - 1px) !important;
    }

    .react-calendar {
        background: #fff;
        border: 1px solid #a0a096;
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.125em;
        max-width: 100%;
        width: 350px;
    }

    .react-calendar__navigation {
        display: flex;
        height: 44px;
        margin-bottom: 1em;
    }

    .react-calendar__navigation > button {
        background: none;
        min-width: 44px;
        border: 0 !important;
    }

    .react-calendar__tile {
        background: none;
        line-height: 16px;
        max-width: 100%;
        padding: 10px 6px;
        text-align: center;
        border: 0;
    }

    .react-calendar__tile--active {
        background-color: ${colors.sidebar};
        color: #fff;
    }

    .label {
        font-weight: bold;
        font-size: 16px;
    }

    .label-chart-responsive {
        font-size: 12px;
        @media only screen and (max-width: 978px){
            font-size: 7px;
        }
    }

    .detail-span {
        font-size: 12px !important;
    }

    main {
        background-color: var(--c-bg);
    }

    /* Gráficos (recharts) acompanham o tema */
    .recharts-text,
    .recharts-cartesian-axis-tick-value {
        fill: var(--c-muted);
    }

    .recharts-cartesian-grid line {
        stroke: var(--c-border);
    }

    .recharts-legend-item-text {
        color: var(--c-text) !important;
    }

    .recharts-default-tooltip {
        background-color: var(--c-surface) !important;
        border-color: var(--c-border) !important;
        color: var(--c-text);
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
        background-color: var(--c-border);
        border-radius: 10px;

        &:hover {
            background-color: ${colors.darkGray};
        }
    }
`;

export default GlobalStyle;