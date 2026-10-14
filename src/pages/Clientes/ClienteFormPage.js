import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { clientesApi } from '../../api/resources';
import { errorMessage, fieldErrors } from '../../api/client';
import { ErrorBlock, LoadingBlock, Page, PageHeader } from '../../ui';
import { buildClientePayload, ClienteForm, clienteInitialValues } from './ClienteForm';

// Mesma tela para cadastrar (/clientes/novo) e editar (/clientes/:id/editar).
export default function ClienteFormPage() {
    const { id } = useParams();
    const editing = Boolean(id);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: cliente, isLoading, error, refetch } = useQuery({
        queryKey: ['cliente', id],
        queryFn: () => clientesApi.get(id),
        enabled: editing,
    });

    const mutation = useMutation({
        mutationFn: (payload) => (editing ? clientesApi.update(id, payload) : clientesApi.create(payload)),
    });

    const handleSubmit = async (values, { setErrors }) => {
        try {
            const saved = await mutation.mutateAsync(buildClientePayload(values));
            await queryClient.invalidateQueries({ queryKey: ['clientes'] });
            await queryClient.invalidateQueries({ queryKey: ['cliente', saved.id] });
            toast.success(editing ? 'Cliente atualizado.' : 'Cliente cadastrado.');
            navigate(`/clientes/${saved.id}`);
        } catch (err) {
            setErrors(fieldErrors(err));
            toast.error(errorMessage(err));
        }
    };

    if (editing && isLoading) return <Page><LoadingBlock /></Page>;
    if (editing && error) return <Page><ErrorBlock message={errorMessage(error)} onRetry={refetch} /></Page>;

    return (
        <Page>
            <PageHeader
                title={editing ? 'Editar cliente' : 'Novo cliente'}
                subtitle={editing ? cliente?.nome : 'Só o nome é obrigatório agora. O restante é exigido ao emitir o contrato.'}
            />
            <ClienteForm initialValues={clienteInitialValues(cliente)} onSubmit={handleSubmit} />
        </Page>
    );
}
