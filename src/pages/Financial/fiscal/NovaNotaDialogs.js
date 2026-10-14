import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaFileUpload } from 'react-icons/fa';
import * as Yup from 'yup';
import styled from 'styled-components';
import { errorMessage, fieldErrors } from '../../../api/client';
import { fiscalApi } from '../../../api/resources';
import { Badge, Button, DateField, Dialog, Grid, IconChip, Muted, SelectField, TextField, TextareaField, tokens } from '../../../ui';
import { hojeIso } from '../../../utils/datas';
import { direcaoOptions, tipoOptions } from './formato';

const { colors } = tokens;

const schemaNota = Yup.object({
    tipo: Yup.string().required('Escolha o tipo'),
    valorTotal: Yup.number().typeError('Informe o valor').min(0.01, 'Informe o valor da nota').required('Informe o valor'),
});

/** Cadastro manual de uma nota (por exemplo, emitida no portal da prefeitura). */
export function NovaNotaDialog({ open, onClose }) {
    const queryClient = useQueryClient();

    const salvar = useMutation({
        mutationFn: (payload) => fiscalApi.criarNota(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            toast.success('Nota cadastrada.');
            onClose();
        },
    });

    if (!open) return null;

    return (
        <Formik
            initialValues={{
                tipo: 'NFSE',
                direcao: 'SAIDA',
                numero: '',
                serie: '',
                dataEmissao: hojeIso(),
                parteNome: '',
                parteDocumento: '',
                valorTotal: '',
                valorIss: '',
                descricao: '',
            }}
            validationSchema={schemaNota}
            onSubmit={async (values, { setErrors }) => {
                const valor = Number(values.valorTotal);
                try {
                    await salvar.mutateAsync({
                        tipo: values.tipo,
                        direcao: values.direcao,
                        status: 'AUTORIZADA',
                        numero: values.numero || undefined,
                        serie: values.serie || undefined,
                        dataEmissao: values.dataEmissao || undefined,
                        parteNome: values.parteNome || undefined,
                        parteDocumento: values.parteDocumento || undefined,
                        descricao: values.descricao || undefined,
                        valorServicos: values.tipo === 'NFSE' ? valor : 0,
                        valorProdutos: values.tipo === 'NFSE' ? 0 : valor,
                        valorTotal: valor,
                        valorIss: Number(values.valorIss) || 0,
                    });
                } catch (erro) {
                    const campos = fieldErrors(erro);
                    if (Object.keys(campos).length > 0) setErrors(campos);
                    else toast.error(errorMessage(erro));
                }
            }}
        >
            {({ isSubmitting }) => (
                <Dialog
                    open
                    width={640}
                    title="Cadastrar nota fiscal"
                    subtitle="Para notas emitidas fora do sistema. Se tiver o XML, importe por ele."
                    onClose={onClose}
                    footer={
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="nota-form" loading={isSubmitting}>Salvar nota</Button>
                        </>
                    }
                >
                    <Form noValidate id="nota-form">
                        <Grid $cols={2}>
                            <SelectField name="tipo" label="Tipo de nota" options={tipoOptions} placeholder="Selecione" required />
                            <SelectField name="direcao" label="Sentido" options={direcaoOptions} placeholder="Selecione" />
                            <TextField name="numero" label="Número" />
                            <TextField name="serie" label="Série" />
                            <DateField name="dataEmissao" label="Data de emissão" />
                            <TextField name="valorTotal" label="Valor total (R$)" type="number" step="0.01" min="0" required />
                            <TextField name="parteNome" label="Cliente / fornecedor" />
                            <TextField name="parteDocumento" label="CPF ou CNPJ" />
                            <TextField name="valorIss" label="ISS (R$)" type="number" step="0.01" min="0" />
                            <span />
                        </Grid>
                        <TextareaField name="descricao" label="Discriminação dos serviços/produtos" rows={3} />
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
}

const Soltar = styled.label`
    display: grid;
    place-items: center;
    gap: 6px;
    padding: 28px 16px;
    border: 2px dashed ${colors.border};
    border-radius: 14px;
    background: ${colors.surfaceAlt};
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;

    &:hover {
        border-color: ${colors.primary};
    }

    input {
        display: none;
    }
`;

/** Importa o XML de uma NF-e/NFS-e: o sistema lê os dados, detecta entrada/saída e vincula ao cliente ou fornecedor. */
export function ImportarXmlDialog({ open, onClose }) {
    const queryClient = useQueryClient();
    const [arquivos, setArquivos] = useState([]);
    const [resultados, setResultados] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const entrada = useRef(null);

    const fechar = async () => {
        setArquivos([]);
        setResultados([]);
        await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
        onClose();
    };

    const importar = async () => {
        setEnviando(true);
        const saida = [];

        for (const arquivo of arquivos) {
            try {
                const xml = await arquivo.text();
                const nota = await fiscalApi.importarXml({ xml });
                saida.push({ nome: arquivo.name, ok: true, detalhe: `${nota.tipo} nº ${nota.numero ?? 's/n'}` });
            } catch (erro) {
                saida.push({ nome: arquivo.name, ok: false, detalhe: errorMessage(erro, 'Não foi possível importar.') });
            }
        }

        setResultados(saida);
        setEnviando(false);
        setArquivos([]);
        const importadas = saida.filter((r) => r.ok).length;
        if (importadas > 0) toast.success(`${importadas} nota(s) importada(s).`);
        await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
    };

    if (!open) return null;

    return (
        <Dialog
            open
            width={600}
            title="Importar XML de notas"
            subtitle="NF-e e NFS-e. Dá para escolher vários arquivos."
            onClose={fechar}
            footer={
                <>
                    <Button variant="secondary" onClick={fechar}>Fechar</Button>
                    <Button icon={<FaFileUpload />} loading={enviando} disabled={arquivos.length === 0} onClick={importar}>
                        Importar {arquivos.length > 0 ? `${arquivos.length} arquivo(s)` : ''}
                    </Button>
                </>
            }
        >
            <Soltar>
                <IconChip $soft $tone="blue" $size={54}><FaFileUpload /></IconChip>
                <strong>{arquivos.length > 0 ? `${arquivos.length} arquivo(s) selecionado(s)` : 'Clique para escolher os arquivos XML'}</strong>
                <Muted>Os dados são lidos do XML; notas já cadastradas são ignoradas.</Muted>
                <input ref={entrada} type="file" accept=".xml,text/xml,application/xml" multiple onChange={(e) => { setArquivos([...e.target.files]); setResultados([]); }} />
            </Soltar>

            {resultados.length > 0 && (
                <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                    {resultados.map((r) => (
                        <li key={r.nome} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Badge $tone={r.ok ? 'success' : 'danger'}>{r.ok ? 'Importada' : 'Falhou'}</Badge>
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nome}</span>
                            <Muted>{r.detalhe}</Muted>
                        </li>
                    ))}
                </ul>
            )}
        </Dialog>
    );
}
