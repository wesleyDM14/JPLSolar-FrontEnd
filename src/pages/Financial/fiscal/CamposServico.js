import { useQuery } from '@tanstack/react-query';
import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import { fiscalApi } from '../../../api/resources';
import { Combobox, Muted, SelectField, TextField } from '../../../ui';

const semAcento = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const soDigitos = (texto) => String(texto ?? '').replace(/\D/g, '');
const ITEM_COMPLETO = /^\d{2}\.\d{2}$/;

/**
 * Campos do serviço da NFS-e com preenchimento automático (devem ficar dentro de um <Grid $cols={2}>):
 * escolher a atividade traz CNAE, item da lista, código de tributação, alíquota e retenção; escolher o CNAE
 * traz a atividade (ou ao menos o item sugerido); digitar o item da lista descobre o CNAE.
 * Campos do formulário: atividadeId, codigoCnae, itemListaServico, codigoTributacao, aliquotaIss, issRetido
 * ('true'|'false') e, opcionalmente, discriminacao.
 */
export default function CamposServico() {
    const { values, setFieldValue } = useFormikContext();

    const cnaesQuery = useQuery({ queryKey: ['fiscal', 'cnaes'], queryFn: fiscalApi.cnaes, staleTime: 60_000 });
    const atividadesQuery = useQuery({
        queryKey: ['fiscal', 'atividades', 'ativas'],
        queryFn: async () => (await fiscalApi.atividades({ ativo: 'true', pageSize: 100 })).data,
        staleTime: 60_000,
    });
    const cnaes = cnaesQuery.data ?? [];
    const atividades = atividadesQuery.data ?? [];

    const rotuloAtividade = (a) => `${a.itemListaServico} · ${a.descricao}`;
    const rotuloCnae = (c) => `${c.codigoFormatado} · ${c.descricao}`;

    const aplicarAtividade = (a, { manterCnae = false } = {}) => {
        setFieldValue('atividadeId', a.id);
        setFieldValue('itemListaServico', a.itemListaServico);
        if (!manterCnae || a.codigoCnae) setFieldValue('codigoCnae', a.codigoCnae ?? '');
        setFieldValue('codigoTributacao', a.codigoTributacao ?? '');
        setFieldValue('aliquotaIss', a.aliquotaIss ?? '');
        setFieldValue('issRetido', a.issRetido ? 'true' : 'false');
        if (a.discriminacaoModelo && 'discriminacao' in values && !String(values.discriminacao ?? '').trim()) {
            setFieldValue('discriminacao', a.discriminacaoModelo);
        }
    };

    const escolherAtividade = (id, opcao) => {
        if (!id || !opcao) {
            setFieldValue('atividadeId', '');
            return;
        }
        aplicarAtividade(opcao.dados);
    };

    const escolherCnae = (codigo) => {
        setFieldValue('codigoCnae', codigo || '');
        if (!codigo) return;

        const cnae = cnaes.find((c) => c.codigo === codigo);
        const doCnae = atividades.filter((a) => a.codigoCnae === codigo);
        // Prefere a atividade do item típico do CNAE; depois a padrão; depois a primeira.
        const alvo = doCnae.find((a) => a.itemListaServico === cnae?.itemListaSugerido)
            ?? doCnae.find((a) => a.padrao)
            ?? doCnae[0];

        if (alvo) {
            aplicarAtividade(alvo);
            return;
        }

        // Sem atividade cadastrada para este CNAE: ao menos sugere o item da lista.
        setFieldValue('atividadeId', '');
        if (cnae?.itemListaSugerido) setFieldValue('itemListaServico', cnae.itemListaSugerido);
    };

    // Digitou o item da lista (07.02): descobre atividade/CNAE correspondentes quando o CNAE ainda está vazio.
    useEffect(() => {
        const item = String(values.itemListaServico ?? '').trim();
        if (!ITEM_COMPLETO.test(item) || values.codigoCnae) return;

        const candidatas = atividades.filter((a) => a.itemListaServico === item && a.codigoCnae);
        const escolhida = candidatas.find((a) => a.padrao) ?? (candidatas.length === 1 ? candidatas[0] : null);
        if (escolhida) {
            aplicarAtividade(escolhida);
            return;
        }

        const doItem = cnaes.filter((c) => c.itemListaSugerido === item);
        if (doItem.length === 1) setFieldValue('codigoCnae', doItem[0].codigo);
        // Reage só à troca do item (ou ao fim do carregamento das listas).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.itemListaServico, atividades.length, cnaes.length]);

    // Mudou o item à mão para outro diferente da atividade escolhida: ela deixa de valer.
    useEffect(() => {
        const atual = atividades.find((a) => a.id === values.atividadeId);
        if (atual && values.itemListaServico && atual.itemListaServico !== values.itemListaServico) setFieldValue('atividadeId', '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.itemListaServico]);

    const buscarAtividades = async (termo) => {
        const t = semAcento(termo);
        const d = soDigitos(termo);
        return atividades
            .filter((a) => !t || semAcento(a.descricao).includes(t) || a.itemListaServico.includes(termo.trim()) || (d.length >= 3 && (a.codigoCnae ?? '').includes(d)))
            .map((a) => ({ value: a.id, label: rotuloAtividade(a), hint: a.padrao ? 'padrão' : a.cnae?.codigoFormatado, dados: a }));
    };

    const buscarCnaes = async (termo) => {
        const t = semAcento(termo);
        const d = soDigitos(termo);
        return cnaes
            .filter((c) => !t || semAcento(c.descricao).includes(t) || (d.length >= 2 && c.codigo.includes(d)))
            .map((c) => ({ value: c.codigo, label: rotuloCnae(c), hint: c.itemListaSugerido ? `item ${c.itemListaSugerido}` : undefined }));
    };

    const atividadeAtual = atividades.find((a) => a.id === values.atividadeId);
    const cnaeAtual = cnaes.find((c) => c.codigo === values.codigoCnae);

    return (
        <>
            <Combobox
                label="Atividade"
                placeholder="Digite o item (07.02) ou o nome"
                queryKey={`atividades-emissao-${atividades.length}`}
                fetcher={buscarAtividades}
                selected={atividadeAtual ? { value: atividadeAtual.id, label: rotuloAtividade(atividadeAtual) } : null}
                onChange={escolherAtividade}
            />
            <Combobox
                label="CNAE do serviço"
                placeholder="Digite o código ou o nome"
                queryKey={`cnaes-emissao-${cnaes.length}`}
                fetcher={buscarCnaes}
                selected={cnaeAtual ? { value: cnaeAtual.codigo, label: rotuloCnae(cnaeAtual) } : values.codigoCnae ? { value: values.codigoCnae, label: values.codigoCnae } : null}
                onChange={(codigo) => escolherCnae(codigo)}
            />
            <TextField name="itemListaServico" label="Item da lista de serviços" hint="Ex.: 07.02" required />
            <TextField name="codigoTributacao" label="Código de tributação municipal" />
            <TextField name="aliquotaIss" label="Alíquota de ISS (%)" type="number" step="0.01" min="0" />
            <div style={{ gridColumn: '1 / -1' }}>
                <Muted>
                    {atividadeAtual?.classificacaoTributaria
                        ? `IBS/CBS: classificação ${atividadeAtual.classificacaoTributaria} (CST ${atividadeAtual.ibsCbs?.cst ?? ''}) — ${atividadeAtual.ibsCbs?.classificacaoNome ?? ''} · operação ${atividadeAtual.indicadorOperacao}`
                        : 'IBS/CBS: classificação pelo item da lista (primeiro registro do Anexo VIII).'}
                </Muted>
            </div>
            <SelectField
                name="issRetido"
                label="ISS retido pelo tomador"
                placeholder={null}
                options={[{ value: 'false', label: 'Não' }, { value: 'true', label: 'Sim (o tomador recolhe)' }]}
            />
        </>
    );
}
