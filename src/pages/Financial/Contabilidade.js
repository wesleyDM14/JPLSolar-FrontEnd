import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
    FaBalanceScale,
    FaBook,
    FaBoxOpen,
    FaEnvelope,
    FaExclamationTriangle,
    FaEye,
    FaFileCsv,
    FaFileInvoiceDollar,
    FaFilePdf,
    FaHistory,
    FaListUl,
    FaPaperPlane,
    FaWater,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi, fiscalApi, openFileInTab, saveResponse } from '../../api/resources';
import { Badge, Button, Card, DataTable, Dialog, FilterInput, Grid, IconChip, LoadingBlock, Muted, Page, PageHeader, Reveal, SectionTitle, tokens } from '../../ui';
import { BarraDeFiltros, mesAtual, somarMesesChave } from './comuns';

const { colors } = tokens;

const CATALOGO = [
    { tipo: 'livro-caixa', titulo: 'Livro caixa', descricao: 'Entradas e saídas do mês, com saldo corrido.', icon: FaBook, tom: 'blue', periodo: 'mes' },
    { tipo: 'razao', titulo: 'Razão por categoria', descricao: 'Movimento do mês por categoria e grupo do DRE.', icon: FaListUl, tom: 'purple', periodo: 'mes' },
    { tipo: 'contas-receber', titulo: 'Contas a receber', descricao: 'Parcelas que vencem no mês e a situação de cada uma.', icon: FaFileInvoiceDollar, tom: 'green', periodo: 'mes' },
    { tipo: 'contas-pagar', titulo: 'Contas a pagar', descricao: 'Contas que vencem no mês, por fornecedor.', icon: FaFileInvoiceDollar, tom: 'red', periodo: 'mes' },
    { tipo: 'dre', titulo: 'DRE', descricao: 'Resultado dos 6 meses até o mês escolhido.', icon: FaBalanceScale, tom: 'teal', periodo: 'ate6' },
    { tipo: 'fluxo-caixa', titulo: 'Fluxo de caixa', descricao: 'Previsto e realizado nos 6 meses até o mês escolhido.', icon: FaWater, tom: 'blue', periodo: 'ate6' },
    { tipo: 'inadimplencia', titulo: 'Inadimplência', descricao: 'Contas a receber e a pagar por faixa de atraso.', icon: FaExclamationTriangle, tom: 'orange', periodo: 'nenhum' },
    { tipo: 'clientes-risco', titulo: 'Score dos clientes', descricao: 'Score de 0 a 1000 e risco de inadimplência por cliente.', icon: FaExclamationTriangle, tom: 'red', periodo: 'nenhum' },
];

