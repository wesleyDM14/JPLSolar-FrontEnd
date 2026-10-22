import { api } from './client';

// Funções finas sobre a API. Retornam apenas os dados (response.data).
const data = (promise) => promise.then((response) => response.data);

// Remove filtros vazios para não poluir a query string.
const clean = (params = {}) =>
    Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null));

export const authApi = {
    login: (credentials) => data(api.post('/auth/login', credentials)),
    me: () => data(api.get('/auth/me')),
    updateMe: (payload) => data(api.put('/auth/me', payload)),
    changePassword: (payload) => api.put('/auth/me/senha', payload),
};

export const clientesApi = {
    list: (params) => data(api.get('/clientes', { params: clean(params) })),
    options: (search) => data(api.get('/clientes/opcoes', { params: clean({ search }) })),
    get: (id) => data(api.get(`/clientes/${id}`)),
    create: (payload) => data(api.post('/clientes', payload)),
    update: (id, payload) => data(api.put(`/clientes/${id}`, payload)),
    remove: (id) => api.delete(`/clientes/${id}`),
};

export const usinasApi = {
    list: (params) => data(api.get('/usinas', { params: clean(params) })),
    get: (id) => data(api.get(`/usinas/${id}`)),
    create: (payload) => data(api.post('/usinas', payload)),
    update: (id, payload) => data(api.put(`/usinas/${id}`, payload)),
    remove: (id) => api.delete(`/usinas/${id}`),
    atualizar: (id) => data(api.post(`/usinas/${id}/atualizar`)),
    acesso: (id) => data(api.get(`/usinas/${id}/acesso`)),
    monitoramento: (id) => data(api.get(`/usinas/${id}/monitoramento`)),
    erros: (id, params) => data(api.get(`/usinas/${id}/erros`, { params })),
    geracao: (id, params) => data(api.get(`/usinas/${id}/geracao`, { params })),
    relatorio: (id, ano) => api.post(`/usinas/${id}/relatorio`, { ano }, { responseType: 'blob' }),
};

export const contratosApi = {
    list: (params) => data(api.get('/contratos', { params: clean(params) })),
    get: (id) => data(api.get(`/contratos/${id}`)),
    create: (payload) => data(api.post('/contratos', payload)),
    update: (id, payload) => data(api.put(`/contratos/${id}`, payload)),
    updateStatus: (id, status, cancelarLancamentos = false) => data(api.patch(`/contratos/${id}/status`, { status, cancelarLancamentos })),
    remove: (id) => api.delete(`/contratos/${id}`),
    pdf: (id) => api.get(`/contratos/${id}/pdf`, { responseType: 'blob' }),
    promissoriaPdf: (id) => api.get(`/contratos/${id}/promissoria/pdf`, { responseType: 'blob' }),
};

export const documentosApi = {
    list: (params) => data(api.get('/documentos', { params: clean(params) })),
    upload: ({ arquivo, tipo, clienteId, contractId }) => {
        const form = new FormData();
        form.append('tipo', tipo);
        if (clienteId) form.append('clienteId', clienteId);
        if (contractId) form.append('contractId', contractId);
        form.append('arquivo', arquivo);
        return data(api.post('/documentos', form));
    },
    download: (id) => api.get(`/documentos/${id}/download`, { responseType: 'blob' }),
    remove: (id) => api.delete(`/documentos/${id}`),
};

