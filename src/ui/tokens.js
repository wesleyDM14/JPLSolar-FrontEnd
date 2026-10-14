// Tokens do design system. Os valores são variáveis CSS definidas em ui/theme.js (tema claro/escuro):
// páginas e componentes usam apenas estes tokens, então o tema muda sem tocar nas telas.
export const tokens = {
    colors: {
        primary: 'var(--c-primary)',
        primaryHover: 'var(--c-primary-hover)',
        text: 'var(--c-text)',
        muted: 'var(--c-muted)',
        border: 'var(--c-border)',
        surface: 'var(--c-surface)',
        surfaceAlt: 'var(--c-surface-alt)',
        background: 'var(--c-bg)',
        rowHover: 'var(--c-row-hover)',
        success: 'var(--c-success)',
        successBg: 'var(--c-success-bg)',
        warning: 'var(--c-warning)',
        warningBg: 'var(--c-warning-bg)',
        danger: 'var(--c-danger)',
        dangerBg: 'var(--c-danger-bg)',
        info: 'var(--c-info)',
        infoBg: 'var(--c-info-bg)',
        neutralBg: 'var(--c-neutral-bg)',
        overlay: 'var(--c-overlay)',
    },
    radius: '8px',
    shadow: 'var(--c-shadow)',
    space: (n) => `${n * 4}px`,
    breakpoint: '978px',
};
