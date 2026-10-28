import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaBell, FaBellSlash } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../api/client';
import { notificacoesApi } from '../api/resources';
import { Badge, Button, Card, Muted, Row, tokens } from '../ui';

const { colors } = tokens;

const CATEGORIAS = [
    { id: 'pagamentos', rotulo: 'Pagamentos recebidos' },
    { id: 'boletos', rotulo: 'Boletos emitidos' },
    { id: 'usinas', rotulo: 'Usinas em alerta ou offline' },
    { id: 'chat', rotulo: 'Mensagens do chat' },
    { id: 'sistema', rotulo: 'Avisos do sistema' },
];

const Opcoes = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    margin: 12px 0 4px;

    label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9rem;
        color: ${colors.text};
        cursor: pointer;
    }
`;

const paraBytes = (base64) => {
    const preenchido = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
    const bruto = window.atob(preenchido);
    return Uint8Array.from([...bruto].map((c) => c.charCodeAt(0)));
};

const suportado = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** Liga/desliga as notificações push neste navegador e escolhe quais avisos chegam. */
export default function PushNotificacoes() {
    const [estado, setEstado] = useState('carregando'); // carregando | nao-suportado | desligado-no-servidor | bloqueado | desativado | ativo
    const [categorias, setCategorias] = useState(CATEGORIAS.map((c) => c.id));
    const [ocupado, setOcupado] = useState(false);

    useEffect(() => {
        let cancelado = false;

        (async () => {
            if (!suportado()) {
                setEstado('nao-suportado');
                return;
            }

            try {
                const chave = await notificacoesApi.pushChave();
                if (!chave.ativo) {
                    if (!cancelado) setEstado('desligado-no-servidor');
                    return;
                }

                const registro = await navigator.serviceWorker.register('/sw-push.js');
                const inscricao = await registro.pushManager.getSubscription();

                if (inscricao) {
                    const dados = await notificacoesApi.pushEstado(inscricao.endpoint);
                    if (!cancelado && dados.inscrito) {
                        setCategorias(dados.categorias);
                        setEstado('ativo');
                        return;
                    }
                }
                if (!cancelado) setEstado(Notification.permission === 'denied' ? 'bloqueado' : 'desativado');
            } catch {
                if (!cancelado) setEstado('desativado');
            }
        })();

        return () => {
            cancelado = true;
        };
    }, []);

    const registrar = async (lista) => {
        const registro = await navigator.serviceWorker.register('/sw-push.js');
        const { chavePublica } = await notificacoesApi.pushChave();
        let inscricao = await registro.pushManager.getSubscription();
        if (!inscricao) {
            inscricao = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: paraBytes(chavePublica) });
        }
        const { endpoint, keys } = inscricao.toJSON();
        await notificacoesApi.pushInscrever({ endpoint, keys, categorias: lista });
    };

    const ativar = async () => {
        setOcupado(true);
        try {
            const permissao = await Notification.requestPermission();
            if (permissao !== 'granted') {
                setEstado('bloqueado');
                return;
            }
            await registrar(categorias);
            setEstado('ativo');
            await notificacoesApi.pushTestar().catch(() => undefined);
            toast.success('Notificações ativadas neste dispositivo.');
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível ativar as notificações.'));
        } finally {
            setOcupado(false);
        }
    };

    const desativar = async () => {
        setOcupado(true);
        try {
            const registro = await navigator.serviceWorker.getRegistration('/sw-push.js');
            const inscricao = await registro?.pushManager.getSubscription();
            if (inscricao) {
                await notificacoesApi.pushCancelar(inscricao.endpoint).catch(() => undefined);
                await inscricao.unsubscribe();
            }
            setEstado('desativado');
            toast.success('Notificações desativadas neste dispositivo.');
        } catch (erro) {
            toast.error(errorMessage(erro));
        } finally {
            setOcupado(false);
        }
    };

    const alternarCategoria = async (id) => {
        const nova = categorias.includes(id) ? categorias.filter((c) => c !== id) : [...categorias, id];
        setCategorias(nova);
        try {
            await registrar(nova);
        } catch (erro) {
            toast.error(errorMessage(erro));
        }
    };

    if (estado === 'carregando' || estado === 'desligado-no-servidor') return null;

    return (
        <Card style={{ marginBottom: 16 }}>
            <Row $justify="space-between">
                <Row>
                    {estado === 'ativo' ? <FaBell /> : <FaBellSlash />}
                    <strong>Notificações no dispositivo</strong>
                    {estado === 'ativo' && <Badge $tone="success">Ativas</Badge>}
                </Row>
                {estado === 'ativo' && (
                    <Row>
                        <Button size="sm" variant="secondary" onClick={() => notificacoesApi.pushTestar().then(() => toast.success('Teste enviado.'))}>Enviar teste</Button>
                        <Button size="sm" variant="ghost" loading={ocupado} onClick={desativar}>Desativar</Button>
                    </Row>
                )}
                {estado === 'desativado' && <Button size="sm" icon={<FaBell />} loading={ocupado} onClick={ativar}>Ativar neste dispositivo</Button>}
            </Row>

            {estado === 'nao-suportado' && <p style={{ margin: '8px 0 0' }}><Muted>Este navegador não oferece notificações push. No iPhone, adicione o sistema à tela de início.</Muted></p>}
            {estado === 'bloqueado' && <p style={{ margin: '8px 0 0' }}><Muted>As notificações estão bloqueadas no navegador. Libere nas configurações do site e recarregue.</Muted></p>}

            {estado === 'ativo' && (
                <Opcoes>
                    {CATEGORIAS.map((c) => (
                        <label key={c.id}>
                            <input type="checkbox" checked={categorias.includes(c.id)} onChange={() => alternarCategoria(c.id)} />
                            {c.rotulo}
                        </label>
                    ))}
                </Opcoes>
            )}
        </Card>
    );
}
