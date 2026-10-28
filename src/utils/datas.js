// Datas e períodos sempre no horário de Brasília/Fortaleza (UTC-3), nunca no UTC nem no fuso do navegador.
// Datas "de calendário" trafegam como texto AAAA-MM-DD; cálculos usam UTC só para somar dias/meses sem
// efeito de horário de verão.

export const FUSO_HORARIO = 'America/Fortaleza';

const doIso = (iso) => new Date(`${iso}T00:00:00.000Z`);
const paraIso = (data) => data.toISOString().slice(0, 10);

/** Data de hoje (AAAA-MM-DD) no fuso de Brasília. */
export const hojeIso = () => new Date().toLocaleDateString('en-CA', { timeZone: FUSO_HORARIO });

/** Dia (AAAA-MM-DD) de um instante qualquer, no fuso de Brasília. */
export const isoBr = (instante) => new Date(instante).toLocaleDateString('en-CA', { timeZone: FUSO_HORARIO });

export const mesAtual = () => hojeIso().slice(0, 7);
export const anoAtual = () => Number(hojeIso().slice(0, 4));

export function somarDias(iso, dias) {
    const data = doIso(iso);
    data.setUTCDate(data.getUTCDate() + dias);
    return paraIso(data);
}

export function somarMeses(iso, meses) {
    const [ano, mes, dia] = iso.split('-').map(Number);
    const ultimo = new Date(Date.UTC(ano, mes - 1 + meses + 1, 0)).getUTCDate();
    return paraIso(new Date(Date.UTC(ano, mes - 1 + meses, Math.min(dia, ultimo))));
}

/** Soma meses a uma chave AAAA-MM. */
export const somarMesesChave = (chave, quantidade) => somarMeses(`${chave}-01`, quantidade).slice(0, 7);

export const inicioDoMes = (iso) => `${iso.slice(0, 7)}-01`;
export const fimDoMes = (iso) => {
    const [ano, mes] = iso.split('-').map(Number);
    return paraIso(new Date(Date.UTC(ano, mes, 0)));
};
export const inicioDoAno = (iso) => `${iso.slice(0, 4)}-01-01`;
export const fimDoAno = (iso) => `${iso.slice(0, 4)}-12-31`;

/** Semana de segunda a domingo. */
export function inicioDaSemana(iso) {
    const diaDaSemana = doIso(iso).getUTCDay(); // 0 = domingo
    return somarDias(iso, -((diaDaSemana + 6) % 7));
}

export const fimDaSemana = (iso) => somarDias(inicioDaSemana(iso), 6);

export const dataBr = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "outubro de 2026" */
export const mesPorExtenso = (iso) => {
    const [ano, mes] = iso.split('-');
    return `${MESES[Number(mes) - 1]} de ${ano}`;
};

/** Data e hora de um instante, no fuso de Brasília. */
export const dataHoraBr = (valor) => (valor ? new Date(valor).toLocaleString('pt-BR', { timeZone: FUSO_HORARIO }) : '');

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
