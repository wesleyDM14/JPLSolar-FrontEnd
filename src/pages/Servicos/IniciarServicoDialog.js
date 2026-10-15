import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { equipesApi, modelosServicoApi, servicosApi } from '../../api/resources';
import { Button, Dialog, Field, Input, LoadingBlock, Muted, Select, Textarea } from '../../ui';
import { rotuloTipoEtapa } from './formato';

/**
 * "Iniciar serviço" a partir de um contrato: escolhe o modelo, a equipe e o responsável. O sistema cria
 * o serviço com as tarefas (visita técnica, materiais, instalação, conferência…) já atribuídas.
 */
export default function IniciarServicoDialog({ contrato, onClose }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const modelos = useQuery({ queryKey: ['modelos-servico', 'ativos'], queryFn: () => modelosServicoApi.listar(true) });
    const equipes = useQuery({ queryKey: ['equipes'], queryFn: equipesApi.listar });
    const pessoas = useQuery({ queryKey: ['servicos', 'pessoas'], queryFn: servicosApi.pessoas });

    const [modeloId, setModeloId] = useState('');
    const [equipeId, setEquipeId] = useState('');
    const [responsavelId, setResponsavelId] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const listaModelos = modelos.data ?? [];
    const sugerido = listaModelos.find((m) => m.tipoContrato === contrato.tipo) ?? listaModelos.find((m) => m.padrao) ?? listaModelos[0];
    const escolhido = listaModelos.find((m) => m.id === (modeloId || sugerido?.id));

    const iniciar = useMutation({
        mutationFn: (forcar) =>
            servicosApi.iniciarDoContrato(contrato.id, {
                modeloId: escolhido?.id,
                equipeId: equipeId || undefined,
                responsavelId: responsavelId || undefined,
                dataInicio: dataInicio || undefined,
                observacoes: observacoes || undefined,
                forcar,
            }),
        onSuccess: async (servico) => {
            await queryClient.invalidateQueries({ queryKey: ['servicos'] });
            toast.success('Serviço iniciado. As tarefas já estão atribuídas.');
            onClose();
            navigate(`/servicos/${servico.id}`);
        },
        onError: (erro) => {
            if (erro?.response?.status === 409 && erro.response.data?.details?.servicoId) {
                toast(errorMessage(erro), { duration: 6000 });
                return;
            }
            toast.error(errorMessage(erro));
        },
    });

    return (
        <Dialog
            open
            width={620}
            title="Iniciar serviço"
            subtitle="Cria as tarefas do contrato a partir de um modelo e já atribui equipe e responsável."
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button loading={iniciar.isPending} disabled={!escolhido} onClick={() => iniciar.mutate(false)}>Iniciar serviço</Button>
                </>
            }
        >
            {modelos.isLoading ? (
                <LoadingBlock />
            ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                    <Field label="Modelo de serviço">
                        <Select value={escolhido?.id ?? ''} onChange={(e) => setModeloId(e.target.value)}>
                            {listaModelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </Select>
                    </Field>
                    {escolhido && (
                        <Muted>
                            Etapas: {escolhido.etapas.map((e) => `${e.nome} (${rotuloTipoEtapa(e.tipo).toLowerCase()})`).join(' → ')}
                        </Muted>
                    )}
                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        <Field label="Equipe">
                            <Select value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
                                <option value="">Definir depois</option>
                                {(equipes.data ?? []).filter((e) => e.ativa).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                            </Select>
                        </Field>
                        <Field label="Responsável pela execução">
                            <Select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
                                <option value="">Definir depois</option>
                                {(pessoas.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name ?? p.login}{p.papel === 'ADMIN' ? ' (admin)' : ''}</option>)}
                            </Select>
                        </Field>
                        <Field label="Início previsto">
                            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                        </Field>
                    </div>
                    <Field label="Observações">
                        <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
                    </Field>
                    {iniciar.error?.response?.status === 409 && iniciar.error.response.data?.details?.servicoId && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Button size="sm" variant="secondary" onClick={() => { onClose(); navigate(`/servicos/${iniciar.error.response.data.details.servicoId}`); }}>
                                Abrir o serviço existente
                            </Button>
                            <Button size="sm" variant="secondary" loading={iniciar.isPending} onClick={() => iniciar.mutate(true)}>
                                Iniciar outro mesmo assim
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    );
}
