import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaDownload, FaHistory } from 'react-icons/fa';
import { errorMessage } from '../../api/client';
import { auditoriaApi, saveResponse } from '../../api/resources';
import { Badge, Button, Card, DataTable, Dialog, ErrorBlock, FilterInput, FilterSelect, FiltersBar, Muted, Page, PageHeader, PaginationBar } from '../../ui';

const TOM = { CRIAR: 'success', ALTERAR: 'info', EXCLUIR: 'danger', LOGIN: 'neutral', LOGIN_FALHOU: 'warning', BAIXA: 'success', ESTORNO: 'warning', EXPORTAR: 'info', IMPORTAR: 'info', ASSINAR: 'success' };

const quando = (v) => new Date(v).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

/** Trilha de auditoria: quem fez o quê, quando e de onde. */
export default function Auditoria() {
    const [filtros, setFiltros] = useState({ de: '', ate: '', userId: '', entidade: '', acao: '', search: '' });
    const [page, setPage] = useState(1);
    const [detalhe, setDetalhe] = useState(null);

    const opcoes = useQuery({ queryKey: ['auditoria', 'filtros'], queryFn: auditoriaApi.filtros });
    const lista = useQuery({ queryKey: ['auditoria', filtros, page], queryFn: () => auditoriaApi.listar({ ...filtros, page, pageSize: 25 }), keepPreviousData: true });

    const mudar = (campo) => (e) => {
        setFiltros((f) => ({ ...f, [campo]: e.target.value }));
        setPage(1);
    };

    const exportar = async () => {
        try {
            saveResponse(await auditoriaApi.exportar(filtros), 'auditoria.csv');
        } catch (erro) {
            toast.error(errorMessage(erro));
        }
    };

    return (
        <Page>
            <PageHeader icon={FaHistory} tone="dark" title="Auditoria" subtitle="Tudo que foi criado, alterado ou apagado, com quem fez e quando." actions={<Button variant="secondary" icon={<FaDownload />} onClick={exportar}>Exportar CSV</Button>} />

            <FiltersBar>
                <FilterInput label="De" type="date" value={filtros.de} onChange={mudar('de')} />
                <FilterInput label="Até" type="date" value={filtros.ate} onChange={mudar('ate')} />
                <FilterSelect label="Usuário" value={filtros.userId} onChange={mudar('userId')} options={(opcoes.data?.usuarios ?? []).map((u) => ({ value: u.id, label: u.nome }))} />
                <FilterSelect label="Área" value={filtros.entidade} onChange={mudar('entidade')} options={(opcoes.data?.entidades ?? []).map((e) => ({ value: e, label: e }))} />
                <FilterSelect label="Ação" value={filtros.acao} onChange={mudar('acao')} options={(opcoes.data?.acoes ?? []).map((a) => ({ value: a, label: a }))} />
                <FilterInput label="Buscar" placeholder="Texto ou usuário…" value={filtros.search} onChange={mudar('search')} />
            </FiltersBar>

            {lista.error ? (
                <ErrorBlock message={errorMessage(lista.error)} onRetry={lista.refetch} />
            ) : (
                <Card>
                    <DataTable
                        loading={lista.isLoading}
                        rows={lista.data?.data}
                        onRowClick={setDetalhe}
                        emptyTitle="Nada registrado com esses filtros"
                        columns={[
                            { key: 'quando', header: 'Quando', render: (l) => quando(l.createdAt) },
                            { key: 'user', header: 'Quem', render: (l) => l.userNome ?? '—' },
                            { key: 'acao', header: 'Ação', render: (l) => <Badge $tone={TOM[l.acao] ?? 'neutral'}>{l.acao}</Badge> },
                            { key: 'ent', header: 'Área', render: (l) => l.entidade },
                            { key: 'desc', header: 'O quê', render: (l) => <span style={{ wordBreak: 'break-all' }}>{l.descricao}</span> },
                            { key: 'ip', header: 'IP', render: (l) => l.ip ?? '—' },
                        ]}
                    />
                    <PaginationBar meta={lista.data?.meta} onPageChange={setPage} label="registros" />
                </Card>
            )}

            {detalhe && (
                <Dialog open width={640} title="Detalhe do registro" subtitle={`${detalhe.acao} · ${quando(detalhe.createdAt)}`} onClose={() => setDetalhe(null)} footer={<Button variant="secondary" onClick={() => setDetalhe(null)}>Fechar</Button>}>
                    <p><strong>{detalhe.userNome ?? 'Sistema'}</strong> <Muted>({detalhe.ip ?? 'sem IP'})</Muted></p>
                    <p>{detalhe.descricao}</p>
                    {detalhe.detalhe ? <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--c-surface-alt)', padding: 12, borderRadius: 10, maxHeight: 320, overflow: 'auto' }}>{JSON.stringify(detalhe.detalhe, null, 2)}</pre> : <Muted>Sem dados adicionais.</Muted>}
                </Dialog>
            )}
        </Page>
    );
}