/** Administração > Arquivos: o Drive da JPL dentro do sistema (somente administradores). */
export const arquivosAdminApi = {
    listar: (pasta) => data(api.get('/admin/arquivos', { params: clean({ pasta }) })),
    // Espaço ocupado na pasta da JPL e o limite (2 TB).
    uso: () => data(api.get('/admin/arquivos/uso')),
    criarPasta: (pai, nome) => data(api.post('/admin/arquivos/pastas', { pai: pai || undefined, nome })),
    // Devolve a pasta se já existe, ou cria (envio de pastas inteiras).
    garantirPasta: (pai, nome) => data(api.post('/admin/arquivos/pastas/garantir', { pai: pai || undefined, nome })),
    renomear: (id, nome) => data(api.patch(`/admin/arquivos/${id}`, { nome })),
    excluir: (id) => api.delete(`/admin/arquivos/${id}`),
    // Endereço de uso curto: o navegador baixa direto, com a própria barra de progresso.
    link: (id) => data(api.get(`/admin/arquivos/${id}/link`)),
    // Sem limite de tempo: backups grandes demoram. O progresso vem do navegador (bytes enviados).
    enviar: (pasta, arquivo, onProgress) => {
        const form = new FormData();
        form.append('arquivos', arquivo);
        return data(api.post('/admin/arquivos/enviar', form, { params: clean({ pasta }), timeout: 0, onUploadProgress: onProgress }));
    },
    /**
     * Arquivos grandes, sem limite por arquivo: o servidor abre uma sessão e o arquivo sobe em partes (32 MB). Cada parte
     * que falha é repetida sozinha, retomando de onde o servidor parou; uma queda de rede não obriga a recomeçar do zero.
     * `onProgresso(percentual)` recebe de 0 a 100.
     */
    enviarGrande: async (pasta, arquivo, onProgresso) => {
        const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));
        const sessao = await data(
            api.post('/admin/arquivos/enviar/sessao', {
                pasta: pasta || undefined,
                nome: arquivo.name,
                tamanho: arquivo.size,
                mimeType: arquivo.type || 'application/octet-stream',
            }),
        );
        const url = `/admin/arquivos/enviar/sessao/${sessao.sessao}`;

        let enviado = 0;
        let falhas = 0;
        while (enviado < arquivo.size) {
            const inicio = enviado;
            const fim = Math.min(inicio + sessao.tamanhoDaParte, arquivo.size);
            try {
                const resposta = await data(
                    api.put(url, arquivo.slice(inicio, fim), {
                        params: { inicio },
                        headers: { 'Content-Type': 'application/octet-stream' },
                        timeout: 0,
                        onUploadProgress: (evento) => onProgresso?.(Math.min(99, Math.round(((inicio + evento.loaded) / arquivo.size) * 100))),
                    }),
                );
                falhas = 0;
                enviado = resposta.enviado;
                if (resposta.concluido) {
                    onProgresso?.(100);
                    return resposta.concluido;
                }
            } catch (erro) {
                const status = erro.response?.status;
                const repetivel = !status || status >= 500 || status === 409;
                falhas += 1;
                if (!repetivel || falhas >= 6) throw erro;
                await pausa(1000 * falhas);
                // Pergunta ao servidor até onde ele realmente recebeu e continua dali.
                try {
                    const estado = await data(api.get(url));
                    if (estado.concluido) return estado.concluido;
                    enviado = estado.enviado;
                } catch (erroEstado) {
                    if (erroEstado.response?.status === 404) throw erro;
                }
            }
        }
        throw new Error('O envio terminou sem confirmação do servidor.');
    },
    /** Endereço completo do link de download devolvido por `link`. */
    enderecoDoLink: (caminho) => `${process.env.REACT_APP_BASE_URL}${caminho}`,
};

export const notificacoesApi = {
    list: (params) => data(api.get('/notificacoes', { params: clean(params) })),
    count: () => data(api.get('/notificacoes/contagem')),
    setRead: (id, isRead) => data(api.patch(`/notificacoes/${id}`, { isRead })),
    resumo: () => data(api.get('/notificacoes/resumo')),
    markAllRead: () => data(api.post('/notificacoes/marcar-todas-lidas')),
    limpar: (escopo) => data(api.delete('/notificacoes', { params: { escopo } })),
    remove: (id) => api.delete(`/notificacoes/${id}`),
    pushChave: () => data(api.get('/notificacoes/push/chave')),
    pushEstado: (endpoint) => data(api.post('/notificacoes/push/estado', { endpoint })),
    pushInscrever: (payload) => data(api.post('/notificacoes/push/inscrever', payload)),
    pushCancelar: (endpoint) => data(api.post('/notificacoes/push/cancelar', { endpoint })),
    pushTestar: () => data(api.post('/notificacoes/push/testar')),
};

