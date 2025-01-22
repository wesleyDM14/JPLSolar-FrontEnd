import { useEffect, useState } from "react";
import {
    AddContaButtonIconContainer,
    AddContaContainer,
    AddContaText,
    AdminContainer,
    BackButton,
    ButtonGroup,
    CardCount,
    CardTitle,
    CardValue,
    ContaListContainer,
    ContaListHeader,
    ContaListHeaderLabel,
    DeleteButtonContainer,
    DeleteContainer,
    DeleteIconContainer,
    DeleteTitle,
    EditIconContainer,
    FinanceiroContentContainer,
    FinanceiroHeader,
    FinanceiroMainCard,
    FinanceiroMainContainer,
    FinanceiroMainContent,
    FinanceiroTitleContainer,
    FormContent,
    FormInputArea,
    FormInputLabelRequired,
    HeaderMenu,
    IconWrapper,
    Limitador,
    MenuItem,
    NoContentContainer,
    SingleConta,
    SingleContaValue,
    StyledFormArea,
    SubItensContainer,
    SubmitButton,
    TextContent,
    Title,
    TitleIcon,
} from "./styles";
import Modal from 'react-modal';
import { FaBuilding, FaEdit, FaFileInvoice, FaMoneyBill, FaPlusCircle, FaRegIdBadge, FaTrashAlt } from 'react-icons/fa';
import { CiBank } from 'react-icons/ci';
import { TbNumber } from 'react-icons/tb';
import Loading from "../../components/Loading";
import { formatCurrencyBRL } from "../../utils/formatString";
import { colors, ModalStyles } from "../../utils/GlobalStyles";
import { createConta, deleteConta, getResumeInfo, updateConta } from "../../services/financialServices";
import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { FormInput, MaskedInputComponent } from "../../components/FormLib";
import { ClientTitle } from "../Clients/styles";
import { ThreeDots } from "react-loader-spinner";
import ClientsSegment from "./clientsSegment";
import BoletoSegment from "./boletosSegment";

const Financial = ({ navigate, user }) => {

    Modal.setAppElement(document.getElementById('root'));

    const [section, setSection] = useState('main');
    const [data, setData] = useState({});

    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

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
            getResumeInfo(setData, setLoading, user);
        }
    }, [loading, user]);

    return (
        <FinanceiroMainContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <FinanceiroHeader>
                            <FinanceiroTitleContainer onClick={() => setSection('main')}>
                                <TitleIcon>
                                    <FaMoneyBill />
                                </TitleIcon>
                                <Title>Financeiro</Title>
                            </FinanceiroTitleContainer>
                            <HeaderMenu>
                                <MenuItem onClick={() => setSection('conta')} $active={section === 'conta'}>Conta</MenuItem>
                                <MenuItem onClick={() => setSection('clientes')} $active={section === 'clientes'}>Clientes</MenuItem>
                                <MenuItem onClick={() => setSection('boletos')} $active={section === 'boletos'}>Boletos</MenuItem>
                            </HeaderMenu>
                        </FinanceiroHeader>
                        <FinanceiroContentContainer>
                            {
                                section === 'main' && (
                                    <>
                                        <Title>Resumo</Title>
                                        <FinanceiroMainContent>
                                            <FinanceiroMainCard>
                                                <CardTitle>RECEBIDO</CardTitle>
                                                <CardValue>{formatCurrencyBRL(data.recebido)}</CardValue>
                                                <CardCount>{data.num_pagos} boletos pagos</CardCount>
                                            </FinanceiroMainCard>
                                            <FinanceiroMainCard>
                                                <CardTitle>A RECEBER</CardTitle>
                                                <CardValue>{formatCurrencyBRL(data.a_receber)}</CardValue>
                                                <CardCount>{data.num_receber} boletos a vencer/vencidos</CardCount>
                                            </FinanceiroMainCard>
                                            <FinanceiroMainCard>
                                                <CardTitle>VENCIDAS</CardTitle>
                                                <CardValue>{formatCurrencyBRL(data.vencidas)}</CardValue>
                                                <CardCount>{data.num_vencidas} boletos vencidos</CardCount>
                                            </FinanceiroMainCard>
                                            <FinanceiroMainCard>
                                                <CardTitle>A VENCER</CardTitle>
                                                <CardValue>{formatCurrencyBRL(data.a_vencer)}</CardValue>
                                                <CardCount>{data.num_avencer} boletos a vencer</CardCount>
                                            </FinanceiroMainCard>
                                        </FinanceiroMainContent>
                                    </>
                                )
                            }
                            {
                                section === 'conta' && (
                                    <>
                                        {
                                            !data.conta && (
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
                                                data.conta ? (
                                                    <SingleConta>
                                                        <SingleContaValue><FaRegIdBadge />{data.conta.empresa}</SingleContaValue>
                                                        <SingleContaValue><CiBank />{data.conta.banco}</SingleContaValue>
                                                        <SingleContaValue><TbNumber />{data.conta.agencia}</SingleContaValue>
                                                        <SingleContaValue><TbNumber />{data.conta.conta}</SingleContaValue>
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
                                    </>
                                )
                            }
                            {
                                section === 'clientes' && (
                                    <ClientsSegment />
                                )
                            }
                            {
                                section === 'boletos' && (
                                    <BoletoSegment />
                                )
                            }
                        </FinanceiroContentContainer>
                    </>
                )
            }
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
                            id: data.conta?.id,
                            agencia: data.conta?.agencia,
                            banco: data.conta?.banco,
                            posto: data.conta?.posto,
                            codBeneficiario: data.conta?.codBeneficiario,
                            cnpj: data.conta?.cnpj,
                            empresa: data.conta?.empresa,
                            conta: data.conta?.conta,
                            sicrediLogin: data.conta?.sicrediLogin,
                            sicrediPassword: data.conta?.sicrediPassword,
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
                                            deleteConta(data.conta?.id, user, setIsDeleting, setLoading, closeDeleteContaModal);
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
        </FinanceiroMainContainer>
    )
}

export default Financial;