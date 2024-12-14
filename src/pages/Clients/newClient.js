import { Form, Formik } from "formik";
import {
    BackButton,
    ButtonGroup,
    ClientHeader,
    ClientsContainer,
    ClientTitle,
    FormContent,
    FormInputArea,
    FormInputLabel,
    FormInputLabelRequired,
    Limitador,
    StyledFormArea,
    SubItensContainer,
    SubmitButton,
} from "./styles";
import * as Yup from 'yup';
import { FormInput, MaskedInputComponent } from "../../components/FormLib";
import { ThreeDots } from "react-loader-spinner";
import { colors } from "../../utils/GlobalStyles";
import { FaMapMarkerAlt, FaPhoneAlt, FaUser } from "react-icons/fa";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { createClient } from "../../services/clientServices";

const NewClient = ({ navigate, user }) => {
    return (
        <ClientsContainer>
            <ClientHeader>
                <ClientTitle><FaUser style={{ marginRight: '10px' }} />Adicionar Novo Cliente</ClientTitle>
            </ClientHeader>
            <StyledFormArea>
                <Formik
                    initialValues={{
                        name: '',
                        phone: '',
                        address: '',
                    }}
                    validationSchema={
                        Yup.object({
                            name: Yup.string().required('Nome é orbigatório.'),
                            phone: Yup.string().matches(/^\d{11}$/, 'Telefone inválido'),
                            address: Yup.string(),
                        })
                    }
                    onSubmit={(values, { setSubmitting, setFieldError }) => {
                        createClient(values, user, navigate, setSubmitting, setFieldError);
                    }}
                >
                    {
                        ({ isSubmitting, values }) => (
                            <Form>
                                <FormContent>
                                    <FormInputArea>
                                        <FormInputLabelRequired><MdDriveFileRenameOutline /> Nome</FormInputLabelRequired>
                                        <FormInput
                                            type='text'
                                            name='name'
                                            placeholder='Nome do Cliente'
                                            autoComplete='name'
                                        />
                                    </FormInputArea>
                                    <SubItensContainer>
                                        <Limitador>
                                            <FormInputArea>
                                                <FormInputLabel><FaPhoneAlt /> Telefone</FormInputLabel>
                                                <MaskedInputComponent
                                                    name='phone'
                                                    type='text'
                                                    mask={['(', /[0-9]/, /[0-9]/, ')', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/]}
                                                    value={values.phone}
                                                    placeholder='Telefone do Cliente'
                                                    autoComplete='tel'
                                                />
                                            </FormInputArea>
                                        </Limitador>
                                        <FormInputArea>
                                            <FormInputLabel><FaMapMarkerAlt /> Endereço</FormInputLabel>
                                            <FormInput
                                                type='text'
                                                name='address'
                                                placeholder='Endereço do Cliente'
                                                autoComplete='street-address'
                                            />
                                        </FormInputArea>
                                    </SubItensContainer>
                                    <ButtonGroup>
                                        <BackButton type="button" onClick={() => navigate(-1)}>Voltar</BackButton>
                                        {
                                            !isSubmitting && (
                                                <SubmitButton type="submit">Cadastrar</SubmitButton>
                                            )
                                        }
                                        {
                                            isSubmitting && (
                                                <ThreeDots color={colors.icon} />
                                            )
                                        }

                                    </ButtonGroup>
                                </FormContent>
                            </Form>
                        )
                    }
                </Formik>
            </StyledFormArea>
        </ClientsContainer>
    );
}

export default NewClient;