export const tarefasApi = {
    columns: () => data(api.get('/colunas')),
    createColumn: (title) => data(api.post('/colunas', { title })),
    removeColumn: (id) => api.delete(`/colunas/${id}`),
    createTask: (payload) => data(api.post('/tarefas', payload)),
    updateTask: (id, payload) => data(api.put(`/tarefas/${id}`, payload)),
    removeTask: (id) => api.delete(`/tarefas/${id}`),
};

export const dashboardApi = {
    get: () => data(api.get('/dashboard')),
};

export const financeiroApi = {
    // Painel
    resumo: () => data(api.get('/financeiro/resumo')),
    fluxoCaixa: (params) => data(api.get('/financeiro/fluxo-caixa', { params: clean(params) })),
    fluxoCaixaMovimentos: (params) => data(api.get('/financeiro/fluxo-caixa/movimentos', { params: clean(params) })),

    // Lançamentos (a receber / a pagar)
    lancamentos: (params) => data(api.get('/financeiro/lancamentos', { params: clean(params) })),
    agrupado: (params) => data(api.get('/financeiro/lancamentos/agrupado', { params: clean(params) })),
    exportarCsv: (params) => api.get('/financeiro/lancamentos/exportar', { params: clean(params), responseType: 'blob' }),
    lancamento: (id) => data(api.get(`/financeiro/lancamentos/${id}`)),
    createLancamento: (payload) => data(api.post('/financeiro/lancamentos', payload)),
    updateLancamento: (id, payload) => data(api.put(`/financeiro/lancamentos/${id}`, payload)),
    removeLancamento: (id) => api.delete(`/financeiro/lancamentos/${id}`),
    cancelarLancamento: (id) => data(api.post(`/financeiro/lancamentos/${id}/cancelar`)),
    reabrirLancamento: (id) => data(api.post(`/financeiro/lancamentos/${id}/reabrir`)),

    // Baixas
    baixar: (id, payload) => data(api.post(`/financeiro/lancamentos/${id}/pagamentos`, payload)),
    estornar: (pagamentoId) => data(api.delete(`/financeiro/pagamentos/${pagamentoId}`)),

    // Boleto (Sicredi)
    emitirBoleto: (id, payload = {}) => data(api.post(`/financeiro/lancamentos/${id}/boleto`, payload)),
    boletoPdf: (id) => api.get(`/financeiro/lancamentos/${id}/boleto/pdf`, { responseType: 'blob' }),
    boleto: (id) => data(api.get(`/financeiro/lancamentos/${id}/boleto`)),
    atualizarBoleto: (id) => data(api.post(`/financeiro/lancamentos/${id}/boleto/atualizar`)),
    comandoBoleto: (id, payload) => data(api.post(`/financeiro/lancamentos/${id}/boleto/comando`, payload)),
    boletosEmLote: (payload) => data(api.post('/financeiro/boletos/lote', payload)),
    boletos: (params) => data(api.get('/financeiro/boletos', { params: clean(params) })),
    boletosResumo: () => data(api.get('/financeiro/boletos/resumo')),

    // Boletos conhecidos no banco (inclusive os emitidos fora do sistema)
    contratoParcelas: (contratoId) => data(api.get(`/financeiro/contratos/${contratoId}/parcelas`)),
    boletosBanco: (params) => data(api.get('/financeiro/boletos/banco', { params: clean(params) })),
    boletosBancoResumo: () => data(api.get('/financeiro/boletos/banco/resumo')),
    boletoBancoSugestoes: (nossoNumero) => data(api.get(`/financeiro/boletos/banco/${nossoNumero}/sugestoes`)),
    boletoBancoAtualizar: (nossoNumero) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/atualizar`)),
    vinculosAutomaticos: () => data(api.get('/financeiro/boletos/banco/vinculos-automaticos')),
    aplicarVinculosAutomaticos: (pares) => data(api.post('/financeiro/boletos/banco/vinculos-automaticos', { pares })),
    boletoBancoComando: (nossoNumero, payload) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/comando`, payload)),
    boletoBancoPdf: (nossoNumero) => api.get(`/financeiro/boletos/banco/${nossoNumero}/pdf`, { responseType: 'blob' }),
    boletoBancoVincular: (nossoNumero, payload) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/vincular`, payload)),
    boletoBancoOcultar: (nossoNumero, ocultar) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/ocultar`, { ocultar })),
    boletoBancoDesvincular: (nossoNumero) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/desvincular`)),
    boletoBancoCriarLancamento: (nossoNumero, payload = {}) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/criar-lancamento`, payload)),

    // Visão 360° do cliente (usinas, contratos e financeiro)
    visaoCliente: (id) => data(api.get(`/financeiro/clientes/${id}/visao`)),

    // Parcelas de contrato
    calculoQuitacao: (contratoId, params) => data(api.get(`/financeiro/contratos/${contratoId}/quitacao/calculo`, { params: clean(params) })),
    gerarBoletoQuitacao: (contratoId, payload) => data(api.post(`/financeiro/contratos/${contratoId}/quitacao/boleto`, payload)),
    quitarContrato: (contratoId, payload) => data(api.post(`/financeiro/contratos/${contratoId}/quitar`, payload)),
    gerarParcelas: (contratoId, payload = {}) => data(api.post(`/financeiro/contratos/${contratoId}/gerar-parcelas`, payload)),

    // Análises e relatórios
    dre: (params) => data(api.get('/financeiro/analise/dre', { params: clean(params) })),
    indicadores: (params) => data(api.get('/financeiro/analise/indicadores', { params: clean(params) })),
    aging: () => data(api.get('/financeiro/analise/aging')),
    clientesRisco: (todos = false) => data(api.get('/financeiro/analise/clientes-risco', { params: todos ? { todos: 'true' } : {} })),
    relatorio: (tipo, params) => data(api.get(`/financeiro/relatorios/${tipo}`, { params: clean(params) })),
    relatorioArquivo: (tipo, params, formato) => api.get(`/financeiro/relatorios/${tipo}`, { params: clean({ ...params, formato }), responseType: 'blob' }),
    pacoteContabil: (mes) => api.get('/financeiro/relatorios/pacote-contabil', { params: { mes }, responseType: 'blob' }),

    // Cadastros
    contasFinanceiras: () => data(api.get('/financeiro/contas-financeiras')),
    createContaFinanceira: (payload) => data(api.post('/financeiro/contas-financeiras', payload)),
    updateContaFinanceira: (id, payload) => data(api.put(`/financeiro/contas-financeiras/${id}`, payload)),
    removeContaFinanceira: (id) => api.delete(`/financeiro/contas-financeiras/${id}`),
    categorias: (params) => data(api.get('/financeiro/categorias', { params: clean(params) })),
    createCategoria: (payload) => data(api.post('/financeiro/categorias', payload)),
    updateCategoria: (id, payload) => data(api.put(`/financeiro/categorias/${id}`, payload)),
    removeCategoria: (id) => api.delete(`/financeiro/categorias/${id}`),
    fornecedores: (params) => data(api.get('/financeiro/fornecedores', { params: clean(params) })),
    createFornecedor: (payload) => data(api.post('/financeiro/fornecedores', payload)),
    updateFornecedor: (id, payload) => data(api.put(`/financeiro/fornecedores/${id}`, payload)),
    removeFornecedor: (id) => api.delete(`/financeiro/fornecedores/${id}`),

    // Integração Sicredi (credenciais da conta de cobrança)
    conta: () => data(api.get('/financeiro/conta')),
    createConta: (payload) => data(api.post('/financeiro/conta', payload)),
    updateConta: (id, payload) => data(api.put(`/financeiro/conta/${id}`, payload)),
    removeConta: (id) => api.delete(`/financeiro/conta/${id}`),
};

