import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaBell, FaCalendarAlt, FaCamera, FaEye, FaEyeSlash, FaIdBadge, FaLock, FaPalette, FaPowerOff, FaShieldAlt, FaTrashAlt, FaUserEdit } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../api/client';
import { authApi, notificacoesApi } from '../../api/resources';
import { login as loginAction } from '../../actions/sessionActions';
import { logoutUser } from '../../services/authServices';
import {
    Avatar,
    Badge,
    Button,
    Card,
    ErrorBlock,
    Grid,
    LoadingBlock,
    Page,
    Reveal,
    Row,
    SectionTitle,
    TextField,
    THEME_OPTIONS,
    tokens,
    useTheme,
} from '../../ui';

const { colors } = tokens;

const Hero = styled.section`
    position: relative;
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 26px 28px;
    margin-bottom: 18px;
    border-radius: 20px;
    color: #fff;
    overflow: hidden;
    background:
        radial-gradient(700px 260px at 0% 0%, rgba(229, 57, 53, 0.55), transparent 60%),
        linear-gradient(135deg, #14171c, #232a33);
    box-shadow: 0 14px 34px rgba(20, 23, 28, 0.28);

    /* círculos decorativos */
    &::before,
    &::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.07);
    }

    &::before {
        width: 260px;
        height: 260px;
        right: -60px;
        top: -90px;
    }

    &::after {
        width: 160px;
        height: 160px;
        right: 90px;
        bottom: -80px;
    }

    .nome {
        font-size: 1.6rem;
        font-family: 'Montserrat', sans-serif;
        font-weight: 800;
        line-height: 1.2;
    }

    .login {
        margin-top: 2px;
        color: #aeb6c2;
    }

    .selos {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
    }

    @media (max-width: 640px) {
        flex-direction: column;
        text-align: center;
        padding: 22px 18px;

        .selos {
            justify-content: center;
        }
    }
`;

const Selo = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 0.8rem;
    font-weight: 600;
`;

const Colunas = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    gap: 16px;
    align-items: start;

    @media (max-width: 1000px) {
        grid-template-columns: 1fr;
    }
`;

const Forca = styled.div`
    margin: -4px 0 12px;

    .barra {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5px;
    }

    .barra span {
        height: 6px;
        border-radius: 4px;
        background: ${colors.neutralBg};
        transition: background 0.25s;
    }

    .texto {
        margin-top: 6px;
        font-size: 0.8rem;
        color: ${colors.muted};
    }
`;

const Atalho = styled.button`
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 10px;
    border: 1px solid ${colors.border};
    border-radius: 12px;
    background: ${colors.surface};
    text-align: left;
    cursor: pointer;
    color: ${colors.text};
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;

    &:hover {
        border-color: ${colors.primary};
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }

    small {
        display: block;
        color: ${colors.muted};
    }
`;

const Info = styled.dl`
    margin: 0;
    display: grid;
    gap: 12px;

    dt {
        font-size: 0.74rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: ${colors.muted};
    }

    dd {
        margin: 2px 0 0;
        font-weight: 600;
    }
`;

const NIVEIS = [
    { texto: 'Muito fraca', cor: '#E53935' },
    { texto: 'Fraca', cor: '#FB8C00' },
    { texto: 'Boa', cor: '#FDD835' },
    { texto: 'Forte', cor: '#43A047' },
];

// Pontua comprimento e variedade de caracteres (0 a 4). Só orienta; a regra é o mínimo de 8 caracteres.
function forcaDaSenha(senha) {
    if (!senha) return -1;
    let pontos = 0;
    if (senha.length >= 8) pontos += 1;
    if (senha.length >= 12) pontos += 1;
    if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos += 1;
    if (/\d/.test(senha) && /[^A-Za-z0-9]/.test(senha)) pontos += 1;
    return Math.min(3, Math.max(0, pontos - (senha.length < 8 ? 1 : 0)));
}

