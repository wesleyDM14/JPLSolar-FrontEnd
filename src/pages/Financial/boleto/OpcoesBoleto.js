import * as Yup from 'yup';
import { DateField, Grid, SelectField, TextField } from '../../../ui';

export const ESPECIES = [
    { value: 'DUPLICATA_MERCANTIL_INDICACAO', label: 'Duplicata mercantil' },
    { value: 'DUPLICATA_SERVICO_INDICACAO', label: 'Duplicata de serviço' },
    { value: 'NOTA_PROMISSORIA', label: 'Nota promissória' },
    { value: 'RECIBO', label: 'Recibo' },
    { value: 'OUTROS', label: 'Outros' },
];

export const OPCOES_PADRAO = {
    hibrido: 'true',
    especie: 'DUPLICATA_MERCANTIL_INDICACAO',
    // Cláusula do contrato: multa de 2% e mora de 0,33% ao dia sobre a parcela vencida.
    juros: '0.33',
    jurosTipo: 'DIARIO',
    multa: '2',
    descontoPercentual: '',
    descontoAte: '',
    protecao: '',
    diasProtecao: '',
};

export const opcoesSchema = Yup.object({
    juros: Yup.number().typeError('Informe um número').min(0, 'Mínimo 0').max(10, 'Máximo 10%'),
    multa: Yup.number().typeError('Informe um número').min(0, 'Mínimo 0').max(10, 'Máximo 10%'),
    descontoPercentual: Yup.number().transform((v, o) => (o === '' ? undefined : v)).typeError('Informe um número').moreThan(0, 'Maior que 0').lessThan(100, 'Menor que 100'),
    descontoAte: Yup.string().when('descontoPercentual', {
        is: (valor) => Number(valor) > 0,
        then: (schema) => schema.required('Informe até quando vale o desconto'),
    }),
    diasProtecao: Yup.number().transform((v, o) => (o === '' ? undefined : v)).typeError('Informe um número').integer('Número inteiro').min(2, 'Mínimo 2').max(99, 'Máximo 99'),
});

/** Converte os campos do formulário no corpo que a API espera. */
export function opcoesParaApi(valores) {
    const corpo = {
        hibrido: valores.hibrido === 'true',
        especie: valores.especie,
        juros: Number(valores.juros) || 0,
        jurosTipo: valores.jurosTipo || 'DIARIO',
        multa: Number(valores.multa) || 0,
    };

    if (Number(valores.descontoPercentual) > 0 && valores.descontoAte) {
        corpo.descontoPercentual = Number(valores.descontoPercentual);
        corpo.descontoAte = valores.descontoAte;
    }

    if (valores.protecao && Number(valores.diasProtecao) > 0) {
        if (valores.protecao === 'protesto') corpo.diasProtesto = Number(valores.diasProtecao);
        else corpo.diasNegativacao = Number(valores.diasProtecao);
    }

    return corpo;
}

/** Campos de configuração do boleto (usados na emissão individual e em lote). Dentro de um <Formik>. */
export function OpcoesBoletoCampos({ valores }) {
    return (
        <Grid $cols={2}>
            <SelectField
                name="hibrido"
                label="Tipo de boleto"
                placeholder={null}
                options={[
                    { value: 'true', label: 'Híbrido (boleto + Pix)' },
                    { value: 'false', label: 'Tradicional' },
                ]}
                hint="O híbrido precisa estar contratado no Sicredi."
            />
            <SelectField name="especie" label="Espécie do documento" placeholder={null} options={ESPECIES} />
            <TextField name="juros" label="Juros de mora (%)" type="number" step="0.01" min="0" hint="Padrão do contrato: 0,33. Use 0 para não cobrar." />
            <SelectField
                name="jurosTipo"
                label="Juros cobrados"
                placeholder={null}
                options={[
                    { value: 'DIARIO', label: 'Por dia de atraso' },
                    { value: 'MENSAL', label: 'Por mês de atraso' },
                ]}
            />
            <TextField name="multa" label="Multa por atraso (%)" type="number" step="0.01" min="0" hint="Padrão do contrato: 2. Use 0 para não cobrar." />
            <span />
            <TextField name="descontoPercentual" label="Desconto (%)" type="number" step="0.01" min="0" hint="Opcional, para pagamento antecipado." />
            <DateField name="descontoAte" label="Desconto vale até" />
            <SelectField
                name="protecao"
                label="Protesto ou negativação automáticos"
                placeholder="Nenhum"
                options={[
                    { value: 'protesto', label: 'Protestar após o vencimento' },
                    { value: 'negativacao', label: 'Negativar após o vencimento' },
                ]}
            />
            {valores?.protecao ? (
                <TextField name="diasProtecao" label="Dias após o vencimento" type="number" min="2" max="99" required />
            ) : (
                <span />
            )}
        </Grid>
    );
}