/** Baixa um blob (PDF/arquivo) no navegador. */
/** Salva a resposta com o nome do servidor (Content-Disposition); sem ele, usa o nome de reserva. */
export function saveResponse(resposta, reserva) {
    saveBlob(resposta.data, nomeDoCabecalho(resposta.headers?.['content-disposition']) ?? reserva);
}

export function saveBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

/** Lê o nome do arquivo do cabeçalho Content-Disposition (filename*=UTF-8''… ou filename="…"). */
function nomeDoCabecalho(cabecalho) {
    if (!cabecalho) return null;
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cabecalho);
    if (utf8) {
        try {
            return decodeURIComponent(utf8[1]);
        } catch {
            // segue para o nome simples
        }
    }
    const simples = /filename="?([^";]+)"?/i.exec(cabecalho);
    return simples ? simples[1] : null;
}

/** Guarda o arquivo no servidor por alguns minutos e devolve um endereço terminado pelo nome. */
async function enderecoComNome(arquivo, nome) {
    try {
        const resposta = await api.post('/arquivos/temporario', arquivo, { params: { nome }, headers: { 'Content-Type': arquivo.type || 'application/pdf' } });
        return `${process.env.REACT_APP_BASE_URL}${resposta.data.caminho}`;
    } catch {
        return null;
    }
}