const senhaSchema = Yup.object({
    currentPassword: Yup.string().required('Informe a senha atual.'),
    newPassword: Yup.string().min(8, 'A senha deve ter ao menos 8 caracteres.').required('Informe a nova senha.'),
    confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], 'As senhas não conferem.').required('Confirme a nova senha.'),
});

function CampoSenha({ name, label, autoComplete }) {
    const [visivel, setVisivel] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <TextField name={name} label={label} type={visivel ? 'text' : 'password'} autoComplete={autoComplete} />
            <button
                type="button"
                aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setVisivel((valor) => !valor)}
                style={{ position: 'absolute', right: 8, top: 28, width: 34, height: 34, border: 0, borderRadius: 8, background: 'transparent', color: colors.muted, cursor: 'pointer' }}
            >
                {visivel ? <FaEyeSlash /> : <FaEye />}
            </button>
        </div>
    );
}

// Reduz a foto para um quadrado de 256 px antes de enviar (a API guarda a imagem no próprio cadastro).
function reduzirFoto(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        leitor.onload = () => {
            const imagem = new Image();
            imagem.onerror = () => reject(new Error('O arquivo não é uma imagem válida.'));
            imagem.onload = () => {
                const lado = Math.min(imagem.width, imagem.height);
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                canvas
                    .getContext('2d')
                    .drawImage(imagem, (imagem.width - lado) / 2, (imagem.height - lado) / 2, lado, lado, 0, 0, 256, 256);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            imagem.src = leitor.result;
        };
        leitor.readAsDataURL(arquivo);
    });
}

// Mantém nome da sessão (menu lateral, topo) em dia depois de salvar o perfil.
function useSincronizarSessao() {
    const dispatch = useDispatch();
    const session = useSelector((state) => state.session.user);
    const queryClient = useQueryClient();

    return async (atualizado) => {
        if (session) {
            const nova = { ...session, user: { ...session.user, name: atualizado.name, login: atualizado.login } };
            localStorage.setItem('user', JSON.stringify(nova));
            dispatch(loginAction(nova));
        }
        await queryClient.invalidateQueries({ queryKey: ['me'] });
    };
}

const FotoBox = styled.div`
    position: relative;
    flex: none;
    z-index: 1;

    .acoes {
        position: absolute;
        right: -6px;
        bottom: -6px;
        display: flex;
        gap: 4px;
    }

    .acoes button {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: 2px solid #232a33;
        border-radius: 50%;
        background: ${colors.primary};
        color: #fff;
        font-size: 13px;
        cursor: pointer;
        transition: transform 0.15s;
    }

    .acoes button:hover {
        transform: scale(1.08);
    }

    .acoes button.remover {
        background: #4a5260;
    }
`;

function FotoPerfil({ me }) {
    const entrada = useRef(null);
    const sincronizar = useSincronizarSessao();
    const [salvando, setSalvando] = useState(false);

    const salvar = async (foto) => {
        setSalvando(true);
        try {
            const atualizado = await authApi.updateMe({ foto });
            await sincronizar(atualizado);
            toast.success(foto ? 'Foto atualizada.' : 'Foto removida.');
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível salvar a foto.'));
        } finally {
            setSalvando(false);
        }
    };

    const escolher = async (evento) => {
        const arquivo = evento.target.files?.[0];
        evento.target.value = '';
        if (!arquivo) return;
        if (!arquivo.type.startsWith('image/')) {
            toast.error('Escolha um arquivo de imagem.');
            return;
        }
        try {
            await salvar(await reduzirFoto(arquivo));
        } catch (erro) {
            toast.error(erro.message);
        }
    };

    return (
        <FotoBox>
            <Avatar nome={me.name || me.login} src={me.foto} size={96} />
            <div className="acoes">
                <button type="button" title="Trocar foto" aria-label="Trocar foto" disabled={salvando} onClick={() => entrada.current?.click()}>
                    <FaCamera />
                </button>
                {me.foto && (
                    <button type="button" className="remover" title="Remover foto" aria-label="Remover foto" disabled={salvando} onClick={() => salvar('')}>
                        <FaTrashAlt />
                    </button>
                )}
            </div>
            <input ref={entrada} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={escolher} />
        </FotoBox>
    );
}

