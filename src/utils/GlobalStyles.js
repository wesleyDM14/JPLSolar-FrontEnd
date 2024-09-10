import { createGlobalStyle } from "styled-components"

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
    red: '#FF4D4D'
}

const GlobalStyle = createGlobalStyle`

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
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
`;

export default GlobalStyle;