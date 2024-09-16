import { useField } from "formik"
import { useState } from "react";
import {
    ErrorMsg,
    InputContainer,
    InputLabel,
    StyledIcon,
    StyledInput,
    StyledTextInput,
    StyledTextInputContainer,
    StyledTextInputLabel,
} from "./styles";
import { FiEye, FiEyeOff } from "react-icons/fi";

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