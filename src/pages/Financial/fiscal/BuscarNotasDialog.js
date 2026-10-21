import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../../../api/client';
import { fiscalApi } from '../../../api/resources';
import { Button, Dialog, FilterSelect, Muted, tokens } from '../../../ui';
import { anoAtual, hojeIso } from '../../../utils/datas';

const { colors } = tokens;

const PRIMEIRO_ANO = 2020;

const AMBIENTES = [
    { value: 'PRODUCAO', label: 'Produção (notas reais)' },
    { value: 'HOMOLOGACAO', label: 'Homologação (ambiente de teste)' },
];

const somar = (a, b) => ({
    encontradas: a.encontradas + b.encontradas,
    importadas: a.importadas + b.importadas,
    jaExistentes: a.jaExistentes + b.jaExistentes,
    canceladasAtualizadas: a.canceladasAtualizadas + b.canceladasAtualizadas,
});

/**
 * Busca na prefeitura as NFS-e já emitidas pela empresa e guarda as que o sistema ainda não tem.
 * A consulta é feita um ano por vez; não precisa do certificado, só do token do ambiente.
 */
export default function BuscarNotasDialog({ open, onClose }) {
    const queryClient = useQueryClient();
    const config = useQuery({ queryKey: ['fiscal', 'configuracao'], queryFn: fiscalApi.configuracao, enabled: open });

    const [ambiente, setAmbiente] = useState('');
    const [ano, setAno] = useState('TUDO');
    const [rodando, setRodando] = useState(false);
    const [andamento, setAndamento] = useState('');
    const [total, setTotal] = useState(null);
    const [mensagens, setMensagens] = useState([]);

    const ambienteEscolhido = ambiente || config.data?.ambiente || 'HOMOLOGACAO';
    const anos = Array.from({ length: anoAtual() - PRIMEIRO_ANO + 1 }, (_, i) => anoAtual() - i);

    const buscar = async () => {
        setRodando(true);
        setTotal(null);
        setMensagens([]);

        const lista = ano === 'TUDO' ? [...anos].reverse() : [Number(ano)];
        let acumulado = { encontradas: 0, importadas: 0, jaExistentes: 0, canceladasAtualizadas: 0 };
        const avisos = [];

        try {
            for (const [indice, a] of lista.entries()) {
                setAndamento(`${a} (${indice + 1} de ${lista.length})`);
                const fim = a === anoAtual() ? hojeIso() : `${a}-12-31`;
                const resposta = await fiscalApi.buscarNotas({ de: `${a}-01-01`, ate: fim, ambiente: ambienteEscolhido });
                acumulado = somar(acumulado, resposta);
                avisos.push(...resposta.mensagens);
                setTotal(acumulado);
            }
            toast.success(`${acumulado.importadas} nota(s) importada(s).`);
        } catch (erro) {
            toast.error(errorMessage(erro));
            avisos.push(errorMessage(erro));
        } finally {
            setMensagens(avisos);
            setRodando(false);
            setAndamento('');
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
        }
    };

    return (
        <Dialog
            open={open}
            title="Buscar notas da prefeitura"
            subtitle="Traz as NFS-e que a empresa já emitiu, com o XML de cada uma."
            width={520}
            onClose={rodando ? undefined : onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={rodando}>Fechar</Button>
                    <Button loading={rodando} onClick={buscar}>{rodando ? `Buscando ${andamento}…` : 'Buscar notas'}</Button>
                </>
            }
        >
            <div style={{ display: 'grid', gap: 14 }}>
                <FilterSelect label="Ambiente" placeholder={null} options={AMBIENTES} value={ambienteEscolhido} onChange={(evento) => setAmbiente(evento.target.value)} disabled={rodando} />
                {ambienteEscolhido === 'HOMOLOGACAO' && <Muted>O ambiente de teste não tem as notas reais. Para trazer as notas já emitidas, use Produção (precisa do token de produção no servidor).</Muted>}

                <FilterSelect
                    label="Período"
                    placeholder={null}
                    value={ano}
                    onChange={(evento) => setAno(evento.target.value)}
                    disabled={rodando}
                    options={[{ value: 'TUDO', label: `Tudo (${PRIMEIRO_ANO} até hoje)` }, ...anos.map((a) => ({ value: String(a), label: String(a) }))]}
                />

                {total && (
                    <div style={{ padding: 12, borderRadius: 10, background: colors.background, lineHeight: 1.7 }}>
                        <div>Encontradas na prefeitura: <strong>{total.encontradas}</strong></div>
                        <div>Importadas agora: <strong>{total.importadas}</strong></div>
                        <div>Já estavam no sistema: <strong>{total.jaExistentes}</strong></div>
                        {total.canceladasAtualizadas > 0 && <div>Marcadas como canceladas: <strong>{total.canceladasAtualizadas}</strong></div>}
                    </div>
                )}

                {mensagens.length > 0 && (
                    <div style={{ padding: 12, borderRadius: 10, background: colors.dangerBg, color: colors.danger, fontSize: '0.9rem' }}>
                        {[...new Set(mensagens)].slice(0, 6).map((m) => <div key={m}>{m}</div>)}
                    </div>
                )}
            </div>
        </Dialog>
    );
}
