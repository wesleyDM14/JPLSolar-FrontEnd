import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaUserCog, FaUsers } from 'react-icons/fa';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../api/client';
import { equipesApi, usuariosApi } from '../../api/resources';
import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    DataTable,
    Dialog,
    ErrorBlock,
    Grid,
    Muted,
    Page,
    PageHeader,
    RowActions,
    SelectField,
    Tabs,
    TextField,
    TextareaField,
} from '../../ui';
import { formatPhone } from '../../utils/masks';

const PAPEIS = [
    { value: 'ADMIN', label: 'Administrador (painel completo)' },
    { value: 'INSTALADOR', label: 'Instalador (aplicativo de campo)' },
];
const SIM_NAO = [{ value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }];

const schemaNovo = Yup.object({
    name: Yup.string().trim().min(2, 'Informe o nome').required('Informe o nome'),
    login: Yup.string().trim().min(3, 'Mínimo de 3 caracteres').required('Informe o login'),
    password: Yup.string().min(8, 'Mínimo de 8 caracteres').required('Informe a senha'),
});
const schemaEdicao = Yup.object({
    name: Yup.string().trim().min(2, 'Informe o nome').required('Informe o nome'),
    login: Yup.string().trim().min(3, 'Mínimo de 3 caracteres').required('Informe o login'),
    password: Yup.string().min(8, 'Mínimo de 8 caracteres'),
});

