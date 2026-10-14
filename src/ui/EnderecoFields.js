import { useFormikContext, getIn } from 'formik';
import { useEffect, useRef } from 'react';
import * as Yup from 'yup';
import { onlyDigits } from '../utils/masks';
import { ufOptions } from '../utils/enums';
import { Grid } from './layout';
import { SelectField, TextField } from './form';

/** Valores iniciais de um endereço. */
export const emptyEndereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };

/** Schema Yup de endereço. `required=false` aceita o bloco inteiro em branco. */
export function enderecoSchema(required = true) {
    const field = (message) => (required ? Yup.string().trim().required(message) : Yup.string().trim());

    return Yup.object({
        cep: required
            ? Yup.string().required('Informe o CEP.').test('cep', 'CEP deve ter 8 dígitos.', (v) => onlyDigits(v).length === 8)
            : Yup.string().test('cep', 'CEP deve ter 8 dígitos.', (v) => !v || onlyDigits(v).length === 8),
        logradouro: field('Informe o logradouro.'),
        numero: field('Informe o número (ou S/N).'),
        complemento: Yup.string().trim(),
        bairro: field('Informe o bairro.'),
        cidade: field('Informe a cidade.'),
        uf: required ? Yup.string().required('Informe a UF.') : Yup.string(),
    });
}

/** O bloco está totalmente vazio? (para não enviar endereço em branco) */
export const isEnderecoEmpty = (endereco) => !endereco || Object.values(endereco).every((value) => !String(value ?? '').trim());

/** Limpa o endereço para envio à API (CEP só com dígitos, sem campos vazios). */
export function enderecoPayload(endereco) {
    const payload = { ...endereco, cep: onlyDigits(endereco.cep), uf: String(endereco.uf).toUpperCase() };

    if (!payload.complemento) {
        delete payload.complemento;
    }

    return payload;
}

async function lookupCep(cep) {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.erro ? null : data;
}

/**
 * Campos de endereço do Formik, com preenchimento automático pelo CEP (ViaCEP).
 * `name` é o caminho do objeto no formulário (ex.: "endereco" ou "avalista.endereco").
 */
export function EnderecoFields({ name = 'endereco', required = false }) {
    const { values, setFieldValue } = useFormikContext();
    const cep = onlyDigits(getIn(values, `${name}.cep`));
    const lastLookup = useRef(null);

    useEffect(() => {
        if (cep.length !== 8 || lastLookup.current === cep) return;

        lastLookup.current = cep;
        let cancelled = false;

        lookupCep(cep)
            .then((data) => {
                if (cancelled || !data) return;
                // Só preenche o que veio do CEP; número e complemento são do usuário.
                if (data.logradouro) setFieldValue(`${name}.logradouro`, data.logradouro);
                if (data.bairro) setFieldValue(`${name}.bairro`, data.bairro);
                if (data.localidade) setFieldValue(`${name}.cidade`, data.localidade);
                if (data.uf) setFieldValue(`${name}.uf`, data.uf);
            })
            .catch(() => {
                // Sem internet/serviço fora do ar: o usuário digita manualmente.
            });

        return () => {
            cancelled = true;
        };
    }, [cep, name, setFieldValue]);

    return (
        <>
            <Grid $cols={3}>
                <TextField name={`${name}.cep`} label="CEP" mask="cep" required={required} placeholder="00000-000" />
                <div style={{ gridColumn: 'span 2' }}>
                    <TextField name={`${name}.logradouro`} label="Logradouro" required={required} />
                </div>
            </Grid>
            <Grid $cols={3}>
                <TextField name={`${name}.numero`} label="Número" required={required} placeholder="Ex.: 120 ou S/N" />
                <div style={{ gridColumn: 'span 2' }}>
                    <TextField name={`${name}.complemento`} label="Complemento" />
                </div>
            </Grid>
            <Grid $cols={3}>
                <TextField name={`${name}.bairro`} label="Bairro" required={required} />
                <TextField name={`${name}.cidade`} label="Cidade" required={required} />
                <SelectField name={`${name}.uf`} label="UF" required={required} options={ufOptions} />
            </Grid>
        </>
    );
}
