import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBarcode, FaCog, FaCopy, FaFilePdf, FaPlus } from 'react-icons/fa';
import { errorMessage } from '../../../api/client';
import { financeiroApi, openFileInTab } from '../../../api/resources';
import { Badge, Button, Muted, Row } from '../../../ui';
import { dataHoraBr } from '../../../utils/datas';
import EmitirBoletoDialog from './EmitirBoletoDialog';
import GerenciarBoletoDialog from './GerenciarBoletoDialog';

const TOM = (situacao = '') => {
    const t = situacao.toUpperCase();
    if (t.startsWith('LIQUIDADO')) return 'success';
    if (t.startsWith('BAIXA') || t.startsWith('REJEITADO')) return 'neutral';
    if (t.includes('VENCIDO') || t.includes('NEGATIV') || t.includes('PROTEST') || t.includes('CARTORIO')) return 'warning';
    return 'info';
};

/** Bloco "Boleto" do detalhe do lançamento: situação, PDF, linha digitável e atalhos de emissão e gestão. */
export default function BoletoSecao({ lancamento }) {
    const [emitindo, setEmitindo] = useState(false);
    const [gerenciando, setGerenciando] = useState(false);
    const boleto = lancamento.boleto;
    const aberto = lancamento.status === 'ABERTO';

    const verPdf = async () => {
        try {
            await openFileInTab(() => financeiroApi.boletoPdf(lancamento.id), 'boleto.pdf', 'Abrindo boleto…');
        } catch (err) {
            toast.error(errorMessage(err, 'Não foi possível abrir o boleto.'));
        }
    };

    return (
        <div style={{ marginTop: 18 }}>
            <Row $justify="space-between">
                <strong><FaBarcode style={{ marginRight: 6, verticalAlign: -2 }} />Boleto</strong>
                {boleto?.situacao && <Badge $tone={TOM(boleto.situacao)}>{boleto.situacao}</Badge>}
            </Row>

            {boleto ? (
                <div style={{ marginTop: 8 }}>
                    <div><Muted>Nosso número:</Muted> {boleto.nossoNumero}</div>
                    {boleto.linhaDigitavel && <div style={{ wordBreak: 'break-all' }}><Muted>Linha digitável:</Muted> {boleto.linhaDigitavel}</div>}
                    {boleto.situacaoEm && <div><Muted>Consultado em {dataHoraBr(boleto.situacaoEm)}</Muted></div>}
                    <Row style={{ marginTop: 10 }}>
                        <Button size="sm" variant="secondary" icon={<FaFilePdf />} onClick={verPdf}>PDF do boleto</Button>
                        {boleto.linhaDigitavel && (
                            <Button
                                size="sm"
                                variant="ghost"
                                icon={<FaCopy />}
                                onClick={() => navigator.clipboard?.writeText(boleto.linhaDigitavel).then(() => toast.success('Linha digitável copiada.'))}
                            >
                                Copiar linha digitável
                            </Button>
                        )}
                        <Button size="sm" variant="secondary" icon={<FaCog />} onClick={() => setGerenciando(true)}>Gerenciar boleto</Button>
                        {aberto && /^(BAIXADO|REJEITADO)/i.test(boleto.situacao ?? '') && (
                            <Button size="sm" icon={<FaPlus />} onClick={() => setEmitindo(true)}>Emitir novo boleto</Button>
                        )}
                    </Row>
                </div>
            ) : aberto ? (
                <div style={{ marginTop: 8 }}>
                    <Muted>Nenhum boleto emitido para este lançamento.</Muted>
                    <div style={{ marginTop: 8 }}>
                        <Button size="sm" variant="secondary" icon={<FaPlus />} onClick={() => setEmitindo(true)}>Emitir boleto (Sicredi)</Button>
                    </div>
                </div>
            ) : (
                <p><Muted>—</Muted></p>
            )}

            {emitindo && <EmitirBoletoDialog lancamento={lancamento} onClose={() => setEmitindo(false)} />}
            {gerenciando && <GerenciarBoletoDialog lancamento={lancamento} onClose={() => setGerenciando(false)} />}
        </div>
    );
}
