import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaCloudUploadAlt, FaFileAlt, FaPlay, FaRegCircle, FaTrashAlt } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { execucaoApi } from '../../api/resources';
import VisualizadorDeImagens from '../../components/VisualizadorDeImagens';
import { Badge, Button, Dialog, ErrorBlock, Field, Input, LoadingBlock, Muted, Textarea, tokens } from '../../ui';
import { acaoDoAnexo, urlDoAnexo } from '../../utils/anexos';
import { STATUS_ETAPA } from './formato';

const { colors } = tokens;

const TAMANHO_MAXIMO = 15 * 1024 * 1024;
const ACEITA_ARQUIVOS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,image/*';

const formatarTamanho = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const Bloco = styled.section`
    padding: 14px 16px;
    margin-bottom: 12px;
    border: 1px solid ${colors.border};
    border-radius: 12px;
    background: ${colors.surface};

    h3 {
        margin: 0;
        font-size: 0.98rem;
        color: ${colors.text};
    }

    .instrucao {
        margin: 2px 0 10px;
        color: ${colors.muted};
        font-size: 0.85rem;
    }
`;

const Zona = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
    padding: 14px;
    border: 2px dashed ${({ $ativa }) => ($ativa ? colors.primary : colors.border)};
    border-radius: 12px;
    background: ${({ $ativa }) => ($ativa ? colors.neutralBg : 'transparent')};
    color: ${colors.muted};
    font-size: 0.9rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;

    &:hover {
        border-color: ${colors.primary};
    }

    svg {
        flex: none;
        font-size: 20px;
    }
`;

const Miniaturas = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
`;

const Anexo = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 104px;
    font-size: 0.75rem;
    color: ${colors.muted};

    img,
    .arquivo {
        width: 104px;
        height: 104px;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid ${colors.border};
    }

    .arquivo {
        display: grid;
        place-items: center;
        background: ${colors.neutralBg};
        font-size: 28px;
    }

    .nome {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    button {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.62);
        color: #fff;
        font-size: 12px;
        cursor: pointer;
    }
`;

/** Área para soltar ou escolher fotos/arquivos; envia um por vez e mostra o andamento. */
function AreaDeEnvio({ aceita, rotulo, enviar }) {
    const entrada = useRef(null);
    const [arrastando, setArrastando] = useState(false);
    const [andamento, setAndamento] = useState(null); // { atual, total }

    const receber = async (lista) => {
        const arquivos = Array.from(lista ?? []);
        if (arquivos.length === 0) return;

        for (const [indice, arquivo] of arquivos.entries()) {
            if (arquivo.size > TAMANHO_MAXIMO) {
                toast.error(`“${arquivo.name}” passa de 15 MB e não foi enviado.`);
                continue;
            }
            setAndamento({ atual: indice + 1, total: arquivos.length });
            try {
                await enviar(arquivo);
            } catch (erro) {
                toast.error(`${arquivo.name}: ${errorMessage(erro, 'não foi possível enviar.')}`);
            }
        }
        setAndamento(null);
    };

    return (
        <>
            <Zona
                $ativa={arrastando}
                onClick={() => !andamento && entrada.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setArrastando(true);
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setArrastando(false);
                    receber(e.dataTransfer.files);
                }}
            >
                <FaCloudUploadAlt />
                <span>{andamento ? `Enviando ${andamento.atual} de ${andamento.total}…` : rotulo}</span>
            </Zona>
            <input
                ref={entrada}
                type="file"
                hidden
                multiple
                accept={aceita}
                onChange={(e) => {
                    receber(e.target.files);
                    e.target.value = '';
                }}
            />
        </>
    );
}

