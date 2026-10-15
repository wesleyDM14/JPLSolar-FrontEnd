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
    updateStatus: (id, status) => data(api.patch(`/contratos/${id}/status`, { status })),
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

export const notificacoesApi = {
    list: (params) => data(api.get('/notificacoes', { params: clean(params) })),
    count: () => data(api.get('/notificacoes/contagem')),
    setRead: (id, isRead) => data(api.patch(`/notificacoes/${id}`, { isRead })),
    resumo: () => data(api.get('/notificacoes/resumo')),
    markAllRead: () => data(api.post('/notificacoes/marcar-todas-lidas')),
    limpar: (escopo) => data(api.delete('/notificacoes', { params: { escopo } })),
    remove: (id) => api.delete(`/notificacoes/${id}`),
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
    boletosBanco: (params) => data(api.get('/financeiro/boletos/banco', { params: clean(params) })),
    boletosBancoResumo: () => data(api.get('/financeiro/boletos/banco/resumo')),
    boletoBancoSugestoes: (nossoNumero) => data(api.get(`/financeiro/boletos/banco/${nossoNumero}/sugestoes`)),
    boletoBancoAtualizar: (nossoNumero) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/atualizar`)),
    boletoBancoVincular: (nossoNumero, payload) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/vincular`, payload)),
    boletoBancoDesvincular: (nossoNumero) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/desvincular`)),
    boletoBancoCriarLancamento: (nossoNumero, payload = {}) => data(api.post(`/financeiro/boletos/banco/${nossoNumero}/criar-lancamento`, payload)),

    // Visão 360° do cliente (usinas, contratos e financeiro)
    visaoCliente: (id) => data(api.get(`/financeiro/clientes/${id}/visao`)),

    // Parcelas de contrato
    gerarParcelas: (contratoId, payload = {}) => data(api.post(`/financeiro/contratos/${contratoId}/gerar-parcelas`, payload)),

    // Análises e relatórios
    dre: (params) => data(api.get('/financeiro/analise/dre', { params: clean(params) })),
    indicadores: (params) => data(api.get('/financeiro/analise/indicadores', { params: clean(params) })),
    aging: () => data(api.get('/financeiro/analise/aging')),
    clientesRisco: () => data(api.get('/financeiro/analise/clientes-risco')),
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
        const url = window.URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: 'application/pdf' }));

        if (tab && !tab.closed) {
            tab.location.href = url;
        } else {
            // O usuário fechou a aba (ou o pop-up foi bloqueado): entrega como download.
            saveBlob(blob, filename);
        }

        // Dá tempo de a aba carregar o blob antes de liberar a memória.
        setTimeout(() => window.URL.revokeObjectURL(url), 5 * 60 * 1000);
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
    emitirNfse: (payload) => data(api.post('/fiscal/notas/emitir', payload)),
    consultarNfse: (id) => data(api.post(`/fiscal/notas/${id}/consultar`)),
    cancelarNfse: (id, codigo) => data(api.post(`/fiscal/notas/${id}/cancelar`, { codigo })),
    substituirNfse: (id, payload) => data(api.post(`/fiscal/notas/${id}/substituir`, payload)),
    inutilizarNfse: (id, motivo) => data(api.post(`/fiscal/notas/${id}/inutilizar`, { motivo })),
    inutilizarNumeracao: (payload) => data(api.post('/fiscal/nfse/inutilizar-numeracao', payload)),
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
export async function imprimirBoletos(ids, porFolha = 1) {
    return imprimirLote('/financeiro/boletos/pdf-lote', { ids, porFolha });
}

/** Igual a imprimirBoletos, mas para boletos do banco (pelo nosso número). */
export async function imprimirBoletosDoBanco(nossosNumeros, porFolha = 1) {
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
