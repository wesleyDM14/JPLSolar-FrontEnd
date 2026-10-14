import { useField } from 'formik';
import styled, { css } from 'styled-components';
import { maskCep, maskCnpj, maskCpf, maskDocumento, maskPhone } from '../utils/masks';
import { tokens } from './tokens';

const { colors } = tokens;

const FieldWrapper = styled.label`
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
`;

const Label = styled.span`
    font-size: 0.85rem;
    font-weight: 600;
    color: ${colors.text};
`;

const Required = styled.span`
    color: ${colors.danger};
    margin-left: 2px;
`;

const controlStyles = css`
    box-sizing: border-box;
    width: 100%;
    padding: 10px 12px;
    font-size: 0.95rem;
    border: 1px solid ${({ $invalid }) => ($invalid ? colors.danger : colors.border)};
    border-radius: ${tokens.radius};
    background: ${colors.surface};
    color: ${colors.text};
    outline: none;
    font-family: inherit;

    &:focus {
        border-color: ${colors.primary};
        box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.12);
    }

    &:disabled {
        background: ${colors.neutralBg};
        cursor: not-allowed;
    }
`;

export const Input = styled.input`${controlStyles}`;
export const Select = styled.select`${controlStyles}`;
export const Textarea = styled.textarea`
    ${controlStyles}
    min-height: 90px;
    resize: vertical;
`;

const ErrorText = styled.span`
    color: ${colors.danger};
    font-size: 0.8rem;
`;

const Hint = styled.span`
    color: ${colors.muted};
    font-size: 0.8rem;
`;

export function Field({ label, required, error, hint, children }) {
    return (
        <FieldWrapper>
            {label && (
                <Label>
                    {label}
                    {required && <Required>*</Required>}
                </Label>
            )}
            {children}
            {error ? <ErrorText role="alert">{error}</ErrorText> : hint ? <Hint>{hint}</Hint> : null}
        </FieldWrapper>
    );
}

const maskers = {
    cpf: maskCpf,
    cnpj: maskCnpj,
    documento: maskDocumento,
    phone: maskPhone,
    cep: maskCep,
};

/** Campo de texto ligado ao Formik. `mask` aceita cpf|cnpj|documento|phone|cep; o valor guardado é só dígitos. */
export function TextField({ name, label, required, hint, mask, type = 'text', ...props }) {
    const [field, meta, helpers] = useField(name);
    const masker = mask ? maskers[mask] : null;
    const error = meta.touched && meta.error ? meta.error : undefined;

    return (
        <Field label={label} required={required} error={error} hint={hint}>
            <Input
                id={name}
                type={type}
                $invalid={Boolean(error)}
                {...field}
                {...props}
                value={masker ? masker(field.value) : field.value ?? ''}
                onChange={(event) => {
                    const value = event.target.value;
                    helpers.setValue(masker ? value.replace(/\D/g, '') : value);
                }}
            />
        </Field>
    );
}

export function SelectField({ name, label, required, hint, options, placeholder = 'Selecione', ...props }) {
    const [field, meta] = useField(name);
    const error = meta.touched && meta.error ? meta.error : undefined;

    return (
        <Field label={label} required={required} error={error} hint={hint}>
            <Select id={name} $invalid={Boolean(error)} {...field} {...props} value={field.value ?? ''}>
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </Select>
        </Field>
    );
}

export function TextareaField({ name, label, required, hint, ...props }) {
    const [field, meta] = useField(name);
    const error = meta.touched && meta.error ? meta.error : undefined;

    return (
        <Field label={label} required={required} error={error} hint={hint}>
            <Textarea id={name} $invalid={Boolean(error)} {...field} {...props} value={field.value ?? ''} />
        </Field>
    );
}

/** Campo de data nativo; o valor do formulário é yyyy-mm-dd. */
export function DateField(props) {
    return <TextField type="date" {...props} />;
}

/** Controle sem Formik (filtros), com o mesmo visual. */
export function FilterInput({ label, ...props }) {
    return (
        <Field label={label}>
            <Input {...props} />
        </Field>
    );
}

export function FilterSelect({ label, options, placeholder = 'Todos', ...props }) {
    return (
        <Field label={label}>
            <Select {...props}>
                {placeholder !== null && <option value="">{placeholder}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </Select>
        </Field>
    );
}

export const FiltersBar = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    align-items: end;
    margin-bottom: 16px;
`;
