import { TIPO_CONTRATO, TIPO_PESSOA } from './enums';
import { isValidCnpj, isValidCpf } from './validators';

// Espelha as regras do back-end (pendenciasParaContrato): o que o cadastro do cliente precisa ter
// para emitir um contrato. Serve para avisar o usuário antes de enviar o formulário.
export function pendenciasParaContrato(cliente, { exigirEndereco = true, tipoContrato = TIPO_CONTRATO.COMPRA_VENDA } = {}) {
    if (!cliente) return [];

    const servicos = tipoContrato === TIPO_CONTRATO.PRESTACAO_SERVICOS || tipoContrato === TIPO_CONTRATO.SERVICO_GERAL;

    const pendencias = [];
    const exige = (ok, descricao) => {
        if (!ok) pendencias.push(descricao);
    };

    if (cliente.tipoPessoa === TIPO_PESSOA.PESSOA_FISICA) {
        exige(cliente.documento && isValidCpf(cliente.documento), 'CPF');

        // O contrato de serviços qualifica o contratante só por nome, CPF e endereço.
        if (!servicos) {
            exige(cliente.rg, 'RG');
            exige(cliente.estadoCivil, 'Estado civil');
            exige(cliente.genero, 'Gênero');
            exige(cliente.profissao, 'Profissão');
            exige(cliente.dataNascimento, 'Data de nascimento');
        }
    } else {
        exige(cliente.documento && isValidCnpj(cliente.documento), 'CNPJ');
        exige(cliente.representanteNome, 'Nome do representante legal');
        exige(cliente.representanteCpf && isValidCpf(cliente.representanteCpf), 'CPF do representante legal');
    }

    if (!servicos) {
        exige(cliente.email, 'E-mail');
    }

    if (exigirEndereco) {
        exige(cliente.endereco, 'Endereço');
    }

    return pendencias;
}