/**
 * Abre um arquivo (PDF/imagem) numa nova aba em vez de baixá-lo.
 * A aba é aberta já no clique — depois de um `await` o navegador a trataria como pop-up e bloquearia —
 * e recebe o arquivo quando a geração termina. Se o pop-up estiver bloqueado, cai no download.
 *
 * @param {() => Promise<{ data: Blob }>} load faz a requisição (responseType: blob)
 */
export async function openFileInTab(load, filename, message = 'Gerando documento…') {
    const tab = window.open('', '_blank');

    if (tab) {
        try {
            tab.document.title = message;
            tab.document.body.style.cssText = 'font-family: system-ui, sans-serif; padding: 24px; color: #444;';
            tab.document.body.textContent = `${message} Aguarde um instante.`;
        } catch {
            // aba de outra origem ou já fechada: segue sem a mensagem
        }
    }

    try {
        const response = await load();
        const blob = response.data;
        const nome = nomeDoCabecalho(response.headers?.['content-disposition']) || filename;
        const arquivo = blob.type ? blob : new Blob([blob], { type: 'application/pdf' });

        if (tab && !tab.closed) {
            // Endereço do próprio servidor com o nome do arquivo no final: a aba e o "salvar como" saem com o nome certo.
            const endereco = await enderecoComNome(arquivo, nome);

            if (endereco) {
                tab.location.href = endereco;
            } else {
                const url = window.URL.createObjectURL(arquivo);
                tab.location.href = url;
                setTimeout(() => window.URL.revokeObjectURL(url), 5 * 60 * 1000);
            }
        } else {
            // O usuário fechou a aba (ou o pop-up foi bloqueado): entrega como download.
            saveBlob(arquivo, nome);
        }
    } catch (error) {
        if (tab) tab.close();

        // Com responseType 'blob' a mensagem de erro da API chega como Blob; converte para o errorMessage() ler.
        const body = error?.response?.data;
        if (body instanceof Blob) {
            try {
                error.response.data = JSON.parse(await body.text());
            } catch {
                // mantém o corpo original
            }
        }

        throw error;
    }
}

// ── Serviços em campo, equipes e usuários ───────────────────────────────────
export const usuariosApi = {
    listar: () => data(api.get('/usuarios')),
    criar: (payload) => data(api.post('/usuarios', payload)),
    atualizar: (id, payload) => data(api.put(`/usuarios/${id}`, payload)),
    remover: (id) => api.delete(`/usuarios/${id}`),
};

export const equipesApi = {
    listar: () => data(api.get('/equipes')),
    criar: (payload) => data(api.post('/equipes', payload)),
    atualizar: (id, payload) => data(api.put(`/equipes/${id}`, payload)),
    remover: (id) => api.delete(`/equipes/${id}`),
};

export const modelosServicoApi = {
    listar: (ativos) => data(api.get('/modelos-servico', { params: clean({ ativos: ativos ? 'true' : undefined }) })),
    obter: (id) => data(api.get(`/modelos-servico/${id}`)),
    criar: (payload) => data(api.post('/modelos-servico', payload)),
    atualizar: (id, payload) => data(api.put(`/modelos-servico/${id}`, payload)),
    remover: (id) => api.delete(`/modelos-servico/${id}`),
};

