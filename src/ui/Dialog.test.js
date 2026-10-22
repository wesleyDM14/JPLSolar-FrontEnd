import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Dialog } from './Dialog';

// Duas janelas, uma por cima da outra (como o formulário da conta com o cadastro rápido aberto sobre ele).
function Duas({ aoFecharA = () => {}, aoFecharB = () => {} }) {
    const [a, setA] = useState(true);
    const [b, setB] = useState(true);
    return (
        <>
            <button onClick={() => setA(false)}>fechar-a</button>
            <button onClick={() => setB(false)}>fechar-b</button>
            <Dialog open={a} title="Janela A" onClose={() => { aoFecharA(); setA(false); }}>A</Dialog>
            <Dialog open={b} title="Janela B" onClose={() => { aoFecharB(); setB(false); }}>B</Dialog>
        </>
    );
}

describe('rolagem da página com janelas abertas', () => {
    beforeEach(() => {
        document.body.style.overflow = '';
    });

    it('trava ao abrir e devolve ao fechar a última, mesmo fechando fora de ordem', () => {
        render(<Duas />);
        expect(document.body.style.overflow).toBe('hidden');

        // A abriu primeiro e fecha primeiro: o bug antigo deixava a página travada para sempre.
        fireEvent.click(screen.getByText('fechar-a'));
        expect(document.body.style.overflow).toBe('hidden');

        fireEvent.click(screen.getByText('fechar-b'));
        expect(document.body.style.overflow).toBe('');
    });

    it('respeita a rolagem que já existia antes de abrir', () => {
        document.body.style.overflow = 'scroll';
        const { unmount } = render(<Duas />);
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('scroll');
    });

    it('re-renderizar com um onClose novo não destrava a página', () => {
        const { rerender } = render(<Dialog open title="X" onClose={() => {}}>x</Dialog>);
        expect(document.body.style.overflow).toBe('hidden');
        rerender(<Dialog open title="X" onClose={() => {}}>x</Dialog>);
        rerender(<Dialog open title="X" onClose={() => {}}>x</Dialog>);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('Esc fecha só a janela de cima', () => {
        const aoFecharA = jest.fn();
        const aoFecharB = jest.fn();
        render(<Duas aoFecharA={aoFecharA} aoFecharB={aoFecharB} />);

        act(() => {
            fireEvent.keyDown(document, { key: 'Escape' });
        });
        expect(aoFecharB).toHaveBeenCalledTimes(1);
        expect(aoFecharA).not.toHaveBeenCalled();
    });
});
