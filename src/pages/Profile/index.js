import { useEffect, useState } from "react";
import {
    BackButton,
    ButtonGroup,
    LeftContainer,
    ProfileContainer,
    ProfileHeaderContainer,
    ProfileHeaderTitle,
    ProfileMainContainer,
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
import { ThreeDots } from "react-loader-spinner";
import { colors } from "../../utils/GlobalStyles";
import { getLoggedUserInfo, getNotificationByUser, updatedLoggedUser } from "../../services/userServices";
import Loading from "../../components/Loading";
import { FaUser } from "react-icons/fa";

const Profile = ({ navigate, user }) => {

    const [warnings, setWarnings] = useState([]);
    const [userInfo, setUserInfo] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isNotificationLoading, setIsNotificationLoading] = useState(true);

    useEffect(() => {
        if (isLoading) {
            getLoggedUserInfo(user, setIsLoading, setUserInfo);
        }
    }, [user, isLoading]);

    useEffect(() => {
        if (isNotificationLoading) {
            getNotificationByUser(user, setWarnings, setIsNotificationLoading);
        }
    }, [isNotificationLoading, user]);

    return (
        <ProfileMainContainer>
            {
                isLoading ? (
                    <Loading />
                ) : (
                    <>
                        <ProfileHeaderContainer>
                            <ProfileHeaderTitle><FaUser /> Perfil de {userInfo.name}</ProfileHeaderTitle>
                        </ProfileHeaderContainer>
                        <ProfileContainer>
                            <LeftContainer>
                                {
                                    isNotificationLoading ? (
                                        <Loading />
                                    ) : (
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
                                    )
                                }
                            </LeftContainer>
                            <RightContainer>
                                <TextContent>Editar Perfil</TextContent>
                                <StyledFormArea>
                                    <Formik
                                        initialValues={{
                                            nome: userInfo.name,
                                            login: userInfo.login,
                                            newPassword: '',
                                            confirmPassword: ''
                                        }}

                                        validationSchema={
                                            Yup.object({
                                                nome: Yup.string(),
                                                login: Yup.string(),
                                                newPassword: Yup.string().min(8, 'Senha deve ter pelo menos 8 caracteres').required('Senha é obrigatório'),
                                                confirmPassword: Yup.string().oneOf([Yup.ref('newPassword'), null], 'As senhas devem coincidir').required('Confirmação de senha é obrigatório'),
                                            })
                                        }

                                        onSubmit={(values, { setSubmitting, setFieldError }) => {
                                            updatedLoggedUser(values, userInfo.id, user, setIsLoading, setSubmitting, setFieldError);
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
                                                        name='login'
                                                        label='login'
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
                                                        <BackButton type='button' onClick={() => navigate(-1)}>Voltar</BackButton>
                                                        {
                                                            !isSubmitting && (
                                                                <SubmitButton type='submit'>Salvar</SubmitButton>
                                                            )
                                                        }
                                                        {
                                                            isSubmitting && (
                                                                <ThreeDots color={colors.icon} height={49} width={100} />
                                                            )
                                                        }
                                                    </ButtonGroup>
                                                </Form>
                                            )
                                        }
                                    </Formik>
                                </StyledFormArea>
                            </RightContainer>
                        </ProfileContainer>
                    </>
                )
            }
        </ProfileMainContainer>
    )
}

export default Profile;