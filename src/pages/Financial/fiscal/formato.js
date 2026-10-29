// Apresentação dos tipos e situações das notas fiscais (compartilhado pelas telas fiscais).

export const TIPOS_NOTA = {
    NFE: { rotulo: 'NF-e', completo: 'NF-e · produtos', tom: 'blue' },
    NFSE: { rotulo: 'NFS-e', completo: 'NFS-e · serviços', tom: 'purple' },
    NFCE: { rotulo: 'NFC-e', completo: 'NFC-e · consumidor', tom: 'teal' },
};

export const STATUS_NOTA = {
    RASCUNHO: { rotulo: 'Rascunho', tom: 'neutral' },
    PENDENTE: { rotulo: 'Pendente', tom: 'warning' },
    AUTORIZADA: { rotulo: 'Autorizada', tom: 'success' },
    CANCELADA: { rotulo: 'Cancelada', tom: 'danger' },
    REJEITADA: { rotulo: 'Rejeitada', tom: 'danger' },
    INUTILIZADA: { rotulo: 'Inutilizada', tom: 'neutral' },
};

export const tipoOptions = Object.entries(TIPOS_NOTA).map(([value, info]) => ({ value, label: info.completo }));
export const statusOptions = Object.entries(STATUS_NOTA).map(([value, info]) => ({ value, label: info.rotulo }));
export const direcaoOptions = [
    { value: 'SAIDA', label: 'Saída (emitidas)' },
    { value: 'ENTRADA', label: 'Entrada (recebidas)' },
];

export const REGIMES = [
    { value: 'MEI', label: 'MEI' },
    { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
    { value: 'LUCRO_PRESUMIDO', label: 'Lucro presumido' },
    { value: 'LUCRO_REAL', label: 'Lucro real' },
];

export const PROVEDORES_NFSE = [
    { value: 'NACIONAL', label: 'Emissor Nacional (obrigatório para Simples Nacional desde 01/11/2026)' },
    { value: 'MUNICIPAL', label: 'Webservice da prefeitura' },
];

export const AMBIENTES = [
    { value: 'HOMOLOGACAO', label: 'Homologação (testes)' },
    { value: 'PRODUCAO', label: 'Produção' },
];
