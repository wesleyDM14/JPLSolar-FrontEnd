// Apresentação dos serviços de campo (compartilhado pelas telas de serviços).

export const STATUS_SERVICO = {
    PLANEJADO: { rotulo: 'Planejado', tom: 'neutral' },
    EM_ANDAMENTO: { rotulo: 'Em andamento', tom: 'info' },
    CONCLUIDO: { rotulo: 'Concluído', tom: 'success' },
    CANCELADO: { rotulo: 'Cancelado', tom: 'danger' },
};

export const STATUS_ETAPA = {
    PENDENTE: { rotulo: 'Pendente', tom: 'neutral' },
    AGENDADA: { rotulo: 'Agendada', tom: 'warning' },
    EM_ANDAMENTO: { rotulo: 'Em andamento', tom: 'info' },
    CONCLUIDA: { rotulo: 'Concluída', tom: 'success' },
    CANCELADA: { rotulo: 'Cancelada', tom: 'danger' },
};

export const TIPOS_ETAPA = [
    { value: 'VISITA_TECNICA', label: 'Visita técnica' },
    { value: 'AQUISICAO_MATERIAIS', label: 'Aquisição de materiais' },
    { value: 'INSTALACAO', label: 'Instalação' },
    { value: 'CONFERENCIA', label: 'Conferência' },
    { value: 'VISTORIA', label: 'Vistoria / homologação' },
    { value: 'LIMPEZA', label: 'Limpeza' },
    { value: 'MANUTENCAO', label: 'Manutenção' },
    { value: 'OUTRO', label: 'Outro' },
];

export const TIPOS_ITEM = [
    { value: 'FOTO', label: 'Foto' },
    { value: 'ARQUIVO', label: 'Arquivo / relatório (PDF)' },
    { value: 'TEXTO', label: 'Texto' },
    { value: 'NUMERO', label: 'Número' },
    { value: 'SIM_NAO', label: 'Sim / não' },
];

export const rotuloTipoEtapa = (valor) => TIPOS_ETAPA.find((t) => t.value === valor)?.label ?? valor;
export const rotuloTipoItem = (valor) => TIPOS_ITEM.find((t) => t.value === valor)?.label ?? valor;

/** Valor de <input type="datetime-local"> a partir de uma data ISO (horário local do navegador). */
export function paraInputDataHora(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Valor de <input type="date"> a partir de uma data ISO. */
export function paraInputData(iso) {
    return iso ? String(iso).slice(0, 10) : '';
}