function DadosCard({ me }) {
    const sincronizar = useSincronizarSessao();

    return (
        <Card>
            <SectionTitle icon={FaUserEdit} tom="blue">Meus dados</SectionTitle>
            <Formik
                enableReinitialize
                initialValues={{ name: me.name ?? '', login: me.login, email: me.email ?? '', telefone: me.telefone ?? '', cargo: me.cargo ?? '' }}
                validationSchema={Yup.object({
                    login: Yup.string().trim().required('Informe o login.'),
                    email: Yup.string().trim().email('E-mail inválido.'),
                    telefone: Yup.string().test('telefone', 'Telefone deve ter DDD + 8 ou 9 dígitos.', (valor) => !valor || [10, 11].includes(valor.replace(/\D/g, '').length)),
                })}
                onSubmit={async (values, { setErrors }) => {
                    try {
                        const atualizado = await authApi.updateMe(values);
                        await sincronizar(atualizado);
                        toast.success('Perfil atualizado.');
                    } catch (erro) {
                        setErrors(fieldErrors(erro));
                        toast.error(errorMessage(erro));
                    }
                }}
            >
                {({ isSubmitting, dirty }) => (
                    <Form noValidate>
                        <Grid $cols={2}>
                            <TextField name="name" label="Nome" placeholder="Seu nome completo" />
                            <TextField name="cargo" label="Cargo" placeholder="Ex.: Diretor, Financeiro" />
                            <TextField name="email" label="E-mail" type="email" placeholder="voce@empresa.com.br" />
                            <TextField name="telefone" label="Telefone" mask="phone" placeholder="(84) 99999-9999" />
                            <TextField name="login" label="Login de acesso" required hint="Usado para entrar no sistema." />
                        </Grid>
                        <Row $justify="flex-end" style={{ marginTop: 14 }}>
                            <Button type="submit" loading={isSubmitting} disabled={!dirty}>Salvar alterações</Button>
                        </Row>
                    </Form>
                )}
            </Formik>
        </Card>
    );
}

function SegurancaCard() {
    return (
        <Card>
            <SectionTitle icon={FaLock} tom="red">Segurança</SectionTitle>
            <Formik
                initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
                validationSchema={senhaSchema}
                onSubmit={async ({ currentPassword, newPassword }, { setErrors, resetForm }) => {
                    try {
                        await authApi.changePassword({ currentPassword, newPassword });
                        toast.success('Senha alterada com sucesso.');
                        resetForm();
                    } catch (erro) {
                        setErrors(fieldErrors(erro));
                        toast.error(errorMessage(erro));
                    }
                }}
            >
                {({ isSubmitting, values }) => {
                    const forca = forcaDaSenha(values.newPassword);
                    return (
                        <Form noValidate>
                            <CampoSenha name="currentPassword" label="Senha atual" autoComplete="current-password" />
                            <CampoSenha name="newPassword" label="Nova senha" autoComplete="new-password" />
                            {forca >= 0 && (
                                <Forca>
                                    <div className="barra">
                                        {NIVEIS.map((nivel, indice) => (
                                            <span key={nivel.texto} style={{ background: indice <= forca ? NIVEIS[forca].cor : undefined }} />
                                        ))}
                                    </div>
                                    <div className="texto">Força da senha: <strong>{NIVEIS[forca].texto}</strong></div>
                                </Forca>
                            )}
                            <CampoSenha name="confirmPassword" label="Confirmar nova senha" autoComplete="new-password" />
                            <Row $justify="flex-end" style={{ marginTop: 14 }}>
                                <Button type="submit" icon={<FaShieldAlt />} loading={isSubmitting}>Alterar senha</Button>
                            </Row>
                        </Form>
                    );
                }}
            </Formik>
        </Card>
    );
}

