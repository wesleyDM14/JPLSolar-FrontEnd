import { FaCalendarAlt, FaHashtag, FaSolarPanel } from "react-icons/fa";
import {
    BackButton,
    ButtonGroup,
    FormColumn,
    FormContent,
    FormInputArea,
    FormInputLabelRequired,
    FormSelect,
    Limitador,
    SelectWrapper,
    SolarPlantHeader,
    SolarPlantsContainer,
    SolarPlantTitle,
    StyledFormArea,
    SubItensContainer,
    SubmitButton,
} from "./styles";
import { Formik, Form, Field } from "formik";
import * as Yup from 'yup';
import { useParams } from "react-router-dom";
import { PiCodeFill } from "react-icons/pi";
import { FormInput, StyledDatePicker } from "../../components/FormLib";
import { IoLocationSharp, IoLogIn } from "react-icons/io5";
import { CgSelectR } from "react-icons/cg";
import { RiLockPasswordFill } from "react-icons/ri";
import { SlEnergy } from "react-icons/sl";
import { ThreeDots } from "react-loader-spinner";
import { colors } from "../../utils/GlobalStyles";
import { MdEnergySavingsLeaf } from "react-icons/md";
import { createSolarPlant } from "../../services/solarPlantServices";

const NewSolarPlant = ({ navigate, user }) => {

    const { clientId } = useParams();

    return (
        <SolarPlantsContainer>
            <SolarPlantHeader>
                <SolarPlantTitle><FaSolarPanel />Adicionar Nova Planta Solar</SolarPlantTitle>
            </SolarPlantHeader>
            <StyledFormArea>
                <Formik
                    initialValues={{
                        code: "",
                        local: "",
                        installationDate: null,
                        inverter: "",
                        inverterPot: 0,
                        panel: "",
                        panelPower: 0,
                        numberPanel: 0,
                        estimatedGeneration: 0,
                        login: "",
                        password: "",
                        clientId: clientId
                    }}
                    validationSchema={
                        Yup.object({
                            code: Yup.string().required('Código é Obrigatório.'),
                            local: Yup.string().required('Localização é Obrigatório.'),
                            installationDate: Yup.date().required('Data de instalação é obrigatório'),
                            inverterPot: Yup.number().required('Potência do Inversor é obrigatório.'),
                            panel: Yup.string().required('Marca da placa solar é obrigatório.'),
                            panelPower: Yup.string().required('Potência do Painel solar é obrigatório.'),
                            numberPanel: Yup.number().required('Quantidade de paineis solares é obrigatório'),
                            estimatedGeneration: Yup.number().required('Geração Mensal estimada é obrigatória.'),
                            login: Yup.string().required('Login é obrigatório'),
                            password: Yup.string().required('Password é obrigatório'),
                        })
                    }
                    onSubmit={(values, { setSubmitting, setFieldError }) => {
                        createSolarPlant(values, user, navigate, setSubmitting, setFieldError);
                    }}
                >
                    {
                        ({ isSubmitting, setFieldValue, values }) => (
                            <Form>
                                <FormContent>
                                    <FormColumn>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><PiCodeFill />Código</FormInputLabelRequired>
                                                    <FormInput
                                                        type='text'
                                                        name='code'
                                                        placeholder='Código da Usina'
                                                        autoComplete='code'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><IoLocationSharp />Localização</FormInputLabelRequired>
                                                <FormInput
                                                    type='text'
                                                    name='local'
                                                    placeholder='Localização'
                                                    autoComplete='local'
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><IoLogIn />Login de Monitoramento</FormInputLabelRequired>
                                                    <FormInput
                                                        type='text'
                                                        name='login'
                                                        placeholder='Login'
                                                        autoComplete='login'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><RiLockPasswordFill />Senha de Monitoramento</FormInputLabelRequired>
                                                <FormInput
                                                    type='password'
                                                    name='password'
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaCalendarAlt />Data de Instalação</FormInputLabelRequired>
                                                    <StyledDatePicker
                                                        name='installationDate'
                                                        setFieldValue={setFieldValue}
                                                        selected={values.installationDate ? values.installationDate : new Date()}
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><CgSelectR />Inversor</FormInputLabelRequired>
                                                <SelectWrapper>
                                                    <Field as={FormSelect} name='inverter'>
                                                        <option value=''>Selecione o Inversor</option>
                                                        <option value='ABB'>ABB</option>
                                                        <option value='CANADIAN'>Canadian</option>
                                                        <option value='DEYE'>DEYE</option>
                                                        <option value='GROWATT'>Growatt</option>
                                                    </Field>
                                                </SelectWrapper>
                                            </FormInputArea>
                                        </SubItensContainer>
                                    </FormColumn>
                                    <FormColumn $espacamento={12}>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaSolarPanel />Marca dos Painéis Solares</FormInputLabelRequired>
                                                    <FormInput
                                                        type='text'
                                                        name='panel'
                                                        placeholder='Marca dos Painéis'
                                                        autoComplete='panel'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><SlEnergy />Potência do Painel Solar (W)</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='panelPower'
                                                    min='0'
                                                    step='0.01'
                                                    placeholder='Potência do Painel'
                                                    autoComplete='panelPower'
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <FormInputArea>
                                                <Limitador>
                                                    <FormInputLabelRequired><SlEnergy />Potência do Inversor (kWp)</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='inverterPot'
                                                        min='0'
                                                        step='0.01'
                                                        placeholder='Potência do Inversor'
                                                        autoComplete='inverterPot'
                                                    />
                                                </Limitador>
                                            </FormInputArea>
                                            <FormInputArea>
                                                <FormInputLabelRequired><MdEnergySavingsLeaf />Geração Estimada (kWh)</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='estimatedGeneration'
                                                    min='0'
                                                    step='0.01'
                                                    placeholder='Geração Mensal'
                                                    autoComplete='inverterPot'
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaHashtag />Quantidade de Paineis</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='numberPanel'
                                                        min='0'
                                                        step='0.01'
                                                        placeholder='Número de Painéis'
                                                        autoComplete='numberPanel'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                        </SubItensContainer>
                                    </FormColumn>
                                </FormContent>
                                <ButtonGroup>
                                    <BackButton type="button" onClick={() => navigate(`/plantas-solares/cliente/${clientId}`)}>Voltar</BackButton>
                                    {
                                        !isSubmitting && (
                                            <SubmitButton type='submit'>Cadastrar</SubmitButton>
                                        )
                                    }
                                    {
                                        isSubmitting && (
                                            <ThreeDots color={colors.icon} />
                                        )
                                    }
                                </ButtonGroup>
                            </Form>
                        )
                    }
                </Formik>
            </StyledFormArea>
        </SolarPlantsContainer>
    );
}

export default NewSolarPlant;