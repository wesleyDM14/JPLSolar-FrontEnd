// Opções e rótulos dos enums do domínio (espelham o schema do back-end).

export const TIPO_PESSOA = {
    PESSOA_FISICA: 'PESSOA_FISICA',
    PESSOA_JURIDICA: 'PESSOA_JURIDICA',
};

export const tipoPessoaOptions = [
    { value: 'PESSOA_FISICA', label: 'Pessoa física' },
    { value: 'PESSOA_JURIDICA', label: 'Pessoa jurídica' },
];

export const tipoPessoaLabel = (value) => tipoPessoaOptions.find((o) => o.value === value)?.label ?? value;

export const estadoCivilOptions = [
    { value: 'SOLTEIRO', label: 'Solteiro(a)' },
    { value: 'CASADO', label: 'Casado(a)' },
    { value: 'SEPARADO', label: 'Separado(a)' },
    { value: 'DIVORCIADO', label: 'Divorciado(a)' },
    { value: 'VIUVO', label: 'Viúvo(a)' },
];

export const generoOptions = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMININO', label: 'Feminino' },
];

export const inversorOptions = [
    { value: 'ABB', label: 'ABB' },
    { value: 'CANADIAN', label: 'Canadian Solar' },
    { value: 'DEYE', label: 'Deye' },
    { value: 'GOODWE', label: 'GoodWe' },
    { value: 'GROWATT', label: 'Growatt' },
    { value: 'SOLIS', label: 'Solis' },
];

export const inversorLabel = (value) => inversorOptions.find((o) => o.value === value)?.label ?? value;

export const TIPO_CONTRATO = {
    COMPRA_VENDA: 'COMPRA_VENDA',
    PRESTACAO_SERVICOS: 'PRESTACAO_SERVICOS',
    SERVICO_GERAL: 'SERVICO_GERAL',
};

export const tipoContratoOptions = [
    { value: 'COMPRA_VENDA', label: 'Compra e venda financiada' },
    { value: 'PRESTACAO_SERVICOS', label: 'Prestação de serviços (instalação / venda de usina)' },
    { value: 'SERVICO_GERAL', label: 'Prestação de serviços (outros serviços)' },
];

export const tipoContratoLabel = (value) => tipoContratoOptions.find((o) => o.value === value)?.label ?? value;

export const statusContratoOptions = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'QUITADO', label: 'Quitado' },
    { value: 'CANCELADO', label: 'Inativo' },
];

export const statusContratoTone = { ATIVO: 'info', QUITADO: 'success', CANCELADO: 'danger' };
export const statusContratoLabel = (value) => statusContratoOptions.find((o) => o.value === value)?.label ?? value;

export const tipoDocumentoOptions = [
    { value: 'CONTRATO_ASSINADO', label: 'Contrato assinado' },
    { value: 'DOCUMENTO_PESSOAL', label: 'Documento pessoal' },
    { value: 'COMPROVANTE_ENDERECO', label: 'Comprovante de endereço' },
    { value: 'OUTRO', label: 'Outro' },
];

export const tipoDocumentoLabel = (value) => tipoDocumentoOptions.find((o) => o.value === value)?.label ?? value;

export const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const ufOptions = UFS.map((uf) => ({ value: uf, label: uf }));