const OpcoesTema = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;

    button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 14px 8px;
        border: 2px solid ${colors.border};
        border-radius: 14px;
        background: ${colors.surface};
        color: ${colors.text};
        font-weight: 600;
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;

        svg {
            font-size: 22px;
        }

        &:hover {
            transform: translateY(-1px);
        }

        &[aria-pressed='true'] {
            border-color: ${colors.primary};
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-primary) 18%, transparent);
        }
    }
`;

function AparenciaCard() {
    const { mode, setMode } = useTheme();

    return (
        <Card>
            <SectionTitle icon={FaPalette} tom="purple">Aparência</SectionTitle>
            <OpcoesTema>
                {THEME_OPTIONS.map((opcao) => {
                    const Icone = opcao.icon;
                    return (
                        <button key={opcao.id} type="button" aria-pressed={mode === opcao.id} onClick={() => setMode(opcao.id)}>
                            <Icone />
                            {opcao.label}
                        </button>
                    );
                })}
            </OpcoesTema>
        </Card>
    );
}

export default function ProfilePage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const session = useSelector((state) => state.session.user);

    const { data: me, isLoading, error, refetch } = useQuery({ queryKey: ['me'], queryFn: authApi.me });
    const { data: resumo } = useQuery({ queryKey: ['notificacoes', 'resumo'], queryFn: notificacoesApi.resumo });

    const desde = useMemo(() => (me?.createdAt ? new Date(me.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza', month: 'long', year: 'numeric' }) : ''), [me]);
    const entrou = session?.loginTime ? new Date(session.loginTime).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }) : '';

    const sair = useMutation({ mutationFn: async () => logoutUser(navigate, dispatch) });

    // Links antigos para a aba de notificações agora vão para a central.
    if (params.get('aba') === 'notificacoes') return <Navigate to="/notificacoes" replace />;

    if (isLoading) return <Page><LoadingBlock /></Page>;
    if (error) return <Page><ErrorBlock message={errorMessage(error)} onRetry={refetch} /></Page>;

    return (
        <Page>
            <Reveal>
                <Hero>
                    <FotoPerfil me={me} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="nome">{me.name || me.login}</div>
                        <div className="login">@{me.login}{me.cargo ? ` · ${me.cargo}` : ''}</div>
                        <div className="selos">
                            <Selo><FaIdBadge /> Administrador</Selo>
                            {desde && <Selo><FaCalendarAlt /> Desde {desde}</Selo>}
                        </div>
                    </div>
                </Hero>
            </Reveal>

            <Colunas>
                <div>
                    <Reveal $delay={60}><DadosCard me={me} /></Reveal>
                    <Reveal $delay={120}><SegurancaCard /></Reveal>
                </div>

                <div>
                    <Reveal $delay={90}>
                        <Card>
                            <SectionTitle icon={FaBell} tom="orange">Atalhos</SectionTitle>
                            <Atalho type="button" onClick={() => navigate('/notificacoes')}>
                                <FaBell style={{ color: colors.primary }} />
                                <span>
                                    <strong>Central de notificações</strong>
                                    <small>{resumo ? `${resumo.naoLidas} não lida(s) de ${resumo.total}` : 'Avisos de usinas e financeiro'}</small>
                                </span>
                                {resumo?.naoLidas > 0 && <Badge $tone="danger" style={{ marginLeft: 'auto' }}>{resumo.naoLidas}</Badge>}
                            </Atalho>
                        </Card>
                    </Reveal>

                    <Reveal $delay={120}><AparenciaCard /></Reveal>

                    <Reveal $delay={150}>
                        <Card>
                            <SectionTitle icon={FaShieldAlt} tom="green">Esta sessão</SectionTitle>
                            <Info>
                                <div><dt>Conectado desde</dt><dd>{entrou || '—'}</dd></div>
                                <div><dt>Perfil de acesso</dt><dd>Administrador</dd></div>
                            </Info>
                            <Button variant="danger" icon={<FaPowerOff />} loading={sair.isPending} onClick={() => sair.mutate()} style={{ marginTop: 16 }}>
                                Sair do sistema
                            </Button>
                        </Card>
                    </Reveal>
                </div>
            </Colunas>
        </Page>
    );
}
