import styled from 'styled-components';
import { tokens } from '../../ui/tokens';

const { colors } = tokens;
const MOBILE = `(max-width: ${tokens.breakpoint})`;

export const Screen = styled.div`
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(320px, 5fr) minmax(360px, 4fr);
    background: ${colors.background};

    @media ${MOBILE} {
        grid-template-columns: 1fr;
    }
`;

export const BrandPanel = styled.section`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px clamp(24px, 6vw, 96px);
    color: #f4f6f8;
    background:
        radial-gradient(900px 500px at 10% 0%, rgba(211, 47, 47, 0.35), transparent 60%),
        linear-gradient(160deg, #14171c 0%, #1d232b 100%);

    img {
        width: 76px;
        height: 76px;
        object-fit: contain;
        padding: 6px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.95);
        margin-bottom: 20px;
    }

    h1 {
        font-size: clamp(2rem, 3.4vw, 2.8rem);
        margin: 0 0 8px;
    }

    p {
        max-width: 34em;
        margin: 0;
        font-size: 1.05rem;
        line-height: 1.55;
        color: #aeb6c2;
    }

    @media ${MOBILE} {
        padding: 28px 24px;

        img {
            width: 56px;
            height: 56px;
            margin-bottom: 12px;
        }

        p {
            font-size: 0.95rem;
        }
    }
`;

export const FeatureList = styled.ul`
    list-style: none;
    margin: 32px 0 0;
    padding: 0;
    display: grid;
    gap: 14px;

    li {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.98rem;
        color: #d7dce3;
    }

    svg {
        flex: none;
        font-size: 18px;
        color: #ff6b6b;
    }

    @media ${MOBILE} {
        display: none;
    }
`;

export const FormPanel = styled.section`
    position: relative;
    display: grid;
    place-items: center;
    padding: 32px 20px;
`;

export const Card = styled.div`
    width: 100%;
    max-width: 400px;
    padding: 32px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);

    h2 {
        margin: 0 0 4px;
        font-size: 1.5rem;
        color: ${colors.text};
    }

    p {
        margin: 0 0 24px;
        color: ${colors.muted};
    }

    form > * + * {
        margin-top: 4px;
    }
`;

export const PasswordToggle = styled.button`
    position: absolute;
    right: 8px;
    top: 28px;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: ${colors.muted};
    cursor: pointer;

    &:hover {
        background: ${colors.neutralBg};
    }
`;
