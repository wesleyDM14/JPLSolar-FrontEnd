import { FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, Page } from '../../ui';

const NotAuthorized = () => {
    const navigate = useNavigate();

    return (
        <Page>
            <EmptyState
                icon={FaLock}
                title="Acesso não autorizado"
                description="Você não tem permissão para acessar esta página. Verifique suas credenciais ou fale com o administrador."
                action={<Button onClick={() => navigate('/dashboard')}>Voltar para o painel</Button>}
            />
        </Page>
    );
};

export default NotAuthorized;
