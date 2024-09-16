import { useState } from "react";
import {
    BackButton,
    ButtonGroup,
    LeftContainer,
    ProfileContainer,
    RightContainer,
    StyledFormArea,
    SubmitButton,
    TextContent,
    WarningContainer,
    WarningIconContainer,
} from "./styles";
import { TbMessageOff } from "react-icons/tb";
import { Formik, Form } from "formik";
import * as Yup from 'yup';
import { TextInput } from "../../components/FormLib";

const Profile = ({ navigate, user }) => {

    const [warnings, setWarnings] = useState([]);

    return (
        <ProfileContainer>
            <LeftContainer>
                {
                    warnings.length === 0 ? (
                        <WarningContainer>
                            <WarningIconContainer>
                                <TbMessageOff />
                            </WarningIconContainer>
                            <TextContent>
                                Sem Avisos Registrados
                            </TextContent>
                        </WarningContainer>
                    ) : (
                        <></>
                    )
                }
            </LeftContainer>
            <RightContainer>
                <TextContent>Editar Perfil</TextContent>
                <StyledFormArea>
                    <Formik
                        initialValues={{
                            nome: '',
                            newPassword: '',
                            confirmPassword: ''
                        }}

                        validationSchema={
                            Yup.object({
                                nome: Yup.string(),
                                newPassword: Yup.string().min(8, 'Senha deve ter pelo menos 8 caracteres').required('Senha é obrigatório'),
                                confirmPassword: Yup.string().oneOf([Yup.ref('newPassword'), null], 'As senhas devem coincidir').required('Confirmação de senha é obrigatório'),
                            })
                        }

                        onSubmit={(values, { setSubmitting, setFieldError }) => {

                        }}
                    >
                        {
                            ({ isSubmitting }) => (
                                <Form>
                                    <TextInput
                                        name='nome'
                                        label='Nome'
                                        type='text'
                                    />
                                    <TextInput
                                        name='newPassword'
                                        label='Nova senha'
                                        type='password'
                                    />
                                    <TextInput
                                        name='confirmPassword'
                                        label='Confirmar Nova Senha'
                                        type='password'
                                    />
                                    <ButtonGroup>
                                        <BackButton type='button' onClick={() => navigate('/')}>Voltar</BackButton>
                                        <SubmitButton type='submit'>Salvar</SubmitButton>
                                    </ButtonGroup>
                                </Form>
                            )
                        }
                    </Formik>
                </StyledFormArea>
            </RightContainer>
        </ProfileContainer>
    )
}

export default Profile;