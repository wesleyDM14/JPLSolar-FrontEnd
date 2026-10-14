// Máscaras e formatadores de exibição. Os valores enviados à API são sempre apenas dígitos.

export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

export function maskCpf(value) {
    const d = onlyDigits(value).slice(0, 11);
    return d
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function maskCnpj(value) {
    const d = onlyDigits(value).slice(0, 14);
    return d
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

/** CPF ou CNPJ conforme a quantidade de dígitos. */
export function maskDocumento(value) {
    return onlyDigits(value).length > 11 ? maskCnpj(value) : maskCpf(value);
}

export function maskPhone(value) {
    const d = onlyDigits(value).slice(0, 11);

    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return d.replace(/^(\d{2})(\d+)/, '($1) $2');
    if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    return d.replace(/^(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
}

export function maskCep(value) {
    return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

export const formatDocumento = (value) => (onlyDigits(value).length === 14 ? maskCnpj(value) : maskCpf(value));
export const formatPhone = (value) => (value ? maskPhone(value) : '');

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

/** Data "de calendário" (sem hora): usa UTC para não deslocar o dia conforme o fuso do navegador. */
export function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

/** Converte ISO para o valor de <input type="date"> (yyyy-mm-dd). */
export function toDateInput(value) {
    return value ? new Date(value).toISOString().slice(0, 10) : '';
}
