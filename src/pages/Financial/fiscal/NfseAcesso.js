import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCertificate, FaCheckCircle, FaExclamationTriangle, FaPlug, FaTrash, FaUpload } from 'react-icons/fa';
import { errorMessage } from '../../../api/client';
import { fiscalApi } from '../../../api/resources';
import { Badge, Button, Card, ConfirmDialog, Field, Grid, Input, Muted, Row, SectionTitle, tokens } from '../../../ui';
import { formatDate } from '../../../utils/masks';

const lerBase64 = (arquivo) =>
    new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        leitor.onload = () => resolve(String(leitor.result).split(',')[1] ?? '');
        leitor.readAsDataURL(arquivo);
    });

const semEnter = (evento) => {
    if (evento.key === 'Enter') evento.preventDefault();
};

const ROTULO = { HOMOLOGACAO: 'homologação', PRODUCAO: 'produção' };

/** Situação da emissão de NFS-e: certificado A1 e teste de conexão de cada ambiente. */
export default function NfseAcesso({ nfse }) {
    const queryClient = useQueryClient();
    const entrada = useRef(null);
    const [arquivo, setArquivo] = useState(null);
    const [senha, setSenha] = useState('');
    const [removerCert, setRemoverCert] = useState(false);
    const [teste, setTeste] = useState(null);

    const atualizar = () => queryClient.invalidateQueries({ queryKey: ['fiscal'] });

    const enviarCert = useMutation({
        mutationFn: async () => fiscalApi.enviarCertificado({ pfxBase64: await lerBase64(arquivo), senha }),
        onSuccess: async (resultado) => {
            await atualizar();
            setArquivo(null);
            setSenha('');
            if (entrada.current) entrada.current.value = '';
            toast.success(`Certificado de ${resultado.certificado.titular} salvo.`);
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const apagarCert = useMutation({
        mutationFn: () => fiscalApi.removerCertificado(),
        onSuccess: async () => {
            await atualizar();
            setRemoverCert(false);
            toast.success('Certificado removido.');
        },
        onError: (erro) => {
            setRemoverCert(false);
            toast.error(errorMessage(erro));
        },
    });

    const testar = useMutation({
        mutationFn: (ambiente) => fiscalApi.testarNfse(ambiente),
        onMutate: () => setTeste(null),
        onSuccess: (resultado) => setTeste({ ok: true, ...resultado }),
        onError: (erro, ambiente) => setTeste({ ok: false, ambiente, mensagem: errorMessage(erro) }),
    });

    const certificado = nfse?.certificado;
    const doServidor = certificado?.origem === 'AMBIENTE';
    const vencido = certificado?.validade && new Date(certificado.validade) < new Date();

    const botaoTeste = (ambiente) => (
        <Button
            key={ambiente}
            type="button"
            variant={ambiente === 'PRODUCAO' ? 'secondary' : 'primary'}
            icon={<FaPlug />}
            loading={testar.isPending && testar.variables === ambiente}
            disabled={testar.isPending || !nfse?.ambientes?.[ambiente]?.pronto}
            onClick={() => testar.mutate(ambiente)}
        >
            Testar {ROTULO[ambiente]}
        </Button>
    );

    return (
        <Card>
            <SectionTitle
                icon={FaCertificate}
                tom="orange"
                aside={nfse?.pronto ? <Badge $tone="success">Pronta para emitir ({ROTULO[nfse.ambiente]})</Badge> : <Badge $tone="warning">Configuração incompleta</Badge>}
            >
                Emissão de NFS-e (prefeitura)
            </SectionTitle>

            {nfse && !nfse.pronto && (
                <p style={{ margin: '0 0 14px' }}>
                    <Muted><FaExclamationTriangle style={{ verticalAlign: '-2px' }} /> Falta: {nfse.pendencias.join('; ')}.</Muted>
                </p>
            )}

            <Grid $cols={2}>
                <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
                    <strong>Conexão com a prefeitura</strong>
                    <Row>{['HOMOLOGACAO', 'PRODUCAO'].map(botaoTeste)}</Row>
                </div>

                <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                    <strong>Certificado digital A1 (.pfx)</strong>
                    {certificado ? (
                        <Row>
                            <Badge $tone={vencido ? 'danger' : 'success'}>{vencido ? 'Vencido' : 'Válido'}</Badge>
                            <span>{certificado.nome}</span>
                            <Muted>até {certificado.validade ? formatDate(certificado.validade) : '—'}</Muted>
                            {!doServidor && (
                                <Button type="button" variant="secondary" size="sm" icon={<FaTrash />} onClick={() => setRemoverCert(true)}>Remover</Button>
                            )}
                        </Row>
                    ) : (
                        <Muted>Nenhum certificado configurado.</Muted>
                    )}

                    {!doServidor && (
                        <>
                            <Field label={certificado ? 'Trocar certificado' : 'Arquivo do certificado'}>
                                <Input ref={entrada} type="file" accept=".pfx,.p12,application/x-pkcs12" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} onKeyDown={semEnter} />
                            </Field>
                            <Field label="Senha do certificado">
                                <Input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={semEnter} />
                            </Field>
                            <div>
                                <Button type="button" icon={<FaUpload />} loading={enviarCert.isPending} disabled={!arquivo || !senha} onClick={() => enviarCert.mutate()}>
                                    Enviar certificado
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Grid>

            {teste && (
                <div
                    role="status"
                    style={{
                        marginTop: 16,
                        padding: 12,
                        borderRadius: 10,
                        background: teste.ok ? tokens.colors.successBg : tokens.colors.dangerBg,
                        color: teste.ok ? tokens.colors.success : tokens.colors.danger,
                    }}
                >
                    <strong>
                        {teste.ok ? <FaCheckCircle style={{ verticalAlign: '-2px' }} /> : <FaExclamationTriangle style={{ verticalAlign: '-2px' }} />}{' '}
                        {teste.ok ? `Conexão com a prefeitura funcionando (${ROTULO[teste.ambiente]}).` : `Falha no teste de ${ROTULO[teste.ambiente]}: ${teste.mensagem}`}
                    </strong>
                    {teste.ok && (
                        <div style={{ color: 'inherit', fontSize: '0.9rem' }}>
                            Certificado de {teste.certificado.titular}, válido até {formatDate(teste.certificado.validoAte)}.
                            {teste.mensagens.map((m) => (
                                <div key={`${m.codigo}${m.mensagem}`}>Retorno da prefeitura: {m.codigo} — {m.mensagem}</div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                open={removerCert}
                title="Remover certificado"
                message="Sem o certificado não é possível emitir notas pelo sistema. Deseja remover?"
                confirmLabel="Remover"
                danger
                loading={apagarCert.isPending}
                onConfirm={() => apagarCert.mutate()}
                onClose={() => setRemoverCert(false)}
            />
        </Card>
    );
}
