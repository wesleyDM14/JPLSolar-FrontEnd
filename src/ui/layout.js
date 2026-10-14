import styled, { css, keyframes } from 'styled-components';
import { FaExclamationTriangle, FaInbox } from 'react-icons/fa';
import { tokens } from './tokens';
import { IconChip } from './visual';

const { colors } = tokens;

export const Page = styled.div`
    padding: 24px;
    max-width: 1280px;
    margin: 0 auto;

    @media only screen and (max-width: ${tokens.breakpoint}) {
        padding: 16px 12px;
    }
`;

const HeaderWrapper = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
`;

const HeaderIdentity = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
`;

const HeaderTitle = styled.h1`
    font-size: 1.6rem;
    line-height: 1.2;
    color: ${colors.text};
`;

const HeaderSubtitle = styled.p`
    color: ${colors.muted};
    margin-top: 4px;
    font-size: 0.95rem;
`;

const HeaderActions = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`;

export function PageHeader({ title, subtitle, actions, back, icon: Icon, tone: tom = 'red' }) {
    return (
        <HeaderWrapper>
            <HeaderIdentity>
                {Icon && <IconChip $tone={tom} $size={50}><Icon /></IconChip>}
                <div style={{ minWidth: 0 }}>
                    {back}
                    <HeaderTitle>{title}</HeaderTitle>
                    {subtitle && <HeaderSubtitle>{subtitle}</HeaderSubtitle>}
                </div>
            </HeaderIdentity>
            {actions && <HeaderActions>{actions}</HeaderActions>}
        </HeaderWrapper>
    );
}

export const Card = styled.section`
    background: ${colors.surface};
    border-radius: 14px;
    border: 1px solid ${colors.border};
    box-shadow: ${tokens.shadow};
    padding: 20px;
    margin-bottom: 16px;

    @media only screen and (max-width: ${tokens.breakpoint}) {
        padding: 14px;
    }
`;

export const CardTitle = styled.h2`
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.05rem;
    color: ${colors.text};
    margin-bottom: 14px;

    &::before {
        content: '';
        flex: none;
        width: 4px;
        height: 1.1em;
        border-radius: 4px;
        background: linear-gradient(180deg, #E53935, #B71C1C);
    }
`;

export const Grid = styled.div`
    display: grid;
    gap: 14px 16px;
    grid-template-columns: repeat(${({ $cols = 2 }) => $cols}, minmax(0, 1fr));

    @media only screen and (max-width: ${tokens.breakpoint}) {
        grid-template-columns: 1fr;
    }
`;

export const Row = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ $gap = 8 }) => $gap}px;
    flex-wrap: ${({ $wrap = true }) => ($wrap ? 'wrap' : 'nowrap')};
    justify-content: ${({ $justify = 'flex-start' }) => $justify};
`;

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

export const Spinner = styled.span`
    display: inline-block;
    width: ${({ $size = 18 }) => $size}px;
    height: ${({ $size = 18 }) => $size}px;
    border: 2px solid ${colors.border};
    border-top-color: ${colors.primary};
    border-radius: 50%;
    animation: ${spin} 0.7s linear infinite;
`;

const CenterBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 48px 16px;
    color: ${colors.muted};
    text-align: center;
`;

export const LoadingBlock = ({ label = 'Carregando...' }) => (
    <CenterBox>
        <Spinner $size={28} />
        <span>{label}</span>
    </CenterBox>
);

export const EmptyState = ({ title, description, action, icon: Icon = FaInbox }) => (
    <CenterBox>
        <IconChip $soft $tone="gray" $size={58}><Icon /></IconChip>
        <strong style={{ color: colors.text, fontSize: '1.02rem' }}>{title}</strong>
        {description && <span style={{ maxWidth: 420 }}>{description}</span>}
        {action}
    </CenterBox>
);

export const ErrorBlock = ({ message, onRetry }) => (
    <CenterBox>
        <IconChip $soft $tone="red" $size={58}><FaExclamationTriangle /></IconChip>
        <strong style={{ color: colors.danger }}>Não foi possível carregar</strong>
        <span>{message}</span>
        {onRetry && (
            <button
                type="button"
                onClick={onRetry}
                style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, fontWeight: 600 }}
            >
                Tentar novamente
            </button>
        )}
    </CenterBox>
);

const badgeTones = {
    neutral: css`background: ${colors.neutralBg}; color: ${colors.text};`,
    success: css`background: ${colors.successBg}; color: ${colors.success};`,
    warning: css`background: ${colors.warningBg}; color: ${colors.warning};`,
    danger: css`background: ${colors.dangerBg}; color: ${colors.danger};`,
    info: css`background: ${colors.infoBg}; color: ${colors.info};`,
};

export const Badge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 11px;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    white-space: nowrap;
    ${({ $tone = 'neutral' }) => badgeTones[$tone]}
`;

export const Muted = styled.span`
    color: ${colors.muted};
`;

const FichaBox = styled.div`
    padding: 10px 12px;
    border-radius: 10px;
    background: ${colors.surfaceAlt};
    border: 1px solid ${colors.border};
    min-width: 0;
    transition: border-color 0.15s;

    &:hover {
        border-color: ${colors.muted};
    }

    .rotulo {
        font-size: 0.7rem;
        font-weight: 700;
        color: ${colors.muted};
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .valor {
        margin-top: 3px;
        font-weight: 600;
        color: ${colors.text};
        word-break: break-word;
    }
`;

export const KeyValue = ({ label, children }) => (
    <FichaBox>
        <div className="rotulo">{label}</div>
        <div className="valor">{children || <Muted>—</Muted>}</div>
    </FichaBox>
);

const TabsBar = styled.div`
    display: flex;
    gap: 4px;
    border-bottom: 1px solid ${colors.border};
    margin-bottom: 16px;
    overflow-x: auto;
`;

const TabButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    padding: 11px 16px;
    cursor: pointer;
    font-size: 0.95rem;
    color: ${({ $active }) => ($active ? colors.primary : colors.muted)};
    border-bottom: 3px solid ${({ $active }) => ($active ? colors.primary : 'transparent')};
    font-weight: ${({ $active }) => ($active ? 700 : 500)};
    white-space: nowrap;
    transition: color 0.15s, border-color 0.2s, background 0.15s;

    &:hover {
        color: ${colors.primary};
        background: rgba(211, 47, 47, 0.04);
    }

    svg {
        font-size: 1.05em;
    }
`;

export function Tabs({ tabs, value, onChange }) {
    return (
        <TabsBar role="tablist">
            {tabs.map((tab) => (
                <TabButton key={tab.id} role="tab" aria-selected={value === tab.id} $active={value === tab.id} onClick={() => onChange(tab.id)}>
                    {tab.icon}
                    {tab.label}
                </TabButton>
            ))}
        </TabsBar>
    );
}
