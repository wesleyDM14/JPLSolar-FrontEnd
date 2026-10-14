import { Component } from 'react';

// Captura erros de renderização: em vez de uma tela em branco, mostra uma mensagem e permite recarregar.
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // Ponto único para integrar um serviço de monitoramento de erros no futuro.
        console.error('Erro de renderização:', error, info?.componentStack);
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div style={{ padding: 48, textAlign: 'center', fontFamily: 'sans-serif' }}>
                <h2>Algo deu errado nesta tela</h2>
                <p style={{ color: 'var(--c-muted)', margin: '12px 0 20px' }}>
                    O erro foi registrado. Tente recarregar a página; se persistir, volte ao painel.
                </p>
                <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 18px', cursor: 'pointer' }}>
                    Recarregar
                </button>{' '}
                <button type="button" onClick={() => { window.location.href = '/dashboard'; }} style={{ padding: '10px 18px', cursor: 'pointer' }}>
                    Ir para o painel
                </button>
            </div>
        );
    }
}
