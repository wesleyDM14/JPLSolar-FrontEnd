
export const formatCPF = (cpf) => {
    const cleaned = cpf.replace(/\D/g, '');

    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export const formatRG = (rg) => {
    const cleaned = rg.replace(/\D/g, '');

    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
}