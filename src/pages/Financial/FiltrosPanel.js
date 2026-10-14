import { useState } from 'react';
import styled from 'styled-components';
import { clientesApi, financeiroApi } from '../../api/resources';
import { Button, Combobox, FilterInput, FilterSelect, tokens } from '../../ui';
import { dataBr, fimDoMes, hojeIso, inicioDoMes, somarDias } from '../../utils/datas';
import { formatDocumento } from '../../utils/masks';
import { formaOptions, situacaoOptions, TIPO } from './format';
import SeletorPeriodo from './SeletorPeriodo';

const { colors } = tokens;

const FILTROS_BASE = {
    search: '',
    situacao: '',
    boleto: '',
    categoriaId: '',
    contaId: '',
    clienteId: '',
    clienteNome: '',
    fornecedorId: '',
    fornecedorNome: '',
    contratoId: '',
    forma: '',
    vencimentoDe: '',
    vencimentoAte: '',
    emissaoDe: '',
    emissaoAte: '',
    pagamentoDe: '',
    pagamentoAte: '',
    valorMin: '',
    valorMax: '',
};

/** Filtros ao abrir a tela (e ao limpar): vencimentos do mês corrente, no horário de Brasília. */
export const filtrosPadrao = () => ({ ...FILTROS_BASE, vencimentoDe: inicioDoMes(hojeIso()), vencimentoAte: fimDoMes(hojeIso()) });

/** Sem período: usado quando a tela abre por um link já filtrado (cliente, contrato…). */
export const filtrosSemPeriodo = () => ({ ...FILTROS_BASE });

// Campo de data a que o período se aplica.
const CAMPOS_DE_DATA = {
    vencimento: { de: 'vencimentoDe', ate: 'vencimentoAte', rotulo: 'Vencimento' },
    pagamento: { de: 'pagamentoDe', ate: 'pagamentoAte', rotulo: 'Pagamento' },
    emissao: { de: 'emissaoDe', ate: 'emissaoAte', rotulo: 'Emissão' },
};

// Atalhos de um clique. Cada um redefine só os campos que lhe interessam.
function atalhos(tipo) {
    const hoje = hojeIso();
    const lista = [
        { id: 'pendentes', label: 'Pendentes', aplica: { situacao: 'PENDENTE' } },
        { id: 'vencidos', label: 'Vencidos', tom: 'danger', aplica: { situacao: 'ATRASADO', vencimentoDe: '', vencimentoAte: '' } },
        { id: 'hoje', label: 'Vencem hoje', aplica: { situacao: 'PENDENTE', vencimentoDe: hoje, vencimentoAte: hoje } },
        { id: 'semana', label: 'Próximos 7 dias', aplica: { situacao: 'PENDENTE', vencimentoDe: hoje, vencimentoAte: somarDias(hoje, 7) } },
    ];

    if (tipo === TIPO.RECEBER) {
        lista.push(
            { id: 'boletos', label: 'Boletos em aberto', tom: 'info', aplica: { boleto: 'EM_ABERTO', situacao: '', vencimentoDe: '', vencimentoAte: '' } },
            { id: 'semboleto', label: 'Sem boleto', aplica: { boleto: 'SEM_BOLETO', situacao: '' } },
        );
    }

    lista.push({ id: 'quitados', label: tipo === TIPO.RECEBER ? 'Recebidos' : 'Pagos', tom: 'success', aplica: { situacao: 'PAGO' } });
    return lista;
}

// Campos que cada atalho controla (para limpar os demais ao trocar de atalho).
const CAMPOS_DE_ATALHO = ['situacao', 'boleto'];

const Barra = styled.section`
    background: ${colors.surface};
    border-radius: 14px;
    box-shadow: ${tokens.shadow};
    padding: 14px 16px;
    margin-bottom: 14px;
`;

const Linha = styled.div`
    display: flex;
    gap: 10px;
    align-items: flex-end;
    flex-wrap: wrap;

    > .busca {
        flex: 1 1 280px;
        min-width: 0;
    }
`;

const Periodo = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
    margin-top: 12px;

    > :first-child {
        width: 150px;
    }
