import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { documentosApi, openFileInTab } from '../api/resources';
import { errorMessage } from '../api/client';
import { Button, Card, CardTitle, ConfirmDialog, DataTable, FilterSelect, Muted, Row } from '../ui';
import { tipoDocumentoLabel, tipoDocumentoOptions } from '../utils/enums';

/**
 * Lista, envia, baixa e remove documentos de um cliente ou de um contrato.
 * `tipos` restringe os tipos aceitos (ex.: contrato social só para PJ).
 */
export default function DocumentosPanel({ clienteId, contractId, tipos, defaultTipo, hint }) {
    const queryClient = useQueryClient();
    const fileInput = useRef(null);
    const options = tipos ?? tipoDocumentoOptions;
    const [tipo, setTipo] = useState(defaultTipo ?? options[0]?.value ?? '');
    const [toDelete, setToDelete] = useState(null);

    const filters = contractId ? { contractId } : { clienteId };

    const { data, isLoading } = useQuery({
        queryKey: ['documentos', filters],
        queryFn: () => documentosApi.list(filters),
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['documentos'] });

    const upload = useMutation({
        mutationFn: (arquivo) => documentosApi.upload({ arquivo, tipo, ...filters }),
        onSuccess: () => { toast.success('Documento enviado.'); refresh(); },
        onError: (err) => toast.error(errorMessage(err)),
    });

    const remove = useMutation({
        mutationFn: (id) => documentosApi.remove(id),
        onSuccess: () => { toast.success('Documento removido.'); setToDelete(null); refresh(); },
        onError: (err) => toast.error(errorMessage(err)),
    });

    const download = async (documento) => {
        try {
            await openFileInTab(() => documentosApi.download(documento.id), documento.nomeArquivo, 'Abrindo documento…');
        } catch (err) {
            toast.error(errorMessage(err));
        }
    };

    const onFile = (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) upload.mutate(file);
    };

    return (
        <>
            <Card>
                <CardTitle>Enviar documento</CardTitle>
                <Row $gap={12}>
                    <div style={{ minWidth: 240 }}>
                        <FilterSelect label="Tipo" options={options} value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Selecione" />
                    </div>
                    <div style={{ alignSelf: 'flex-end' }}>
                        <input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" hidden onChange={onFile} />
                        <Button loading={upload.isPending} disabled={!tipo} onClick={() => fileInput.current?.click()}>Escolher arquivo</Button>
                    </div>
                </Row>
                <p style={{ marginTop: 10 }}><Muted>PDF, JPG ou PNG, até 10 MB. {hint}</Muted></p>
            </Card>

            <DataTable
                loading={isLoading}
                rows={data}
                emptyTitle="Nenhum documento anexado"
                columns={[
                    { key: 'tipo', header: 'Tipo', render: (d) => tipoDocumentoLabel(d.tipo) },
                    { key: 'nomeArquivo', header: 'Arquivo' },
                    { key: 'tamanho', header: 'Tamanho', render: (d) => `${Math.max(1, Math.round(d.tamanho / 1024))} KB` },
                    { key: 'createdAt', header: 'Enviado em', render: (d) => new Date(d.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' }) },
                    {
                        key: 'acoes',
                        header: '',
                        render: (d) => (
                            <Row $justify="flex-end">
                                <Button size="sm" variant="secondary" onClick={() => download(d)}>Abrir</Button>
                                <Button size="sm" variant="danger" onClick={() => setToDelete(d)}>Remover</Button>
                            </Row>
                        ),
                    },
                ]}
            />

            <ConfirmDialog
                open={Boolean(toDelete)}
                title="Remover documento"
                message={`Remover "${toDelete?.nomeArquivo}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Remover"
                danger
                loading={remove.isPending}
                onConfirm={() => remove.mutate(toDelete.id)}
                onClose={() => setToDelete(null)}
            />
        </>
    );
}
