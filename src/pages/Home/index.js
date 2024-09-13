import React, { useState } from "react";
import {
    Button,
    Content,
    Description,
    FirstColumn,
    FormArea,
    HomeContainer,
    Icon,
    IconsContainer,
    LoadingContainer,
    Logo,
    SecondColumn,
    Title,
} from "./styles";
import { PiSolarPanelLight } from "react-icons/pi";
import { FaFileContract, FaLock, FaUser } from "react-icons/fa";
import { FaUsersLine } from "react-icons/fa6";
import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { LoginInput } from "../../components/FormLib";
import logo from '../../assets/logo.png';
import { ThreeDots } from "react-loader-spinner";
import { colors } from "../../utils/GlobalStyles";
import { loginUser } from "../../services/authServices";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

const Home = () => {

    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    return (
        <HomeContainer>
            {
                !isLoading ? (
                    <Content>
                        <FirstColumn>
                            <Logo src={logo} alt='Logo da Empresa' />
                            <Title size={28}>Bem-Vindo de Volta!</Title>
                            <Description $marginTop='15px'>A sua Gerência de</Description>
                            <Description>Plantas Solares, Clientes e Contratos</Description>
                        </FirstColumn>
                        <SecondColumn>
                            <Title size={35}>Acesse sua conta</Title>
                            <IconsContainer>
                                <Icon><PiSolarPanelLight /></Icon>
                                <Icon><FaUsersLine /></Icon>
                                <Icon><FaFileContract /></Icon>
                            </IconsContainer>
                            <Formik
                                initialValues={{
                                    login: '',
                                    password: '',
                                }}
                                validationSchema={
                                    Yup.object({
                                        login: Yup.string().required('Login é obrigatório'),
                                        password: Yup.string().min(8, 'Senha muito curta').max(30, 'Senha muito Longa').required('Senha é obrigatório'),
                                    })
                                }
                                onSubmit={async (values) => {
                                    setIsLoading(true);
                                    await loginUser(values, navigate, setIsLoading, dispatch);
                                }}
                            >
                                {
                                    () => (
                                        <Form style={{ width: '100%' }}>
                                            <FormArea>
                                                <LoginInput
                                                    name='login'
                                                    type='text'
                                                    label='Login'
                                                    icon={<FaUser />}
                                                />
                                                <LoginInput
                                                    name='password'
                                                    type='password'
                                                    label='Senha'
                                                    icon={<FaLock />}
                                                />
                                                <Button type="submit">Entrar</Button>
                                            </FormArea>
                                        </Form>
                                    )
                                }
                            </Formik>
                        </SecondColumn>
                    </Content>
                ) : (
                    <LoadingContainer>
                        <Logo src={logo} alt='Logo da Empresa' />
                        <ThreeDots color={colors.icon} height={49} width={100} />
                    </LoadingContainer>
                )
            }
        </HomeContainer>
    );
};

export default Home;