import { FaExclamationTriangle } from "react-icons/fa";
import { BackButton, IconWrapper, Message, NotAuthorizedContainer, Title } from "./styles";

const NotAuthorized = () => {
    return (
        <NotAuthorizedContainer>
            <Title>
                <IconWrapper>
                    <FaExclamationTriangle />
                </IconWrapper>
                403 - Não Autorizado
            </Title>
            <Message>
                Você não tem permissão para acessar esta página. Por favor, verifique suas credenciais ou entre em contato com o administrador.
            </Message>
            <BackButton onClick={() => window.location.href = '/dashboard'}>
                Voltar para a página inicial
            </BackButton>
        </NotAuthorizedContainer>
    );
}

export default NotAuthorized;