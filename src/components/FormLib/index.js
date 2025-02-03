import { useField } from "formik"
import { useState, useEffect } from "react";
import {
    ErrorMsg,
    FormInputContainer,
    FormTextInput,
    InputContainer,
    InputLabel,
    StyledIcon,
    StyledInput,
    StyledMaskInput,
    StyledSelectArea,
    StyledSelectLabel,
    StyledTextInput,
    StyledTextInputContainer,
    StyledTextInputLabel,
} from "./styles";
import { FiEye, FiEyeOff } from "react-icons/fi";
import DatePicker, { registerLocale } from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from "date-fns/locale";
import Select from 'react-select';

registerLocale('pt-BR', ptBR)

export const LoginInput = ({ icon, ...props }) => {
    const [field, meta] = useField(props);
    const [show, setShow] = useState(false);

    const id = props.id || props.name;

    return (
        <InputContainer>
            <InputLabel htmlFor={id}>{props.label}</InputLabel>
            {
                props.type !== 'password' && (
                    <StyledInput
                        id={id}
                        $invalid={meta.touched && meta.error}
                        {...field}
                        {...props}
                    />
                )
            }
            {
                props.type === 'password' && (
                    <StyledInput
                        id={id}
                        $invalid={meta.touched && meta.error}
                        {...field}
                        {...props}
                        type={show ? "text" : "password"}
                    />
                )
            }
            <StyledIcon>
                {icon}
            </StyledIcon>
            {
                props.type === 'password' && (
                    <StyledIcon onClick={() => setShow(!show)} $right style={{ cursor: 'pointer' }}>
                        {show && <FiEye />}
                        {!show && <FiEyeOff />}
                    </StyledIcon>
                )
            }
            {
                meta.touched && meta.error ? (
                    <ErrorMsg>{meta.error}</ErrorMsg>
                ) : (
                    <ErrorMsg style={{ visibility: 'hidden' }}>.</ErrorMsg>
                )
            }
        </InputContainer>
    )
}

export const TextInput = ({ ...props }) => {
    const [field, meta] = useField(props);
    const [show, setShow] = useState(false);

    const id = props.id || props.name;

    return (
        <StyledTextInputContainer>
            <StyledTextInputLabel htmlFor={id}>{props.label}</StyledTextInputLabel>
            {
                props.type !== 'password' && (
                    <StyledTextInput
                        id={id}
                        $invalid={meta.touched && meta.error}
                        {...field}
                        {...props}
                    />
                )
            }
            {
                props.type === 'password' && (
                    <StyledTextInput
                        id={id}
                        $invalid={meta.touched && meta.error}
                        {...field}
                        {...props}
                        type={show ? "text" : "password"}
                    />
                )
            }
            {
                props.type === 'password' && (
                    <StyledIcon onClick={() => setShow(!show)} $right style={{ cursor: 'pointer' }}>
                        {show && <FiEye />}
                        {!show && <FiEyeOff />}
                    </StyledIcon>
                )
            }
            {
                meta.touched && meta.error ? (
                    <ErrorMsg>{meta.error}</ErrorMsg>
                ) : (
                    <ErrorMsg style={{ visibility: 'hidden' }}>.</ErrorMsg>
                )
            }
        </StyledTextInputContainer>
    )
}

export const MaskedInputComponent = ({ mask, ...props }) => {
    const [field, meta, helpers] = useField(props);

    return (
        <>
            <StyledMaskInput
                {...field}
                {...props}
                mask={mask}
                onChange={(event) => {
                    const rawValue = event.target.value.replace(/\D/g, '');  // Remove não dígitos
                    helpers.setValue(rawValue);
                }}
                value={props.value}
                placeholder={props.placeholder}
            />
            {meta.touched && meta.error ? (
                <ErrorMsg>{meta.error}</ErrorMsg>
            ) : (
                <ErrorMsg style={{ visibility: 'hidden' }}>.</ErrorMsg>
            )}
        </>
    );
}

export const FormInput = ({ ...props }) => {

    const [field, meta] = useField(props);
    const [show, setShow] = useState(false);

    return (
        <FormInputContainer>
            {
                props.type !== 'password' && (
                    <FormTextInput
                        {...field}
                        {...props}
                    />
                )
            }
            {
                props.type === 'password' && (
                    <FormTextInput
                        {...field}
                        {...props}
                        type={show ? "text" : "password"}
                    />
                )
            }
            {
                props.type === 'password' && (
                    <StyledIcon onClick={() => setShow(!show)} $right style={{ cursor: 'pointer' }} className="eyeIcon">
                        {show && <FiEye />}
                        {!show && <FiEyeOff />}
                    </StyledIcon>
                )
            }
            {
                meta.touched && meta.error ? (
                    <ErrorMsg>{meta.error}</ErrorMsg>
                ) : (
                    <ErrorMsg style={{ visibility: 'hidden' }}>.</ErrorMsg>
                )
            }
        </FormInputContainer>
    );
}

export const StyledDatePicker = ({ setFieldValue, ...props }) => {

    return (
        <>
            <DatePicker
                onChange={(date) => {
                    setFieldValue(props.name, date);
                }}
                dateFormat="dd/MM/yyyy"
                locale='pt-BR'
                {...props}
            />
        </>
    );
}

export const FormContractSelect = ({ contracts, setSelectedContract }) => {
    const [options, setOptions] = useState([]);

    useEffect(() => {
        function generateOptions() {
            let optionsTmp = [];
            for (let index = 0; index < contracts.length; index++) {
                const element = contracts[index];
                if (!element.clienteFinanciamentoId) {
                    let temp = { label: element.nome, value: element };
                    optionsTmp.push(temp);
                }
            }
            setOptions(optionsTmp);
        }
        generateOptions();
    }, [contracts]);

    return (
        <StyledSelectArea>
            <StyledSelectLabel>Contrato</StyledSelectLabel>
            <Select
                options={options}
                placeholder={'Selecione o titular do contrato'}
                onChange={(value) => {
                    setSelectedContract(value);
                }}
                menuPosition="absolute"

                noOptionsMessage={() => "Sem contratos cadastrados"}
                styles={{
                    control: (baseStyles, state) => ({
                        position: 'relative',
                        maxWidth: '100%',
                        width: '90%',
                        backgroundColor: '#fff',
                        borderColor: '#dbdbdb',
                        borderRadius: '4px',
                        color: '#363636',
                        alignItems: 'center',
                        border: '2px solid #0a0a0a0d',
                        display: 'inline-flex',
                        fontSize: '1rem',
                        height: '2.5em',
                        justifyContent: 'flex-start',
                        paddingBottom: 'calc(.5em - 1px)',
                        paddingLeft: 'calc(.75em - 1px)',
                        paddingRight: 'calc(.75em - 1px)',
                        paddingTop: 'calc(.5em - 1px)',
                        lineHeight: '1.5',
                        "&:hover": {
                            border: '2px solid #000',
                        }
                    })
                }}
            />
        </StyledSelectArea>
    )
}