function ListaDeAnexos({ anexos, onRemover, podeRemover }) {
    const [visualizando, setVisualizando] = useState(null);
    if (anexos.length === 0) return null;
    const fotos = anexos.filter((a) => acaoDoAnexo(a) === 'visualizar');

    return (
        <Miniaturas>
            {anexos.map((a) => (
                <Anexo key={a.id}>
                    {acaoDoAnexo(a) === 'visualizar' ? (
                        // Foto: miniatura leve; clicar abre grande no visualizador (sem baixar).
                        <button type="button" title={`Abrir ${a.nomeArquivo}`} onClick={() => setVisualizando(fotos.indexOf(a))} style={{ padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in' }}>
                            <img src={urlDoAnexo(a, 'mini')} alt={a.nomeArquivo} loading="lazy" />
                        </button>
                    ) : (
                        <a href={acaoDoAnexo(a) === 'abrir' ? urlDoAnexo(a) : urlDoAnexo(a, 'baixar')} target={acaoDoAnexo(a) === 'abrir' ? '_blank' : undefined} rel="noreferrer" title={a.nomeArquivo}>
                            <div className="arquivo"><FaFileAlt /></div>
                        </a>
                    )}
                    <span className="nome" title={a.nomeArquivo}>{a.nomeArquivo}</span>
                    <span>{formatarTamanho(a.tamanho)}</span>
                    {podeRemover && (
                        <button type="button" title="Remover" aria-label={`Remover ${a.nomeArquivo}`} onClick={() => onRemover(a)}>
                            <FaTrashAlt />
                        </button>
                    )}
                </Anexo>
            ))}
            {visualizando !== null && <VisualizadorDeImagens imagens={fotos} indiceInicial={visualizando} onFechar={() => setVisualizando(null)} />}
        </Miniaturas>
    );
}

/** Um item do checklist: texto, número, sim/não, foto ou arquivo. Salva ao sair do campo (texto e número) ou ao clicar. */
function ItemDoChecklist({ item, anexos, aberta, salvar, enviar, remover }) {
    const [texto, setTexto] = useState(item.valorTexto ?? '');
    const [numero, setNumero] = useState(item.valorNumero ?? '');
    const foto = item.tipo === 'FOTO';

    return (
        <Bloco>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {item.completo ? <FaCheckCircle color="var(--c-success)" /> : <FaRegCircle color="var(--c-muted)" />}
                <h3>{item.titulo}</h3>
                {!item.obrigatorio && <Muted>(opcional)</Muted>}
                {(foto || item.tipo === 'ARQUIVO') && item.obrigatorio && (
                    <Muted>
                        {anexos.length} de {foto ? item.minimoFotos : 1} {foto ? 'foto(s)' : 'arquivo'}
                    </Muted>
                )}
            </div>
            {item.instrucao && <p className="instrucao">{item.instrucao}</p>}

            {item.tipo === 'TEXTO' && (
                <Textarea
                    rows={2}
                    disabled={!aberta}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onBlur={() => texto !== (item.valorTexto ?? '') && salvar(item, { valorTexto: texto })}
                />
            )}

            {item.tipo === 'NUMERO' && (
                <Input
                    type="number"
                    step="any"
                    disabled={!aberta}
                    style={{ maxWidth: 220 }}
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    onBlur={() => String(numero) !== String(item.valorNumero ?? '') && salvar(item, { valorNumero: numero === '' ? null : Number(numero) })}
                />
            )}

            {item.tipo === 'SIM_NAO' && (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant={item.valorBool === true ? 'primary' : 'secondary'} disabled={!aberta} onClick={() => salvar(item, { valorBool: item.valorBool === true ? null : true })}>Sim</Button>
                    <Button size="sm" variant={item.valorBool === false ? 'primary' : 'secondary'} disabled={!aberta} onClick={() => salvar(item, { valorBool: item.valorBool === false ? null : false })}>Não</Button>
                </div>
            )}

            {(foto || item.tipo === 'ARQUIVO') && (
                <>
                    <ListaDeAnexos anexos={anexos} onRemover={remover} podeRemover={aberta} />
                    {aberta && (
                        <AreaDeEnvio
                            aceita={foto ? 'image/*' : ACEITA_ARQUIVOS}
                            rotulo={foto ? 'Arraste fotos aqui ou clique para escolher' : 'Arraste o arquivo aqui ou clique para escolher'}
                            enviar={(arquivo) => enviar(arquivo, item.id)}
                        />
                    )}
                </>
            )}
        </Bloco>
    );
}

/**
 * Preenchimento da tarefa de campo pelo computador: o mesmo formulário do aplicativo dos instaladores (checklist,
 * fotos e arquivos), para quando quem executa é o escritório ou quando é preciso completar o que o campo enviou.
 */
export default function PreencherEtapaDialog({ etapaId, onClose, onAlterou }) {
    const queryClient = useQueryClient();
    const chave = ['execucao', etapaId];
    const consulta = useQuery({ queryKey: chave, queryFn: () => execucaoApi.etapa(etapaId) });
    const etapa = consulta.data;
    const [observacoes, setObservacoes] = useState(null);
    const [ocupado, setOcupado] = useState(false);

    // Cada ação devolve a tarefa já atualizada: guarda no cache e avisa a tela do serviço para recarregar.
    const aplicar = (dto) => {
        queryClient.setQueryData(chave, dto);
        onAlterou?.();
        return dto;
    };

    const executar = async (acao, mensagemErro) => {
        setOcupado(true);
        try {
            return aplicar(await acao());
        } catch (erro) {
            toast.error(errorMessage(erro, mensagemErro));
            return null;
        } finally {
            setOcupado(false);
        }
    };

    const aberta = etapa && !['CONCLUIDA', 'CANCELADA'].includes(etapa.status);
    const textoObservacoes = observacoes ?? etapa?.observacoes ?? '';
    const anexosDoItem = (itemId) => etapa.anexos.filter((a) => a.itemId === itemId);
    const anexosSoltos = etapa ? etapa.anexos.filter((a) => !a.itemId) : [];

    const salvarItem = (item, valor) => executar(() => execucaoApi.salvarItem(etapaId, item.id, valor), 'Não foi possível salvar o item.');
    const enviar = async (arquivo, itemId) => aplicar(await execucaoApi.anexar(etapaId, arquivo, { itemId }));
    const remover = (anexo) => executar(() => execucaoApi.removerAnexo(anexo.id), 'Não foi possível remover.');

    const concluir = async () => {
        const feito = await executar(() => execucaoApi.concluir(etapaId, textoObservacoes), 'Não foi possível concluir.');
        if (feito) {
            toast.success('Tarefa concluída.');
            onClose();
        }
    };

    return (
        <Dialog
            open
            width={760}
            title={etapa ? `Preencher: ${etapa.nome}` : 'Preencher tarefa'}
            subtitle={etapa ? `${etapa.servico.titulo}${etapa.cliente ? ` · ${etapa.cliente.nome}` : ''}` : undefined}
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Fechar</Button>
                    {aberta && etapa.status !== 'EM_ANDAMENTO' && (
                        <Button variant="secondary" icon={<FaPlay />} loading={ocupado} onClick={() => executar(() => execucaoApi.iniciar(etapaId), 'Não foi possível iniciar.')}>
                            Iniciar tarefa
                        </Button>
                    )}
                    {aberta && <Button loading={ocupado} onClick={concluir}>Concluir tarefa</Button>}
                </>
            }
        >
            {consulta.isLoading && <LoadingBlock label="Abrindo a tarefa…" />}
            {consulta.error && <ErrorBlock message={errorMessage(consulta.error)} onRetry={consulta.refetch} />}

            {etapa && (
                <>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                        <Badge $tone={STATUS_ETAPA[etapa.status]?.tom}>{STATUS_ETAPA[etapa.status]?.rotulo}</Badge>
                        {etapa.endereco && <Muted>{etapa.endereco.texto}</Muted>}
                        {!aberta && <Muted>Esta tarefa está encerrada. Para alterar, reabra no serviço.</Muted>}
                    </div>

                    {etapa.descricao && <p style={{ marginTop: 0, color: 'var(--c-muted)' }}>{etapa.descricao}</p>}

                    {etapa.itens.length === 0 && <Muted>Esta tarefa não tem checklist. Use as fotos e arquivos abaixo.</Muted>}

                    {etapa.itens.map((item) => (
                        <ItemDoChecklist key={`${item.id}-${item.valorTexto ?? ''}-${item.valorNumero ?? ''}`} item={item} anexos={anexosDoItem(item.id)} aberta={aberta} salvar={salvarItem} enviar={enviar} remover={remover} />
                    ))}

                    <Bloco>
                        <h3>Outras fotos e arquivos da tarefa</h3>
                        <p className="instrucao">Fotos, relatórios, planilhas, documentos (PDF, Word, Excel, ZIP, TXT, CSV) até 15 MB cada.</p>
                        <ListaDeAnexos anexos={anexosSoltos} onRemover={remover} podeRemover={aberta} />
                        {aberta && <AreaDeEnvio aceita={ACEITA_ARQUIVOS} rotulo="Arraste arquivos aqui ou clique para escolher" enviar={(arquivo) => enviar(arquivo, undefined)} />}
                    </Bloco>

                    <Field label="Observações da tarefa">
                        <Textarea rows={3} disabled={!aberta} value={textoObservacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="O que foi feito, o que ficou pendente…" />
                    </Field>
                </>
            )}
        </Dialog>
    );
}
