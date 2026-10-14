import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaCopy, FaExternalLinkAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { errorMessage } from '../../api/client';
import { usinasApi } from '../../api/resources';
import { Button, Card, CardTitle, Grid, KeyValue, Muted, Row } from '../../ui';

const copiar = (texto, mensagem) => navigator.clipboard?.writeText(texto).then(() => toast.success(mensagem));

/**
 * Login e senha do portal do fabricante. A senha só é buscada quando o usuário pede para ver
 * (a consulta fica registrada no servidor) e some da tela ao ocultar.
 */
export default function AcessoPortal({ usina }) {
    const [visivel, setVisivel] = useState(false);

    const buscar = useMutation({
        mutationFn: () => usinasApi.acesso(usina.id),
        onSuccess: () => setVisivel(true),
        onError: (erro) => toast.error(errorMessage(erro, 'Não foi possível obter a senha.')),
    });

    const acesso = buscar.data;

    return (
        <Card>
            <CardTitle>Acesso ao portal do fabricante</CardTitle>
            <Grid $cols={2}>
                <KeyValue label="Login">{usina.login}</KeyValue>
                <KeyValue label="Senha">
                    {visivel && acesso ? <code style={{ wordBreak: 'break-all' }}>{acesso.password}</code> : '••••••••••'}
                </KeyValue>
            </Grid>
            <Row style={{ marginTop: 12 }}>
                {visivel ? (
                    <Button size="sm" variant="secondary" icon={<FaEyeSlash />} onClick={() => setVisivel(false)}>Ocultar senha</Button>
                ) : (
                    <Button size="sm" variant="secondary" icon={<FaEye />} loading={buscar.isPending} onClick={() => buscar.mutate()}>Mostrar senha</Button>
                )}
                <Button size="sm" variant="ghost" icon={<FaCopy />} onClick={() => copiar(usina.login, 'Login copiado.')}>Copiar login</Button>
                {visivel && acesso && (
                    <Button size="sm" variant="ghost" icon={<FaCopy />} onClick={() => copiar(acesso.password, 'Senha copiada.')}>Copiar senha</Button>
                )}
                {acesso?.portal && (
                    <Button size="sm" variant="ghost" icon={<FaExternalLinkAlt />} onClick={() => window.open(acesso.portal.url, '_blank', 'noopener')}>
                        Abrir {acesso.portal.nome}
                    </Button>
                )}
            </Row>
            <p style={{ marginTop: 8 }}><Muted>Use para consultar o site do fabricante manualmente. A senha fica criptografada no sistema.</Muted></p>
        </Card>
    );
}

/** Na edição da usina: mostra a senha atual do portal (para conferir antes de trocar). */
export function SenhaAtual({ usinaId }) {
    const buscar = useMutation({
        mutationFn: () => usinasApi.acesso(usinaId),
        onError: (erro) => toast.error(errorMessage(erro, 'Não foi possível obter a senha.')),
    });

    return (
        <Row style={{ marginTop: 10 }}>
            {buscar.data ? (
                <>
                    <span>Senha atual: <code>{buscar.data.password}</code></span>
                    <Button size="sm" variant="ghost" icon={<FaCopy />} onClick={() => copiar(buscar.data.password, 'Senha copiada.')}>Copiar</Button>
                    <Button size="sm" variant="ghost" icon={<FaEyeSlash />} onClick={() => buscar.reset()}>Ocultar</Button>
                </>
            ) : (
                <Button size="sm" variant="secondary" icon={<FaEye />} loading={buscar.isPending} onClick={() => buscar.mutate()}>Ver senha atual</Button>
            )}
        </Row>
    );
}
