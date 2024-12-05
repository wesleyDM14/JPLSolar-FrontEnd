import { Form, Formik } from "formik";
import {
    BackButton,
    ButtonGroup,
    FormContent,
    FormInputArea,
    FormInputLabel,
    FormInputLabelRequired,
    Limitador,
    PartnerContainer,
    PartnerHeader,
    PartnerTitle,
    StyledFormArea,
    SubItensContainer,
    SubmitButton,
} from "./styles";
import * as Yup from 'yup';
import { FormInput, MaskedInputComponent } from "../../components/FormLib";
import { ThreeDots } from "react-loader-spinner";
import { colors } from "../../utils/GlobalStyles";
import { FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { GrUserWorker } from "react-icons/gr";
import { createPartner } from "../../services/partnerService";

const NewPartner = ({ navigate, user }) => {
    return (
        <PartnerContainer>
            <PartnerHeader>
                <PartnerTitle><GrUserWorker style={{ marginRight: '10px' }} />Adicionar Novo Parceiro</PartnerTitle>
            </PartnerHeader>
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
                        createPartner(values, user, navigate, setSubmitting, setFieldError);
                    }}
                >
                    {
                        ({ isSubmitting, values }) => (
                            <Form>
                                <FormContent>
                                    <FormInputArea>
                                        <FormInputLabelRequired><MdDriveFileRenameOutline />Nome</FormInputLabelRequired>
                                        <FormInput
                                            type='text'
                                            name='name'
                                            placeholder='Nome do Parceiro'
                                            autoComplete='name'
                                        />
                                    </FormInputArea>
                                    <SubItensContainer>
                                        <Limitador>
                                            <FormInputArea>
                                                <FormInputLabel><FaPhoneAlt />Telefone</FormInputLabel>
                                                <MaskedInputComponent
                                                    name='phone'
                                                    type='text'
                                                    mask={['(', /[0-9]/, /[0-9]/, ')', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/]}
                                                    value={values.phone}
                                                    placeholder='Telefone do Parceiro'
                                                    autoComplete='tel'
                                                />
                                            </FormInputArea>
                                        </Limitador>
                                        <FormInputArea>
                                            <FormInputLabel><FaMapMarkerAlt />Endereço</FormInputLabel>
                                            <FormInput
                                                type='text'
                                                name='address'
                                                placeholder='Endereço do Parceiro'
                                                autoComplete='street-address'
                                            />
                                        </FormInputArea>
                                    </SubItensContainer>
                                    <ButtonGroup>
                                        <BackButton type="button" onClick={() => navigate('/parceiros')}>Voltar</BackButton>
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
        </PartnerContainer>
    );
}

export default NewPartner;