export const servicosApi = {
    listar: (params) => data(api.get('/servicos', { params: clean(params) })),
    obter: (id) => data(api.get(`/servicos/${id}`)),
    pessoas: () => data(api.get('/servicos/pessoas')),
    agenda: (params) => data(api.get('/servicos/agenda', { params: clean(params) })),
    iniciarDoContrato: (contratoId, payload) => data(api.post(`/servicos/contratos/${contratoId}/iniciar`, payload)),
    criarAvulso: (payload) => data(api.post('/servicos/avulso', payload)),
    atualizar: (id, payload) => data(api.put(`/servicos/${id}`, payload)),
    cancelar: (id) => data(api.post(`/servicos/${id}/cancelar`)),
    adicionarEtapa: (id, payload) => data(api.post(`/servicos/${id}/etapas`, payload)),
    atualizarEtapa: (etapaId, payload) => data(api.put(`/servicos/etapas/${etapaId}`, payload)),
};

/**
 * Execução de uma tarefa de campo (checklist, fotos e arquivos). São as mesmas rotas do aplicativo dos instaladores:
 * o administrador pode preencher qualquer tarefa pelo computador.
 */
export const execucaoApi = {
    etapa: (etapaId) => data(api.get(`/app/etapas/${etapaId}`)),
    iniciar: (etapaId) => data(api.post(`/app/etapas/${etapaId}/iniciar`)),
    salvarItem: (etapaId, itemId, valor) => data(api.put(`/app/etapas/${etapaId}/itens/${itemId}`, valor)),
    anexar: (etapaId, arquivo, { itemId, categoria } = {}) => {
        const form = new FormData();
        form.append('arquivo', arquivo);
        if (itemId) form.append('itemId', itemId);
        if (categoria) form.append('categoria', categoria);
        return data(api.post(`/app/etapas/${etapaId}/anexos`, form, { timeout: 120000 }));
    },
    removerAnexo: (anexoId) => data(api.delete(`/app/anexos/${anexoId}`)),
    concluir: (etapaId, observacoes) => data(api.post(`/app/etapas/${etapaId}/concluir`, { observacoes: observacoes || null })),
};

export const fiscalApi = {
    configuracao: () => data(api.get('/fiscal/configuracao')),
    salvarConfiguracao: (payload) => data(api.put('/fiscal/configuracao', payload)),
    resumo: (mes) => data(api.get('/fiscal/resumo', { params: clean({ mes }) })),
    notas: (params) => data(api.get('/fiscal/notas', { params: clean(params) })),
    nota: (id) => data(api.get(`/fiscal/notas/${id}`)),
    criarNota: (payload) => data(api.post('/fiscal/notas', payload)),
    atualizarNota: (id, payload) => data(api.put(`/fiscal/notas/${id}`, payload)),
    excluirNota: (id) => api.delete(`/fiscal/notas/${id}`),
    importarXml: (payload) => data(api.post('/fiscal/notas/importar-xml', payload)),
    xml: (id) => api.get(`/fiscal/notas/${id}/xml`, { responseType: 'blob' }),
    espelho: (id) => api.get(`/fiscal/notas/${id}/espelho`, { responseType: 'blob' }),
    xmlEmLote: (params) => api.get('/fiscal/notas/xml-lote', { params: clean(params), responseType: 'blob' }),
    envios: () => data(api.get('/fiscal/envios')),
    enviarContador: (payload) => data(api.post('/fiscal/enviar-contador', payload)),
    // NFS-e (emissão pelo webservice da prefeitura)
    enviarCertificado: (payload) => data(api.post('/fiscal/nfse/certificado', payload)),
    removerCertificado: () => data(api.delete('/fiscal/nfse/certificado')),
    testarNfse: (ambiente) => data(api.post('/fiscal/nfse/testar', { ambiente })),
    buscarNotas: (payload) => data(api.post('/fiscal/nfse/buscar', payload)),
    emitirNfse: (payload) => data(api.post('/fiscal/notas/emitir', payload)),
    consultarNfse: (id) => data(api.post(`/fiscal/notas/${id}/consultar`)),
    cancelarNfse: (id, codigo) => data(api.post(`/fiscal/notas/${id}/cancelar`, { codigo })),
    reenviarNfse: (id, payload) => data(api.post(`/fiscal/notas/${id}/reenviar`, payload)),
    substituirNfse: (id, payload) => data(api.post(`/fiscal/notas/${id}/substituir`, payload)),
    inutilizarNfse: (id, motivo) => data(api.post(`/fiscal/notas/${id}/inutilizar`, { motivo })),
    // Catálogo de atividades de serviço
    atividades: (params) => data(api.get('/fiscal/atividades', { params: clean(params) })),
    criarAtividade: (payload) => data(api.post('/fiscal/atividades', payload)),
    atualizarAtividade: (id, payload) => data(api.put(`/fiscal/atividades/${id}`, payload)),
    atividadePadrao: (id) => data(api.post(`/fiscal/atividades/${id}/padrao`)),
    excluirAtividade: (id) => api.delete(`/fiscal/atividades/${id}`),
    // Reforma Tributária (Anexos VII e VIII)
    rtcItens: (search) => data(api.get('/fiscal/rtc/itens', { params: clean({ search }) })),
    rtcItem: (item) => data(api.get(`/fiscal/rtc/itens/${encodeURIComponent(item)}`)),
    classificarAtividades: () => data(api.post('/fiscal/atividades/classificar')),
    // CNAEs do cadastro da empresa
    cnaes: () => data(api.get('/fiscal/cnaes')),
    criarCnae: (payload) => data(api.post('/fiscal/cnaes', payload)),
    atualizarCnae: (id, payload) => data(api.put(`/fiscal/cnaes/${id}`, payload)),
    excluirCnae: (id) => api.delete(`/fiscal/cnaes/${id}`),
    importarCnaes: (texto) => data(api.post('/fiscal/cnaes/importar', { texto })),
};

