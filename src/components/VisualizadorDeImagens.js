import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronLeft, FaChevronRight, FaDownload, FaExternalLinkAlt, FaTimes } from 'react-icons/fa';
import styled from 'styled-components';
import { useJanelaModal } from '../ui';
import { urlDoAnexo } from '../utils/anexos';

const Fundo = styled.div`
    position: fixed;
    inset: 0;
    z-index: 11000;
    display: flex;
    flex-direction: column;
    background: rgba(8, 10, 14, 0.92);
`;

const Barra = styled.header`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    color: #fff;

    .nome {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
    }

    .contagem {
        font-size: 0.85rem;
        opacity: 0.75;
    }
`;

const Botao = styled.a`
    display: inline-grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 15px;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        background: rgba(255, 255, 255, 0.24);
    }
`;

const Palco = styled.div`
    position: relative;
    flex: 1;
    min-height: 0;
    display: grid;
    place-items: center;
    padding: 0 56px 16px;

    img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 6px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    }

    .aviso {
        color: #fff;
        text-align: center;
        line-height: 1.6;
    }

    @media (max-width: 640px) {
        padding: 0 8px 12px;
    }
`;

const Seta = styled(Botao).attrs({ as: 'button', type: 'button' })`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    ${({ $lado }) => ($lado === 'esq' ? 'left: 8px;' : 'right: 8px;')}
    width: 44px;
    height: 56px;
`;

/**
 * Abre as fotos em tamanho grande, sem baixar: setas (teclado ou tela) trocam de foto, Esc ou clique fora fecha.
 * Mostra a versão "grande" (leve); o original fica a um clique, em "abrir original" ou "baixar".
 */
export default function VisualizadorDeImagens({ imagens, indiceInicial = 0, onFechar }) {
    const [indice, setIndice] = useState(indiceInicial);
    const [falhou, setFalhou] = useState(false);
    const atual = imagens[indice];
    const total = imagens.length;

    useJanelaModal(true, onFechar);

    const ir = useCallback(
        (passo) => {
            setFalhou(false);
            setIndice((i) => (i + passo + total) % total);
        },
        [total],
    );

    useEffect(() => {
        const aoTeclar = (e) => {
            if (e.key === 'ArrowRight') ir(1);
            if (e.key === 'ArrowLeft') ir(-1);
        };
        document.addEventListener('keydown', aoTeclar);
        return () => document.removeEventListener('keydown', aoTeclar);
    }, [ir]);

    // Já deixa as vizinhas no cache do navegador para a troca ser instantânea.
    useEffect(() => {
        [indice + 1, indice - 1].forEach((i) => {
            const vizinha = imagens[(i + total) % total];
            if (vizinha && vizinha !== atual) new Image().src = urlDoAnexo(vizinha, 'grande');
        });
    }, [indice, imagens, total, atual]);

    if (!atual) return null;

    return createPortal(
        <Fundo role="dialog" aria-modal="true" aria-label={`Foto ${atual.nomeArquivo}`} onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
            <Barra onMouseDown={(e) => e.stopPropagation()}>
                <span className="nome" title={atual.nomeArquivo}>{atual.nomeArquivo}</span>
                {total > 1 && <span className="contagem">{indice + 1} de {total}</span>}
                <Botao href={urlDoAnexo(atual)} target="_blank" rel="noreferrer" title="Abrir original em outra aba" aria-label="Abrir original em outra aba"><FaExternalLinkAlt /></Botao>
                <Botao href={urlDoAnexo(atual, 'baixar')} title="Baixar original" aria-label="Baixar original"><FaDownload /></Botao>
                <Botao as="button" type="button" onClick={onFechar} title="Fechar (Esc)" aria-label="Fechar"><FaTimes /></Botao>
            </Barra>

            <Palco onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
                {falhou ? (
                    <div className="aviso">
                        Não foi possível mostrar esta imagem.
                        <br />
                        <a href={urlDoAnexo(atual)} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>Abrir o arquivo original</a>
                    </div>
                ) : (
                    <img key={atual.id} src={urlDoAnexo(atual, 'grande')} alt={atual.nomeArquivo} onError={() => setFalhou(true)} />
                )}
                {total > 1 && (
                    <>
                        <Seta $lado="esq" onClick={() => ir(-1)} aria-label="Foto anterior"><FaChevronLeft /></Seta>
                        <Seta $lado="dir" onClick={() => ir(1)} aria-label="Próxima foto"><FaChevronRight /></Seta>
                    </>
                )}
            </Palco>
        </Fundo>,
        document.body,
    );
}
