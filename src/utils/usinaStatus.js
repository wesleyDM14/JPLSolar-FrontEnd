// Estado normalizado da usina, calculado no servidor (monitoramento) a partir do código de cada portal.
//   ONLINE ........ gerando
//   STANDBY ....... em espera (sem sol)
//   OFFLINE ....... sem comunicação com o portal (internet/datalogger) — laranja
//   ALERTA ........ o inversor reportou defeito — vermelho
//   SEM_LEITURA ... o sistema não conseguiu consultar o portal
const STATUS = {
    ONLINE: { label: 'Online', tone: 'success', ok: true, severity: 3 },
    STANDBY: { label: 'Standby', tone: 'info', ok: true, severity: 3 },
    OFFLINE: { label: 'Offline', tone: 'warning', ok: false, severity: 1, hint: 'Sem comunicação com o portal (verifique a internet do cliente)' },
    ALERTA: { label: 'Alerta', tone: 'danger', ok: false, severity: 0, hint: 'O inversor reportou defeito' },
    SEM_LEITURA: { label: 'Sem leitura', tone: 'neutral', ok: false, severity: 2, hint: 'Não foi possível consultar o portal do fabricante' },
};

export function usinaStatus(status) {
    return STATUS[status] ?? STATUS.SEM_LEITURA;
}

export const statusFilterOptions = [
    { value: 'ONLINE', label: 'Online' },
    { value: 'STANDBY', label: 'Standby' },
    { value: 'OFFLINE', label: 'Offline' },
    { value: 'ALERTA', label: 'Alerta' },
    { value: 'SEM_LEITURA', label: 'Sem leitura' },
];

/** "há 5 min", "há 3 h", "há 2 dias" a partir de uma data ISO. */
export function tempoDesde(valor, agora = Date.now()) {
    if (!valor) return '';
    const minutos = Math.max(0, Math.round((agora - new Date(valor).getTime()) / 60000));
    if (Number.isNaN(minutos)) return '';
    if (minutos < 1) return 'agora';
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `há ${horas} h`;
    const dias = Math.round(horas / 24);
    return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}
