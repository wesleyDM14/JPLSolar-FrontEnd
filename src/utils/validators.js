import { onlyDigits } from './masks';

// Mesmas regras do back-end (dígito verificador), para dar retorno imediato no formulário.

const allSame = (digits) => /^(\d)\1+$/.test(digits);

export function isValidCpf(value) {
    const cpf = onlyDigits(value);

    if (cpf.length !== 11 || allSame(cpf)) return false;

    const check = (length) => {
        let sum = 0;
        for (let i = 0; i < length; i += 1) sum += Number(cpf[i]) * (length + 1 - i);
        const result = (sum * 10) % 11;
        return result === 10 ? 0 : result;
    };

    return check(9) === Number(cpf[9]) && check(10) === Number(cpf[10]);
}

export function isValidCnpj(value) {
    const cnpj = onlyDigits(value);

    if (cnpj.length !== 14 || allSame(cnpj)) return false;

    const check = (length) => {
        const weights = length === 12
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        let sum = 0;
        for (let i = 0; i < length; i += 1) sum += Number(cnpj[i]) * weights[i];
        const result = sum % 11;
        return result < 2 ? 0 : 11 - result;
    };

    return check(12) === Number(cnpj[12]) && check(13) === Number(cnpj[13]);
}
