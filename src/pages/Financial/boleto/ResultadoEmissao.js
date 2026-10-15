import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaPrint } from 'react-icons/fa';
import { errorMessage } from '../../../api/client';
import { imprimirBoletos } from '../../../api/resources';
import { Badge, Button, Dialog, Muted } from '../../../ui';

/**
 * Tela final depois de gerar boletos: resume o que foi emitido e oferece a impressão na hora
 * (1 ou 3 por folha). A impressão sai de um clique do usuário, então o navegador não bloqueia a aba.
 */
export default function ResultadoEmissao({ titulo = 'Boletos gerados', emitidos, falhas = [], ids, onClose }) {
    const [porFolha, setPorFolha] = useState('3');
    const [imprimindo, setImprimindo] = useState(false);

    const imprimir = async () => {
        setImprimindo(true);
        try {
            const naoImpressos = await imprimirBoletos(ids, Number(porFolha));
            if (naoImpressos.length > 0) {
                toast(`${naoImpressos.length} boleto(s) ficaram de fora: ${naoImpressos.slice(0, 2).map((f) => f.motivo).join('; ')}`, { duration: 8000 });
            }
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível reunir os boletos.'));
        } finally {
            setImprimindo(false);
        }
    };

    return (
        <Dialog
            open
            width={560}
            title={titulo}
            onClose={onClose}
            footer={<Button variant="secondary" onClick={onClose}>Fechar</Button>}
        >
            <p style={{ margin: '0 0 14px' }}>
                <Badge $tone="success"><FaCheckCircle /> {emitidos} boleto(s) emitido(s) no Sicredi</Badge>
                {falhas.length > 0 && <> <Badge $tone="danger">{falhas.length} com problema</Badge></>}
            </p>

            {emitidos > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                        Imprimir
                        <select
                            value={porFolha}
                            onChange={(e) => setPorFolha(e.target.value)}
                            style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)' }}
                        >
                            <option value="3">3 boletos por folha (canhoto + ficha)</option>
                            <option value="1">1 boleto por folha (PDF do banco, com Pix)</option>
                        </select>
                    </label>
                    <Button icon={<FaPrint />} loading={imprimindo} onClick={imprimir}>Imprimir boletos</Button>
                </div>
            )}

            {falhas.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <strong>Não emitidos</strong>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                        {falhas.slice(0, 6).map((f, i) => (
                            <li key={`${f.lancamentoId ?? i}`}><Muted>{f.descricao ? `${f.descricao}: ` : ''}{f.motivo}</Muted></li>
                        ))}
                    </ul>
                    {falhas.length > 6 && <Muted>E mais {falhas.length - 6}…</Muted>}
                </div>
            )}
        </Dialog>
    );
}