const CartaoRelatorio = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-sizing: border-box;
    height: 100%;
    padding: 18px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 16px;
    box-shadow: ${tokens.shadow};
    transition: transform 0.18s, box-shadow 0.18s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
    }

    h3 {
        margin: 0;
        font-size: 1.02rem;
    }

    p {
        margin: 2px 0 0;
        color: ${colors.muted};
        font-size: 0.87rem;
        line-height: 1.45;
    }

    .acoes {
        margin-top: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
`;

const Pacote = styled.section`
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
    padding: 20px 22px;
    margin-bottom: 18px;
    border-radius: 18px;
    color: #fff;
    background: linear-gradient(135deg, #1b2431, #2b3a52);
    box-shadow: 0 12px 28px rgba(20, 30, 50, 0.3);

    .texto {
        flex: 1;
        min-width: 240px;
    }

    h2 {
        margin: 0 0 4px;
        font-size: 1.2rem;
    }

    p {
        margin: 0;
        color: #b8c4d6;
        font-size: 0.9rem;
    }

    .acoes {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
`;

function parametrosDe(item, mes) {
    if (item.periodo === 'mes') return { mes };
    if (item.periodo === 'ate6') return { de: somarMesesChave(mes, -5), ate: mes };
    return {};
}

/** Central de relatórios contábeis: visualizar, baixar em CSV/PDF, pacote do mês e envio ao contador. */
export default function Contabilidade() {
    const queryClient = useQueryClient();
    const [mes, setMes] = useState(mesAtual());
    const [previa, setPrevia] = useState(null); // { item, tabela }
    const [carregando, setCarregando] = useState('');
    const [envio, setEnvio] = useState(false);
    const [opcoesEnvio, setOpcoesEnvio] = useState({ incluirXml: true, incluirRelatorios: true, mensagem: '' });

    const configuracao = useQuery({ queryKey: ['fiscal', 'configuracao'], queryFn: fiscalApi.configuracao });
    const envios = useQuery({ queryKey: ['fiscal', 'envios'], queryFn: fiscalApi.envios });

    const executar = async (chave, tarefa) => {
        setCarregando(chave);
        try {
            await tarefa();
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível concluir.'));
        } finally {
            setCarregando('');
        }
    };

    const visualizar = (item) => executar(`ver-${item.tipo}`, async () => {
        const tabela = await financeiroApi.relatorio(item.tipo, parametrosDe(item, mes));
        setPrevia({ item, tabela });
    });

    const baixar = (item, formato) => executar(`${formato}-${item.tipo}`, async () => {
        if (formato === 'pdf') {
            await openFileInTab(() => financeiroApi.relatorioArquivo(item.tipo, parametrosDe(item, mes), 'pdf'), `${item.tipo}.pdf`, 'Gerando relatório…');
        } else {
            const resposta = await financeiroApi.relatorioArquivo(item.tipo, parametrosDe(item, mes), 'csv');
            saveResponse(resposta, `${item.tipo}-${mes}.csv`);
        }
    });

    const baixarPacote = () => executar('pacote', async () => {
        const resposta = await financeiroApi.pacoteContabil(mes);
        saveResponse(resposta, `Pacote contábil ${mes}.zip`);
    });

    const enviar = useMutation({
        mutationFn: () => fiscalApi.enviarContador({ mes, ...opcoesEnvio, mensagem: opcoesEnvio.mensagem || undefined }),
        onSuccess: async () => {
            toast.success('Documentos enviados ao contador.');
            setEnvio(false);
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const contador = configuracao.data;

    return (
        <Page>
            <PageHeader icon={FaBook} tone="blue" title="Contabilidade" subtitle="Relatórios do mês, pacote para o contador e histórico de envios." />

            <BarraDeFiltros>
                <FilterInput label="Mês de referência" type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} />
                <Muted style={{ alignSelf: 'center' }}>Os relatórios abaixo usam este mês.</Muted>
            </BarraDeFiltros>

            <Reveal>
                <Pacote>
                    <IconChip $tone="red" $size={56}><FaBoxOpen /></IconChip>
                    <div className="texto">
                        <h2>Pacote contábil de {mes.slice(5, 7)}/{mes.slice(0, 4)}</h2>
                        <p>
                            Livro caixa, razão, contas a receber e a pagar, DRE e os XMLs das notas do mês, num arquivo só.
                            {contador?.emailContador ? ` Contador: ${contador.nomeContador || 'cadastrado'} (${contador.emailContador}).` : ' Cadastre o e-mail do contador em Notas fiscais → Configuração.'}
                        </p>
                    </div>
                    <div className="acoes">
                        <Button variant="secondary" icon={<FaBoxOpen />} loading={carregando === 'pacote'} onClick={baixarPacote}>Baixar pacote (.zip)</Button>
                        <Button icon={<FaPaperPlane />} onClick={() => setEnvio(true)}>Enviar ao contador</Button>
                    </div>
                </Pacote>
            </Reveal>

            <Grid $cols={2} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginBottom: 18 }}>
                {CATALOGO.map((item, indice) => {
                    const Icone = item.icon;
                    return (
                        <Reveal key={item.tipo} $delay={indice * 40}>
                            <CartaoRelatorio>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <IconChip $tone={item.tom} $size={44}><Icone /></IconChip>
                                    <div>
                                        <h3>{item.titulo}</h3>
                                    </div>
                                </div>
                                <p>{item.descricao}</p>
                                <div className="acoes">
                                    <Button size="sm" variant="secondary" icon={<FaEye />} loading={carregando === `ver-${item.tipo}`} onClick={() => visualizar(item)}>Ver</Button>
                                    <Button size="sm" variant="secondary" icon={<FaFileCsv />} loading={carregando === `csv-${item.tipo}`} onClick={() => baixar(item, 'csv')}>CSV</Button>
                                    <Button size="sm" variant="secondary" icon={<FaFilePdf />} loading={carregando === `pdf-${item.tipo}`} onClick={() => baixar(item, 'pdf')}>PDF</Button>
                                </div>
                            </CartaoRelatorio>
                        </Reveal>
                    );
                })}
            </Grid>

            <Card>
                <SectionTitle icon={FaHistory} tom="gray">Envios ao contador</SectionTitle>
                {envios.isLoading ? (
                    <LoadingBlock />
                ) : (
                    <DataTable
                        rows={envios.data ?? []}
                        emptyTitle="Nenhum envio ainda"
                        emptyDescription="Os envios ao contador ficam registrados aqui."
                        columns={[
                            { key: 'data', header: 'Enviado em', render: (e) => new Date(e.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }) },
                            { key: 'periodo', header: 'Período', render: (e) => `${e.periodo.slice(5, 7)}/${e.periodo.slice(0, 4)}` },
                            { key: 'email', header: 'Para', render: (e) => e.email },
                            { key: 'notas', header: 'Notas', render: (e) => e.notas },
                            { key: 'status', header: 'Situação', render: (e) => (e.status === 'ENVIADO' ? <Badge $tone="success">Enviado</Badge> : <Badge $tone="danger" title={e.detalhe ?? ''}>Falhou</Badge>) },
                        ]}
                    />
                )}
            </Card>

            <Dialog
                open={Boolean(previa)}
                width={1000}
                title={previa?.tabela.titulo}
                subtitle={previa?.tabela.periodo}
                onClose={() => setPrevia(null)}
                footer={
                    <>
                        <Button variant="secondary" icon={<FaFileCsv />} onClick={() => baixar(previa.item, 'csv')}>Baixar CSV</Button>
                        <Button icon={<FaFilePdf />} onClick={() => baixar(previa.item, 'pdf')}>Abrir PDF</Button>
                    </>
                }
            >
                {previa && (
                    <>
                        {previa.tabela.resumo && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                                {previa.tabela.resumo.map((r) => (
                                    <Badge key={r.rotulo} $tone="info">{r.rotulo}: {r.valor}</Badge>
                                ))}
                            </div>
                        )}
                        <DataTable
                            rows={[...previa.tabela.linhas, ...(previa.tabela.rodape ? [previa.tabela.rodape] : [])]}
                            rowKey={(_, indice) => indice}
                            emptyTitle="Sem lançamentos no período"
                            columns={previa.tabela.colunas.map((coluna, posicao) => ({
                                key: String(posicao),
                                header: coluna.rotulo,
                                render: (linha) => {
                                    const ultimaLinha = previa.tabela.rodape && linha === previa.tabela.rodape;
                                    return <span style={{ display: 'block', textAlign: coluna.direita ? 'right' : 'left', fontWeight: ultimaLinha ? 800 : 400 }}>{linha[posicao]}</span>;
                                },
                            }))}
                        />
                    </>
                )}
            </Dialog>

            <Dialog
                open={envio}
                width={520}
                title="Enviar ao contador"
                subtitle={`Competência ${mes.slice(5, 7)}/${mes.slice(0, 4)}`}
                onClose={() => setEnvio(false)}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEnvio(false)}>Cancelar</Button>
                        <Button icon={<FaPaperPlane />} loading={enviar.isPending} disabled={!contador?.emailContador} onClick={() => enviar.mutate()}>Enviar agora</Button>
                    </>
                }
            >
                {contador?.emailContador ? (
                    <div style={{ display: 'grid', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <IconChip $soft $tone="blue" $size={40}><FaEnvelope /></IconChip>
                            <div>
                                <strong>{contador.nomeContador || 'Contador'}</strong>
                                <div><Muted>{contador.emailContador}</Muted></div>
                            </div>
                        </div>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="checkbox" checked={opcoesEnvio.incluirRelatorios} onChange={(e) => setOpcoesEnvio((o) => ({ ...o, incluirRelatorios: e.target.checked }))} />
                            Relatórios do mês (livro caixa, razão, contas e DRE)
                        </label>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="checkbox" checked={opcoesEnvio.incluirXml} onChange={(e) => setOpcoesEnvio((o) => ({ ...o, incluirXml: e.target.checked }))} />
                            XMLs das notas fiscais do mês
                        </label>
                        <FilterInput label="Mensagem (opcional)" placeholder="Ex.: Segue o fechamento do mês." value={opcoesEnvio.mensagem} onChange={(e) => setOpcoesEnvio((o) => ({ ...o, mensagem: e.target.value }))} />
                        {!contador.emailDisponivel && (
                            <Badge $tone="warning">O servidor ainda não tem e-mail configurado.</Badge>
                        )}
                    </div>
                ) : (
                    <p style={{ margin: 0 }}>
                        Nenhum contador cadastrado. <Link to="/financeiro/fiscal/configuracao">Cadastre o e-mail do contador</Link> para poder enviar os documentos.
                    </p>
                )}
            </Dialog>
        </Page>
    );
}
