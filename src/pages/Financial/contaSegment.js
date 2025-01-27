import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import {
    AddContaButtonIconContainer,
    AddContaContainer,
    AddContaText,
    AdminContainer,
    BackButton,
    ButtonGroup,
    ClientTitle,
    ContaListContainer,
    ContaListHeader,
    ContaListHeaderLabel,
    DeleteButtonContainer,
    DeleteContainer,
    DeleteIconContainer,
    DeleteTitle,
    EditIconContainer,
    FormContent,
    FormInputArea,
    FormInputLabelRequired,
    IconWrapper,
    Limitador,
    NoContentContainer,
    SingleConta,
    SingleContaValue,
    StyledFormArea,
    SubItensContainer,
    SubmitButton,
    TextContent,
} from './styles';
import { FaBuilding, FaEdit, FaFileInvoice, FaPlusCircle, FaRegIdBadge, FaTrashAlt } from 'react-icons/fa';
import { CiBank } from 'react-icons/ci';
import { TbNumber } from 'react-icons/tb';
import { colors, ModalStyles } from '../../utils/GlobalStyles';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { createConta, deleteConta, getContaByUser, updateConta } from '../../services/financialServices';
import { FormInput, MaskedInputComponent } from '../../components/FormLib';
import { ThreeDots } from 'react-loader-spinner';
import Loading from '../../components/Loading';

