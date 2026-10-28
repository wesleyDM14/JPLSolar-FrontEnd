import { Form, Formik } from 'formik';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaFileContract, FaSolarPanel, FaUsers } from 'react-icons/fa';
import * as Yup from 'yup';
import logo from '../../assets/logo.png';
import { loginUser } from '../../services/authServices';
import Direitos from '../../components/Direitos';
import { Button, TextField } from '../../ui';
import { BrandPanel, Card, FeatureList, FormPanel, PasswordToggle, Screen } from './styles';

// O tamanho da senha é decidido pelo servidor; aqui só exige o preenchimento.
const schema = Yup.object({
    login: Yup.string().trim().required('Informe o login'),
    password: Yup.string().required('Informe a senha'),
});

const Home = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    return (
        <Screen>
            <BrandPanel>
                <img src={logo} alt="JPL Engenharia" />
                <h1>JPL Solar</h1>
                <p>Gestão de usinas, clientes e contratos da JPL Solar.</p>

                <FeatureList>
                    <li><FaSolarPanel aria-hidden /> Monitoramento das usinas em tempo real</li>
                    <li><FaUsers aria-hidden /> Cadastro completo de clientes (PF e PJ)</li>
                    <li><FaFileContract aria-hidden /> Contratos e notas promissórias em PDF</li>
                </FeatureList>
            </BrandPanel>

            <FormPanel>
                <Card>
                    <h2>Entrar</h2>
                    <p>Acesse o painel administrativo.</p>

                    <Formik
                        initialValues={{ login: '', password: '' }}
                        validationSchema={schema}
                        onSubmit={async (values) => {
                            setIsLoading(true);
                            await loginUser({ ...values, login: values.login.trim() }, navigate, setIsLoading, dispatch);
                        }}
                    >
                        <Form noValidate>
                            <TextField name="login" label="Login" autoComplete="username" autoFocus required />
                            <div style={{ position: 'relative' }}>
                                <TextField
                                    name="password"
                                    label="Senha"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                />
                                <PasswordToggle
                                    type="button"
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    onClick={() => setShowPassword((visible) => !visible)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </PasswordToggle>
                            </div>
                            <Button type="submit" loading={isLoading} style={{ width: '100%', marginTop: 8 }}>
                                Entrar
                            </Button>
                        </Form>
                    </Formik>
                </Card>
                <Direitos />
            </FormPanel>
        </Screen>
    );
};

export default Home;