function UsuarioDialog({ usuario, equipes, onClose }) {
    const queryClient = useQueryClient();
    const editando = Boolean(usuario);

    const salvar = useMutation({
        mutationFn: (payload) => (editando ? usuariosApi.atualizar(usuario.id, payload) : usuariosApi.criar(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            await queryClient.invalidateQueries({ queryKey: ['equipes'] });
            toast.success(editando ? 'Usuário atualizado.' : 'Usuário criado.');
            onClose();
        },
    });

    return (
        <Formik
            initialValues={{
                name: usuario?.name ?? '',
                login: usuario?.login ?? '',
                password: '',
                papel: usuario?.papel ?? 'INSTALADOR',
                equipeId: usuario?.equipeId ?? '',
                telefone: usuario?.telefone ?? '',
                email: usuario?.email ?? '',
                cargo: usuario?.cargo ?? '',
                ativo: usuario ? String(usuario.ativo) : 'true',
            }}
            validationSchema={editando ? schemaEdicao : schemaNovo}
            onSubmit={async (v, { setErrors }) => {
                const payload = {
                    name: v.name.trim(),
                    login: v.login.trim(),
                    papel: v.papel,
                    equipeId: v.equipeId || (editando ? null : undefined),
                    telefone: v.telefone || undefined,
                    email: v.email || undefined,
                    cargo: v.cargo || undefined,
                    ativo: v.ativo === 'true',
                    ...(v.password ? { password: v.password } : {}),
                };
                try {
                    await salvar.mutateAsync(payload);
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
                    title={editando ? 'Editar usuário' : 'Novo usuário'}
                    subtitle="Administradores usam o painel; instaladores usam o aplicativo de campo."
                    onClose={onClose}
                    footer={
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="usuario-form" loading={isSubmitting}>Salvar</Button>
                        </>
                    }
                >
                    <Form noValidate id="usuario-form">
                        <Grid $cols={2}>
                            <TextField name="name" label="Nome" required />
                            <TextField name="login" label="Login" required autoComplete="off" />
                            <TextField
                                name="password"
                                label={editando ? 'Nova senha' : 'Senha'}
                                type="password"
                                autoComplete="new-password"
                                required={!editando}
                                hint={editando ? 'Deixe em branco para manter a atual.' : 'Mínimo de 8 caracteres.'}
                            />
                            <SelectField name="papel" label="Papel" options={PAPEIS} placeholder={null} />
                            <SelectField
                                name="equipeId"
                                label="Equipe"
                                placeholder="Sem equipe"
                                options={equipes.map((e) => ({ value: e.id, label: e.nome }))}
                            />
                            <SelectField name="ativo" label="Acesso ativo" options={SIM_NAO} placeholder={null} />
                            <TextField name="telefone" label="Telefone" mask="phone" />
                            <TextField name="email" label="E-mail" type="email" />
                            <TextField name="cargo" label="Cargo/função" />
                        </Grid>
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
}

function EquipeDialog({ equipe, pessoas, onClose }) {
    const queryClient = useQueryClient();

    const salvar = useMutation({
        mutationFn: (payload) => (equipe ? equipesApi.atualizar(equipe.id, payload) : equipesApi.criar(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['equipes'] });
            await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            toast.success('Equipe salva.');
            onClose();
        },
    });

    return (
        <Formik
            initialValues={{
                nome: equipe?.nome ?? '',
                descricao: equipe?.descricao ?? '',
                responsavelId: equipe?.responsavelId ?? '',
                ativa: equipe ? String(equipe.ativa) : 'true',
            }}
            validationSchema={Yup.object({ nome: Yup.string().trim().min(2, 'Informe o nome').required('Informe o nome') })}
            onSubmit={async (v, { setErrors }) => {
                try {
                    await salvar.mutateAsync({
                        nome: v.nome.trim(),
                        descricao: v.descricao || undefined,
                        responsavelId: v.responsavelId || null,
                        ativa: v.ativa === 'true',
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
                    width={520}
                    title={equipe ? 'Editar equipe' : 'Nova equipe'}
                    onClose={onClose}
                    footer={
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="equipe-form" loading={isSubmitting}>Salvar</Button>
                        </>
                    }
                >
                    <Form noValidate id="equipe-form">
                        <div style={{ display: 'grid', gap: 14 }}>
                            <TextField name="nome" label="Nome da equipe" required />
                            <SelectField
                                name="responsavelId"
                                label="Responsável"
                                placeholder="Sem responsável"
                                options={pessoas.map((p) => ({ value: p.id, label: p.name ?? p.login }))}
                            />
                            <SelectField name="ativa" label="Equipe ativa" options={SIM_NAO} placeholder={null} />
                            <TextareaField name="descricao" label="Descrição" rows={2} />
                            <Muted>Para colocar pessoas na equipe, edite o usuário e escolha a equipe.</Muted>
                        </div>
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
}

/** Usuários (administradores e instaladores) e equipes de campo. */
export default function Equipe() {
    const queryClient = useQueryClient();
    const [aba, setAba] = useState('usuarios');
    const [usuarioEdit, setUsuarioEdit] = useState(null); // objeto | 'novo'
    const [equipeEdit, setEquipeEdit] = useState(null);
    const [excluir, setExcluir] = useState(null); // { tipo, item }

    const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.listar });
    const equipes = useQuery({ queryKey: ['equipes'], queryFn: equipesApi.listar });

    const remover = useMutation({
        mutationFn: ({ tipo, item }) => (tipo === 'usuario' ? usuariosApi.remover(item.id) : equipesApi.remover(item.id)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            await queryClient.invalidateQueries({ queryKey: ['equipes'] });
            toast.success('Removido.');
            setExcluir(null);
        },
        onError: (erro) => {
            setExcluir(null);
            toast.error(errorMessage(erro));
        },
    });

    const listaUsuarios = usuarios.data ?? [];
    const listaEquipes = equipes.data ?? [];

    const colunasUsuarios = [
        {
            key: 'nome',
            header: 'Usuário',
            render: (u) => (
                <div>
                    <strong>{u.name ?? u.login}</strong>
                    <div><Muted>{u.login}{u.cargo ? ` · ${u.cargo}` : ''}</Muted></div>
                </div>
            ),
        },
        { key: 'papel', header: 'Papel', render: (u) => <Badge $tone={u.papel === 'ADMIN' ? 'info' : 'success'}>{u.papel === 'ADMIN' ? 'Administrador' : 'Instalador'}</Badge> },
        { key: 'equipe', header: 'Equipe', render: (u) => u.equipe?.nome ?? '—' },
        { key: 'tel', header: 'Telefone', render: (u) => (u.telefone ? formatPhone(u.telefone) : '—') },
        { key: 'ativo', header: 'Acesso', render: (u) => <Badge $tone={u.ativo ? 'success' : 'neutral'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge> },
        { key: 'acoes', header: '', render: (u) => <RowActions onEditar={() => setUsuarioEdit(u)} onExcluir={() => setExcluir({ tipo: 'usuario', item: u })} /> },
    ];

    const colunasEquipes = [
        { key: 'nome', header: 'Equipe', render: (e) => <strong>{e.nome}</strong> },
        { key: 'resp', header: 'Responsável', render: (e) => e.responsavel?.name ?? '—' },
        { key: 'membros', header: 'Integrantes', render: (e) => (e.membros.length ? e.membros.map((m) => m.name ?? m.login).join(', ') : <Muted>Ninguém ainda</Muted>) },
        { key: 'ativa', header: 'Situação', render: (e) => <Badge $tone={e.ativa ? 'success' : 'neutral'}>{e.ativa ? 'Ativa' : 'Inativa'}</Badge> },
        { key: 'acoes', header: '', render: (e) => <RowActions onEditar={() => setEquipeEdit(e)} onExcluir={() => setExcluir({ tipo: 'equipe', item: e })} /> },
    ];

    return (
        <Page>
            <PageHeader
                icon={FaUserCog}
                tone="purple"
                title="Equipe e acessos"
                subtitle="Administradores, instaladores e equipes de campo."
                actions={
                    aba === 'usuarios' ? (
                        <Button icon={<FaPlus />} onClick={() => setUsuarioEdit('novo')}>Novo usuário</Button>
                    ) : (
                        <Button icon={<FaPlus />} onClick={() => setEquipeEdit('nova')}>Nova equipe</Button>
                    )
                }
            />

            <Tabs
                tabs={[
                    { id: 'usuarios', label: `Usuários (${listaUsuarios.length})`, icon: <FaUserCog /> },
                    { id: 'equipes', label: `Equipes (${listaEquipes.length})`, icon: <FaUsers /> },
                ]}
                value={aba}
                onChange={setAba}
            />

            {aba === 'usuarios' &&
                (usuarios.error ? (
                    <ErrorBlock message={errorMessage(usuarios.error)} onRetry={usuarios.refetch} />
                ) : (
                    <Card>
                        <DataTable loading={usuarios.isLoading} rows={listaUsuarios} columns={colunasUsuarios} onRowClick={setUsuarioEdit} emptyTitle="Nenhum usuário" />
                    </Card>
                ))}

            {aba === 'equipes' &&
                (equipes.error ? (
                    <ErrorBlock message={errorMessage(equipes.error)} onRetry={equipes.refetch} />
                ) : (
                    <Card>
                        <DataTable
                            loading={equipes.isLoading}
                            rows={listaEquipes}
                            columns={colunasEquipes}
                            onRowClick={setEquipeEdit}
                            emptyTitle="Nenhuma equipe"
                            emptyDescription="Crie uma equipe e escolha o responsável; depois coloque os instaladores nela."
                        />
                    </Card>
                ))}

            {usuarioEdit && (
                <UsuarioDialog usuario={usuarioEdit === 'novo' ? null : usuarioEdit} equipes={listaEquipes.filter((e) => e.ativa)} onClose={() => setUsuarioEdit(null)} />
            )}
            {equipeEdit && (
                <EquipeDialog equipe={equipeEdit === 'nova' ? null : equipeEdit} pessoas={listaUsuarios.filter((u) => u.ativo)} onClose={() => setEquipeEdit(null)} />
            )}

            <ConfirmDialog
                open={Boolean(excluir)}
                title={excluir?.tipo === 'usuario' ? 'Excluir usuário' : 'Excluir equipe'}
                message={
                    excluir?.tipo === 'usuario'
                        ? 'Excluir este usuário? Se ele já tem registros, desative o acesso em vez de excluir.'
                        : 'Excluir esta equipe? Os integrantes ficam sem equipe.'
                }
                confirmLabel="Excluir"
                danger
                loading={remover.isPending}
                onConfirm={() => remover.mutate(excluir)}
                onClose={() => setExcluir(null)}
            />
        </Page>
    );
}