const ContaSegment = ({ user }) => {
    Modal.setAppElement(document.getElementById('root'));

    const [conta, setConta] = useState({});

    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [addContaModalIsOpen, setAddContaModalIsOpen] = useState(false);
    const [editContaModalIsOpen, setEditContaModalIsOpen] = useState(false);
    const [deleteContaModalIsOpen, setDeleteContaModalIsOpen] = useState(false);

    const openAddContaModal = () => {
        setAddContaModalIsOpen(true);
    }

    const closeAddContaModal = () => {
        setAddContaModalIsOpen(false);
    }

    const closeEditContaModal = () => {
        setEditContaModalIsOpen(false);
    }

    const openEditContaModal = () => {
        setEditContaModalIsOpen(true);
    }

    const closeDeleteContaModal = () => {
        setDeleteContaModalIsOpen(false);
    }

    const openDeleteContaModal = () => {
        setDeleteContaModalIsOpen(true);
    }

    useEffect(() => {
        if (loading) {
            getContaByUser(user, setConta, setLoading);
        }
    }, [loading, user]);

    return (
        <>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        {
                            Object.keys(conta).length === 0 && (
                                <AddContaContainer>
                                    <AddContaButtonIconContainer onClick={openAddContaModal}>
                                        <FaPlusCircle />
                                    </AddContaButtonIconContainer>
                                    <AddContaText onClick={openAddContaModal}>Adicionar</AddContaText>
                                </AddContaContainer>
                            )
                        }
                        <ContaListContainer>
                            <ContaListHeader>
                                <ContaListHeaderLabel className="label-responsive">Nome</ContaListHeaderLabel>
                                <ContaListHeaderLabel>Banco</ContaListHeaderLabel>
                                <ContaListHeaderLabel>Agência</ContaListHeaderLabel>
                                <ContaListHeaderLabel>Número</ContaListHeaderLabel>
                            </ContaListHeader>
                            {
                                Object.keys(conta).length !== 0 ? (
                                    <SingleConta>
                                        <SingleContaValue><FaRegIdBadge />{conta.empresa}</SingleContaValue>
                                        <SingleContaValue><CiBank />{conta.banco}</SingleContaValue>
                                        <SingleContaValue><TbNumber />{conta.agencia}</SingleContaValue>
                                        <SingleContaValue><TbNumber />{conta.conta}</SingleContaValue>
                                        <AdminContainer>
                                            <EditIconContainer onClick={() => openEditContaModal()}><FaEdit /></EditIconContainer>
                                            <DeleteIconContainer onClick={() => openDeleteContaModal()}><FaTrashAlt /></DeleteIconContainer>
                                        </AdminContainer>
                                    </SingleConta>
                                ) : (
                                    <NoContentContainer>
                                        <IconWrapper>
                                            <CiBank />
                                        </IconWrapper>
                                        <TextContent>Nenhuma Conta cadastrada</TextContent>
                                    </NoContentContainer>
                                )
                            }
                        </ContaListContainer>

                        <Modal
                            isOpen={addContaModalIsOpen}
                            onRequestClose={closeAddContaModal}
                            style={ModalStyles}
                        >
                            <StyledFormArea>
                                <div style={{ display: 'flex', marginBottom: '30px', alignItems: 'center', justifyContent: 'center' }}>
                                    <ClientTitle><FaFileInvoice /> Cadastrar Conta</ClientTitle>
                                </div>
                                <Formik
                                    initialValues={{
                                        agencia: '',
                                        banco: '',
                                        posto: '',
                                        codBeneficiario: '',
                                        cnpj: '',
                                        empresa: '',
                                        conta: '',
                                        sicrediLogin: '',
                                        sicrediPassword: '',
                                    }}

                                    validationSchema={
                                        Yup.object({
                                            agencia: Yup.string().required('Obrigatório'),
                                            banco: Yup.string().required('Obrigatório'),
                                            posto: Yup.string().required('Obrigatório'),
                                            codBeneficiario: Yup.string().required('Obrigatório'),
                                            cnpj: Yup.string().required('Obrigatório'),
                                            empresa: Yup.string().required('Obrigatório'),
                                            conta: Yup.string().required('Obrigatório'),
                                            sicrediLogin: Yup.string().required('Obrigatório'),
                                            sicrediPassword: Yup.string().required('Obrigatório'),
                                        })
                                    }

                                    onSubmit={(values, { setSubmitting, setFieldError }) => {
                                        createConta(values, user, setLoading, setSubmitting, setFieldError, closeAddContaModal);
                                    }}
                                >
                                    {
                                        ({ isSubmitting, values }) => (
                                            <Form>
                                                <FormContent>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaBuilding />Empresa</FormInputLabelRequired>
                                                        <FormInput
                                                            type='text'
                                                            name='empresa'
                                                            placeholder='Nome da empresa'
                                                            autoComplete='empresa'
                                                        />
                                                    </FormInputArea>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaBuilding />CNPJ</FormInputLabelRequired>
                                                        <MaskedInputComponent
                                                            name='cnpj'
                                                            type='text'
                                                            mask={[/[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '/', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/]}
                                                            value={values.cnpj}
                                                            placeholder='CNPJ'
                                                            autoComplete='cnpj'
                                                        />
                                                    </FormInputArea>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaBuilding />Banco</FormInputLabelRequired>
                                                        <FormInput
                                                            type='text'
                                                            name='banco'
                                                            placeholder='Nome do Banco'
                                                            autoComplete='banco'
                                                        />
                                                    </FormInputArea>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaBuilding />Agência</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='text'
                                                                    name='agencia'
                                                                    placeholder='Agência'
                                                                    autoComplete='agencia'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaBuilding />Conta</FormInputLabelRequired>
                                                            <FormInput
                                                                type='text'
                                                                name='conta'
                                                                placeholder='Conta'
                                                                autoComplete='conta'
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaBuilding />Posto</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='text'
                                                                    name='posto'
                                                                    placeholder='Posto'
                                                                    autoComplete='posto'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaBuilding />Cód. Beneficiário</FormInputLabelRequired>
                                                            <FormInput
                                                                type='text'
                                                                name='codBeneficiario'
                                                                placeholder='Cód. Beneficiario'
                                                                autoComplete='codBeneficiario'
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaBuilding />Login</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='text'
                                                                    name='sicrediLogin'
                                                                    placeholder='Login'
                                                                    autoComplete='sicrediLogin'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaBuilding />Senha</FormInputLabelRequired>
                                                            <FormInput
                                                                type='password'
                                                                name='sicrediPassword'
                                                                placeholder='Senha'
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <ButtonGroup>
                                                        <BackButton type='button' onClick={() => closeAddContaModal()}>Voltar</BackButton>
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
                        </Modal>
                        <Modal
                            isOpen={editContaModalIsOpen}
                            onRequestClose={closeEditContaModal}
                            style={ModalStyles}
                        >
                            <StyledFormArea>
                                <div style={{ display: 'flex', marginBottom: '30px', alignItems: 'center', justifyContent: 'center' }}>
                                    <ClientTitle><FaFileInvoice /> Atualizar Conta</ClientTitle>
                                </div>
                                <Formik
                                    initialValues={{
                                        id: conta?.id,
                                        agencia: conta?.agencia,
                                        banco: conta?.banco,
                                        posto: conta?.posto,
                                        codBeneficiario: conta?.codBeneficiario,
                                        cnpj: conta?.cnpj,
                                        empresa: conta?.empresa,
                                        conta: conta?.conta,
                                        sicrediLogin: conta?.sicrediLogin,
                                        sicrediPassword: conta?.sicrediPassword,
                                    }}

                                    validationSchema={
                                        Yup.object({
                                            agencia: Yup.string().required('Obrigatório'),
                                            banco: Yup.string().required('Obrigatório'),
                                            posto: Yup.string().required('Obrigatório'),
                                            codBeneficiario: Yup.string().required('Obrigatório'),
                                            cnpj: Yup.string().required('Obrigatório'),
                                            empresa: Yup.string().required('Obrigatório'),
                                            conta: Yup.string().required('Obrigatório'),
                                            sicrediLogin: Yup.string().required('Obrigatório'),
                                            sicrediPassword: Yup.string().required('Obrigatório'),
                                        })
                                    }

                                    onSubmit={(values, { setSubmitting, setFieldError }) => {
                                        updateConta(values, user, setSubmitting, setFieldError, closeEditContaModal, setLoading)
                                    }}
                                >
                                    {
                                        ({ isSubmitting, values }) => (
                                            <Form>
                                                <FormContent>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaBuilding />Empresa</FormInputLabelRequired>
                                                        <FormInput
                                                            type='text'
                                                            name='empresa'
                                                            placeholder='Nome da empresa'
                                                            autoComplete='empresa'
                                                        />
                                                    </FormInputArea>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaBuilding />CNPJ</FormInputLabelRequired>
                                                        <MaskedInputComponent
                                                            name='cnpj'
                                                            type='text'
                                                            mask={[/[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '/', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/]}
                                                            value={values.cnpj}
                                                            placeholder='CNPJ'
                                                            autoComplete='cnpj'
                                                        />
                                                    </FormInputArea>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaBuilding />Banco</FormInputLabelRequired>
                                                        <FormInput
                                                            type='text'
                                                            name='banco'
                                                            placeholder='Nome do Banco'
                                                            autoComplete='banco'
                                                        />
                                                    </FormInputArea>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaBuilding />Agência</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='text'
                                                                    name='agencia'
                                                                    placeholder='Agência'
                                                                    autoComplete='agencia'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaBuilding />Conta</FormInputLabelRequired>
                                                            <FormInput
                                                                type='text'
                                                                name='conta'
                                                                placeholder='Conta'
                                                                autoComplete='conta'
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaBuilding />Posto</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='text'
                                                                    name='posto'
                                                                    placeholder='Posto'
                                                                    autoComplete='posto'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaBuilding />Cód. Beneficiário</FormInputLabelRequired>
                                                            <FormInput
                                                                type='text'
                                                                name='codBeneficiario'
                                                                placeholder='Cód. Beneficiario'
                                                                autoComplete='codBeneficiario'
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaBuilding />Login</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='text'
                                                                    name='sicrediLogin'
                                                                    placeholder='Login'
                                                                    autoComplete='sicrediLogin'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaBuilding />Senha</FormInputLabelRequired>
                                                            <FormInput
                                                                type='password'
                                                                name='sicrediPassword'
                                                                placeholder='Senha'
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <ButtonGroup>
                                                        <BackButton type='button' onClick={() => closeEditContaModal()}>Voltar</BackButton>
                                                        {
                                                            !isSubmitting && (
                                                                <SubmitButton type="submit">Atualizar</SubmitButton>
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
                        </Modal>
                        <Modal
                            isOpen={deleteContaModalIsOpen}
                            onRequestClose={closeDeleteContaModal}
                            style={ModalStyles}
                        >
                            <DeleteContainer>
                                <DeleteTitle>Deseja deletar a conta?</DeleteTitle>
                                <DeleteButtonContainer>
                                    <BackButton type="button" onClick={() => closeDeleteContaModal()}>Voltar</BackButton>
                                    {
                                        !isDeleting && (
                                            <SubmitButton
                                                type="button"
                                                onClick={
                                                    () => {
                                                        deleteConta(conta?.id, user, setIsDeleting, setLoading, closeDeleteContaModal);
                                                    }
                                                }>
                                                Deletar
                                            </SubmitButton>
                                        )
                                    }
                                    {
                                        isDeleting && (
                                            <ThreeDots color={colors.icon} width={100} />
                                        )
                                    }
                                </DeleteButtonContainer>
                            </DeleteContainer>
                        </Modal>
                    </>
                )
            }
        </>
    );
}

export default ContaSegment;