export const bancosApi = {
    listar: () => data(api.get('/bancos')),
    criar: (payload) => data(api.post('/bancos', payload)),
    atualizar: (id, payload) => data(api.put(`/bancos/${id}`, payload)),
    remover: (id) => api.delete(`/bancos/${id}`),
    testar: (id) => data(api.post(`/bancos/${id}/testar`)),
};

/** Integração com o Sicredi: estado, conciliação e consultas diretas ao banco. */
export const sicrediApi = {
    status: () => data(api.get('/sicredi/status')),
    sincronizar: (payload) => data(api.post('/sicredi/sincronizar', payload)),
    liquidados: (dia, pagina = 0) => data(api.get('/sicredi/liquidados', { params: { dia, pagina } })),
    movimentacoes: (dia, tipo = 'AMBOS', pagina = 0) => data(api.get('/sicredi/movimentacoes', { params: { dia, tipo, pagina } })),
    eventos: () => data(api.get('/sicredi/eventos')),
    consultarBoleto: (params) => data(api.get('/sicredi/boletos/consulta', { params: clean(params) })),
    homologacao: (payload) => data(api.post('/sicredi/homologacao', payload)),
    descoberta: () => data(api.get('/sicredi/descoberta')),
    iniciarDescoberta: (payload = {}) => data(api.post('/sicredi/descoberta', payload)),
    cancelarDescoberta: () => data(api.post('/sicredi/descoberta/cancelar')),
};

/**
 * Junta os PDFs dos boletos em um arquivo só e abre em nova aba (um boleto por página, pronto para imprimir).
 * Devolve a lista de boletos que ficaram de fora (já pagos, sem PDF…).
 */
export async function imprimirBoletos(ids, porFolha = 3) {
    return imprimirLote('/financeiro/boletos/pdf-lote', { ids, porFolha });
}

/** Igual a imprimirBoletos, mas para boletos do banco (pelo nosso número). */
export async function imprimirBoletosDoBanco(nossosNumeros, porFolha = 3) {
    return imprimirLote('/financeiro/boletos/banco/pdf-lote', { nossosNumeros, porFolha });
}

async function imprimirLote(url, corpo) {
    let falhas = [];

    await openFileInTab(
        async () => {
            const resposta = await api.post(url, corpo, { responseType: 'blob' });
            try {
                falhas = JSON.parse(decodeURIComponent(resposta.headers['x-boletos-falhas'] ?? '[]'));
            } catch {
                falhas = [];
            }
            return resposta;
        },
        'boletos.pdf',
        'Reunindo os boletos…',
    );

    return falhas;
}
