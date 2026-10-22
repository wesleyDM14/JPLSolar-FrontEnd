import { useQuery } from '@tanstack/react-query';
import { useField } from 'formik';
import { useState } from 'react';
import { clientesApi, financeiroApi } from '../api/resources';
import { Combobox } from '../ui';
import { formatDocumento } from '../utils/masks';
import CadastroRapidoDialog from './CadastroRapidoDialog';

const BUSCAS = {
    cliente: {
        rotulo: 'Cliente',
        dica: 'Digite o nome ou o CPF/CNPJ do cliente',
        chave: 'clientes',
        buscar: async (termo) => (await clientesApi.options(termo)).map((c) => ({ value: c.id, label: c.nome, hint: c.documento ? formatDocumento(c.documento) : undefined })),
        obter: async (id) => clientesApi.get(id),
    },
    fornecedor: {
        rotulo: 'Fornecedor',
        dica: 'Digite o nome do fornecedor',
        chave: 'fornecedores',
        buscar: async (termo) => (await financeiroApi.fornecedores({ search: termo, ativos: 'true' })).map((f) => ({ value: f.id, label: f.nome, hint: f.documento ? formatDocumento(f.documento) : undefined })),
        obter: async (id) => (await financeiroApi.fornecedores({ ativos: '' })).find((f) => f.id === id),
    },
};

/**
 * Campo de cliente ou fornecedor com busca por digitação (ligado ao Formik): o usuário digita parte do nome
 * ou do documento e escolhe na lista. `selecionadoInicial` evita uma consulta quando o nome já é conhecido.
 */
export default function ParteField({ name, parte = 'cliente', label, required, disabled, selecionadoInicial, onSelect, hint, permitirCadastro = false }) {
    const config = BUSCAS[parte];
    const [field, meta, helpers] = useField(name);
    // Cadastro rápido: o item recém-criado fica guardado aqui para aparecer na hora, sem nova consulta.
    const [cadastro, setCadastro] = useState({ aberto: false, nome: '' });
    const [criado, setCriado] = useState(null);

    // Nome do item já escolhido (edição ou preset), sem depender da busca por digitação.
    const atual = useQuery({
        queryKey: ['parte', parte, field.value],
        queryFn: () => config.obter(field.value),
        enabled: Boolean(field.value) && !(selecionadoInicial && selecionadoInicial.id === field.value) && criado?.id !== field.value,
        staleTime: 5 * 60 * 1000,
    });

    const base = criado?.id === field.value ? criado : selecionadoInicial?.id === field.value ? selecionadoInicial : atual.data;
    const selecionado = field.value && base ? { value: field.value, label: base.nome } : null;

    return (
        <>
        <Combobox
            label={label ?? config.rotulo}
            placeholder={config.dica}
            queryKey={config.chave}
            fetcher={config.buscar}
            selected={selecionado}
            required={required}
            disabled={disabled}
            hint={hint}
            error={meta.touched && meta.error ? meta.error : undefined}
            cadastrar={
                permitirCadastro && !disabled
                    ? { rotulo: parte === 'cliente' ? 'Cadastrar novo cliente' : 'Cadastrar novo fornecedor', onClick: (nome) => setCadastro({ aberto: true, nome }) }
                    : undefined
            }
            onChange={(id, opcao) => {
                helpers.setValue(id || '');
                helpers.setTouched(true, false);
                onSelect?.(id || '', opcao);
            }}
        />
        {permitirCadastro && (
            <CadastroRapidoDialog
                open={cadastro.aberto}
                parte={parte}
                nomeInicial={cadastro.nome}
                onClose={() => setCadastro({ aberto: false, nome: '' })}
                onCriado={(novo) => {
                    setCriado(novo);
                    helpers.setValue(novo.id);
                    helpers.setTouched(true, false);
                    onSelect?.(novo.id, { value: novo.id, label: novo.nome });
                    setCadastro({ aberto: false, nome: '' });
                }}
            />
        )}
        </>
    );
}