`;

const Chips = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
`;

const Chip = styled.button`
    padding: 6px 13px;
    border-radius: 999px;
    border: 1px solid ${({ $ativo, $cor }) => ($ativo ? $cor : colors.border)};
    background: ${({ $ativo, $cor }) => ($ativo ? $cor : colors.surface)};
    color: ${({ $ativo }) => ($ativo ? '#fff' : colors.text)};
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover {
        border-color: ${({ $cor }) => $cor};
    }
`;

const Avancado = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
    align-items: end;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px dashed ${colors.border};
`;

const Pilulas = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
`;

const Pilula = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 4px 3px 10px;
    border-radius: 999px;
    background: ${colors.infoBg};
    color: ${colors.info};
    font-size: 0.78rem;
    font-weight: 600;

    button {
        width: 18px;
        height: 18px;
        border: 0;
        border-radius: 50%;
        background: rgba(21, 101, 192, 0.15);
        color: inherit;
        font-size: 13px;
        line-height: 1;
        cursor: pointer;

        &:hover {
            background: rgba(21, 101, 192, 0.3);
        }
    }
`;

const TONS = { danger: colors.danger, info: colors.info, success: colors.success, neutral: colors.primary };

/** Descrição legível dos filtros ativos (exceto situação padrão), com o campo que cada "x" limpa. */
function pilulas(filtros, tipo) {
    const lista = [];
    const add = (campos, texto) => lista.push({ campos: Array.isArray(campos) ? campos : [campos], texto });

    if (filtros.situacao && filtros.situacao !== 'PENDENTE') {
        add('situacao', `Situação: ${situacaoOptions(tipo).find((o) => o.value === filtros.situacao)?.label ?? filtros.situacao}`);
    }
    if (filtros.boleto) {
        add('boleto', { EMITIDO: 'Com boleto', EM_ABERTO: 'Boleto em aberto', PAGO: 'Boleto pago', SEM_BOLETO: 'Sem boleto' }[filtros.boleto]);
    }
    if (filtros.clienteId) add(['clienteId', 'clienteNome'], `Cliente: ${filtros.clienteNome || 'selecionado'}`);
    if (filtros.fornecedorId) add(['fornecedorId', 'fornecedorNome'], `Fornecedor: ${filtros.fornecedorNome || 'selecionado'}`);
    if (filtros.contratoId) add('contratoId', 'Contrato selecionado');
    if (filtros.forma) add('forma', `Forma: ${formaOptions.find((o) => o.value === filtros.forma)?.label ?? filtros.forma}`);
    if (filtros.vencimentoDe || filtros.vencimentoAte) {
        add(['vencimentoDe', 'vencimentoAte'], `Vence ${filtros.vencimentoDe ? `de ${dataBr(filtros.vencimentoDe)}` : ''} ${filtros.vencimentoAte ? `até ${dataBr(filtros.vencimentoAte)}` : ''}`.trim());
    }
    if (filtros.emissaoDe || filtros.emissaoAte) {
        add(['emissaoDe', 'emissaoAte'], `Emitido ${filtros.emissaoDe ? `de ${dataBr(filtros.emissaoDe)}` : ''} ${filtros.emissaoAte ? `até ${dataBr(filtros.emissaoAte)}` : ''}`.trim());
    }
    if (filtros.pagamentoDe || filtros.pagamentoAte) {
        add(['pagamentoDe', 'pagamentoAte'], `Pago ${filtros.pagamentoDe ? `de ${dataBr(filtros.pagamentoDe)}` : ''} ${filtros.pagamentoAte ? `até ${dataBr(filtros.pagamentoAte)}` : ''}`.trim());
    }
    if (filtros.valorMin !== '' || filtros.valorMax !== '') {
        add(['valorMin', 'valorMax'], `Valor ${filtros.valorMin !== '' ? `≥ ${filtros.valorMin}` : ''} ${filtros.valorMax !== '' ? `≤ ${filtros.valorMax}` : ''}`.trim());
    }

    return lista;
}

/** Barra de busca + atalhos + painel de filtros avançados + filtros ativos. */
export default function FiltrosPanel({ tipo, filtros, onChange, categorias, contas, onLimpar }) {
    const receber = tipo === TIPO.RECEBER;
    const [aberto, setAberto] = useState(false);

    const set = (nome) => (evento) => onChange({ [nome]: evento.target.value });
    const lista = atalhos(tipo);

    // Atalho mais específico que combine com os filtros atuais.
    const atalhoAtivo = lista
        .filter((atalho) =>
            Object.entries(atalho.aplica).every(([campo, valor]) => filtros[campo] === valor)
            && CAMPOS_DE_ATALHO.every((campo) => campo in atalho.aplica || !filtros[campo]),
        )
        .sort((a, b) => Object.keys(b.aplica).length - Object.keys(a.aplica).length)[0];

    const aplicarAtalho = (atalho) => {
        const limpo = Object.fromEntries(CAMPOS_DE_ATALHO.map((campo) => [campo, '']));
        onChange({ ...limpo, ...atalho.aplica });
    };

    // O período vale para o vencimento, o pagamento ou a emissão (o primeiro que estiver preenchido).
    const campoData = ['pagamento', 'emissao'].find((id) => !filtros.vencimentoDe && !filtros.vencimentoAte && (filtros[CAMPOS_DE_DATA[id].de] || filtros[CAMPOS_DE_DATA[id].ate])) ?? 'vencimento';
    const chavesData = CAMPOS_DE_DATA[campoData];

    const trocarCampoData = (novo) => {
        const atual = CAMPOS_DE_DATA[campoData];
        const destino = CAMPOS_DE_DATA[novo];
        onChange({ [atual.de]: '', [atual.ate]: '', [destino.de]: filtros[atual.de], [destino.ate]: filtros[atual.ate] });
    };

    // O período escolhido já aparece no seletor; as demais restrições viram etiquetas removíveis.
    const ativos = pilulas(filtros, tipo).filter((p) => !p.campos.includes(chavesData.de));
    const avancadosAtivos = ativos.filter((p) => !p.campos.some((c) => ['situacao', 'boleto'].includes(c))).length;

    const buscarClientes = async (termo) => {
        const resultado = await clientesApi.options(termo);
        return resultado.map((c) => ({ value: c.id, label: c.nome, hint: c.documento ? formatDocumento(c.documento) : undefined }));
    };
    const buscarFornecedores = async (termo) => {
        const resultado = await financeiroApi.fornecedores({ search: termo, ativos: 'true' });
        return resultado.map((f) => ({ value: f.id, label: f.nome, hint: f.documento ? formatDocumento(f.documento) : undefined }));
    };

    return (
        <Barra>
            <Linha>
                <div className="busca">
                    <FilterInput
                        label={receber ? 'Buscar por nome do cliente, descrição ou nº do documento' : 'Buscar por nome do fornecedor, descrição ou nº do documento'}
                        placeholder={receber ? 'Digite o nome do cliente…' : 'Digite o nome do fornecedor…'}
                        value={filtros.search}
                        onChange={set('search')}
                    />
                </div>
                <Button variant={aberto ? 'primary' : 'secondary'} onClick={() => setAberto((valor) => !valor)}>
                    Filtros avançados{avancadosAtivos > 0 ? ` (${avancadosAtivos})` : ''}
                </Button>
                <Button variant="ghost" onClick={onLimpar}>Limpar</Button>
            </Linha>

            <Periodo>
                <FilterSelect
                    label="Filtrar por"
                    placeholder={null}
                    value={campoData}
                    onChange={(evento) => trocarCampoData(evento.target.value)}
                    options={Object.entries(CAMPOS_DE_DATA).map(([id, item]) => ({ value: id, label: receber && id === 'pagamento' ? 'Recebimento' : item.rotulo }))}
                />
                <SeletorPeriodo
                    de={filtros[chavesData.de]}
                    ate={filtros[chavesData.ate]}
                    onChange={({ de, ate }) => onChange({ [chavesData.de]: de, [chavesData.ate]: ate })}
                />
            </Periodo>

            <Chips>
                {lista.map((atalho) => (
                    <Chip
                        key={atalho.id}
                        type="button"
                        $ativo={atalhoAtivo?.id === atalho.id}
                        $cor={TONS[atalho.tom ?? 'neutral']}
                        onClick={() => aplicarAtalho(atalho)}
                    >
                        {atalho.label}
                    </Chip>
                ))}
            </Chips>

            {aberto && (
                <Avancado>
                    <FilterSelect label="Situação" options={situacaoOptions(tipo)} placeholder="Todas (exceto canceladas)" value={filtros.situacao} onChange={set('situacao')} />
                    {receber && (
                        <FilterSelect
                            label="Boleto"
                            placeholder="Qualquer"
                            value={filtros.boleto}
                            onChange={set('boleto')}
                            options={[
                                { value: 'EM_ABERTO', label: 'Boleto emitido e em aberto' },
                                { value: 'EMITIDO', label: 'Com boleto emitido' },
                                { value: 'PAGO', label: 'Boleto pago' },
                                { value: 'SEM_BOLETO', label: 'Sem boleto (em aberto)' },
                            ]}
                        />
                    )}
                    {receber ? (
                        <Combobox
                            label="Cliente"
                            placeholder="Buscar por nome ou CPF/CNPJ"
                            queryKey="clientes"
                            fetcher={buscarClientes}
                            selected={filtros.clienteId ? { value: filtros.clienteId, label: filtros.clienteNome || 'Cliente selecionado' } : null}
                            onChange={(id, opcao) => onChange({ clienteId: id, clienteNome: opcao?.label ?? '' })}
                        />
                    ) : (
                        <Combobox
                            label="Fornecedor"
                            placeholder="Buscar fornecedor"
                            queryKey="fornecedores"
                            fetcher={buscarFornecedores}
                            selected={filtros.fornecedorId ? { value: filtros.fornecedorId, label: filtros.fornecedorNome || 'Fornecedor selecionado' } : null}
                            onChange={(id, opcao) => onChange({ fornecedorId: id, fornecedorNome: opcao?.label ?? '' })}
                        />
                    )}
                    <FilterSelect label="Categoria" options={categorias} value={filtros.categoriaId} onChange={set('categoriaId')} />
                    <FilterSelect label="Conta" options={contas} value={filtros.contaId} onChange={set('contaId')} />
                    <FilterSelect label={receber ? 'Forma de recebimento' : 'Forma de pagamento'} options={formaOptions} placeholder="Qualquer" value={filtros.forma} onChange={set('forma')} />
                    <FilterInput label="Vence de" type="date" value={filtros.vencimentoDe} onChange={set('vencimentoDe')} />
                    <FilterInput label="Vence até" type="date" value={filtros.vencimentoAte} onChange={set('vencimentoAte')} />
                    <FilterInput label="Emitido de" type="date" value={filtros.emissaoDe} onChange={set('emissaoDe')} />
                    <FilterInput label="Emitido até" type="date" value={filtros.emissaoAte} onChange={set('emissaoAte')} />
                    <FilterInput label={receber ? 'Recebido de' : 'Pago de'} type="date" value={filtros.pagamentoDe} onChange={set('pagamentoDe')} />
                    <FilterInput label={receber ? 'Recebido até' : 'Pago até'} type="date" value={filtros.pagamentoAte} onChange={set('pagamentoAte')} />
                    <FilterInput label="Valor mínimo (R$)" type="number" min="0" step="0.01" value={filtros.valorMin} onChange={set('valorMin')} />
                    <FilterInput label="Valor máximo (R$)" type="number" min="0" step="0.01" value={filtros.valorMax} onChange={set('valorMax')} />
                </Avancado>
            )}

            {ativos.length > 0 && (
                <Pilulas>
                    {ativos.map((pilula) => (
                        <Pilula key={pilula.campos.join('+')}>
                            {pilula.texto}
                            <button
                                type="button"
                                aria-label={`Remover filtro: ${pilula.texto}`}
                                onClick={() => onChange(Object.fromEntries(pilula.campos.map((campo) => [campo, ''])))}
                            >
                                ×
                            </button>
                        </Pilula>
                    ))}
                </Pilulas>
            )}
        </Barra>
    );
}

