import Modal from 'react-modal';
import { useEffect, useMemo, useState } from "react";
import {
    AddFinanceiroButtonIconContainer,
    AddFinanceiroContainer,
    AddFinanceiroText,
    AdminContainer,
    BackButton,
    ButtonGroup,
    ClientFinancialContainer,
    ClientFinancialHeader,
    ClientFinancialListContainer,
    ClientFinancialListContent,
    ClientFinancialListHeader,
    ClientFinancialListLabel,
    ClientFinancialListValue,
    ClientTitle,
    DeleteButtonContainer,
    DeleteContainer,
    DeleteIconContainer,
    DeleteTitle,
    EditIconContainer,
    FormContent,
    FormInputArea,
    FormInputLabelRequired,
    LegendaContent,
    LegendaIcone,
    LegendaText,
    Limitador,
    StyledFormArea,
    SubItensContainer,
    SubmitButton,
    TerceiroSwitchButton,
    TerceiroSwitchContainer,
    TerceiroSwitchTitle,
} from "./styles";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { FaEdit, FaFileInvoice, FaIdCard, FaMoneyBill, FaPlusCircle, FaThumbsDown, FaThumbsUp, FaTrashAlt } from "react-icons/fa";
import Loading from "../../components/Loading";
import { formatCurrencyBRL } from "../../utils/formatString";
import { colors, ModalStyles } from '../../utils/GlobalStyles';
import { ThreeDots } from 'react-loader-spinner';
import { createClientFinanceiro, createClientImporting, deleteClientFinanceiro, getClientsFinanceiro, updateClientFinanceiro } from '../../services/financialServices';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { FormContractSelect, FormInput } from '../../components/FormLib';
import { TbNumber } from 'react-icons/tb';
import { CiImport } from 'react-icons/ci';
import { getContractsByUserId } from '../../services/contractService';

const ClientsSegment = ({ user }) => {

    Modal.setAppElement(document.getElementById('root'));

    const [clients, setClients] = useState([]);
    const [clientTerceiros, setClientTerceiros] = useState([]);
    const [clientImporting, setClientImporting] = useState({});
    const [contracts, setContracts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [contractsLoading, setContractsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [importing, setImporting] = useState(false);

    const [modalState, setModalState] = useState({
        add: false,
        edit: false,
        delete: false,
        importar: false,
    });

    const [currentClient, setCurrentClient] = useState({});
    const [terceiro, setTerceiro] = useState(false);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const handleCheck = () => {
        setTerceiro(!terceiro);
    }

    const toggleModal = (type, state) => {
        setModalState((prev) => ({ ...prev, [type]: state }));
    };

    const filteredClients = useMemo(() => {
        if (loading) return [];
        return clients.filter(client =>
            client.nome?.toLowerCase().includes(search.toLowerCase())
        );
    }, [clients, search, loading]);

    const filteredTerceiros = useMemo(() => {
        if (loading) return [];
        return clientTerceiros.filter(client =>
            client.nome?.toLowerCase().includes(search.toLowerCase())
        );
    }, [loading, clientTerceiros, search]);

    const paginateItems = (items) => {
        const totalPages = Math.ceil(items.length / itemsPerPage);
        const currentPageItens = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);
        return { totalPages, currentPageItens };
    }

    const { totalPages, currentPageItens } = paginateItems(filteredClients);
    const { totalPages: totalPagesTerceiro, currentPageItens: currentTerceirosPageItens } = paginateItems(filteredTerceiros);

    useEffect(() => {
        if (loading) {
            getClientsFinanceiro(user, setClients, setClientTerceiros, setLoading);
        }
    }, [loading, user]);

    useEffect(() => {
        if (contractsLoading) {
            getContractsByUserId(user, setContracts, setContractsLoading);
        }
    }, [contractsLoading, user]);

    const handleImport = () => {
        const quantParcela = clientImporting.value.quantParcelas;
        const precoParcela = clientImporting.value.priceParcela;

        const pagTotal = quantParcela * precoParcela;

        const clientImport = {
            nome: clientImporting.value.nome,
            numParcelasTotal: quantParcela,
            valorParcela: precoParcela,
            pagTotal: pagTotal,
            custoImplantacao: 0,
            lucro: 0,
            numParcelasRest: 0,
            valorQuitado: 0,
            valorRest: 0,
            sePagou: false,
            notafiscal: false,
            terceiro: false,
            contractId: clientImporting.value.id,
        };
        setCurrentClient(clientImport);
        setImporting(true);
    }

    const renderClientList = (items) => (
        items.map((client) => (
            <ClientFinancialListContent key={client.id}>
                <ClientFinancialListValue $hasAfter={client.notafiscal}>{client.nome}</ClientFinancialListValue>
                <ClientFinancialListValue>{client.numParcelasTotal}</ClientFinancialListValue>
                <ClientFinancialListValue>{formatCurrencyBRL(client.valorParcela)}</ClientFinancialListValue>
                <ClientFinancialListValue>{formatCurrencyBRL(client.pagTotal)}</ClientFinancialListValue>
                <ClientFinancialListValue>{formatCurrencyBRL(client.custoImplantacao)}</ClientFinancialListValue>
                <ClientFinancialListValue>{formatCurrencyBRL(client.lucro)}</ClientFinancialListValue>
                <ClientFinancialListValue>{client.numParcelasRest}</ClientFinancialListValue>
                <ClientFinancialListValue>{formatCurrencyBRL(client.valorQuitado)}</ClientFinancialListValue>
                <ClientFinancialListValue>{formatCurrencyBRL(client.valorRest)}</ClientFinancialListValue>
                <ClientFinancialListValue>{client.sePagou ? <FaThumbsUp color='#0F0' /> : <FaThumbsDown color="#F00" />}</ClientFinancialListValue>
                <AdminContainer>
                    <EditIconContainer
                        onClick={() => {
                            setCurrentClient(client);
                            toggleModal('edit', true);
                        }}
                    >
                        <FaEdit />
                    </EditIconContainer>
                    <DeleteIconContainer
                        onClick={() => {
                            setCurrentClient(client);
                            toggleModal('delete', true);
                        }}
                    >
                        <FaTrashAlt />
                    </DeleteIconContainer>
                </AdminContainer>
            </ClientFinancialListContent>
        ))
    );

    return (
        <ClientFinancialContainer>
            {
                loading || contractsLoading ? (
                    <Loading />
                ) : (
                    <>
                        <ClientFinancialHeader>
                            <TerceiroSwitchContainer>
                                <TerceiroSwitchTitle>{terceiro ? 'Clientes de Terceiros' : 'Clientes JPL'}</TerceiroSwitchTitle>
                                <TerceiroSwitchButton>
                                    <input type='checkbox' onClick={handleCheck} />
                                    <span />
                                </TerceiroSwitchButton>
                            </TerceiroSwitchContainer>
                            <AddFinanceiroContainer>
                                <AddFinanceiroButtonIconContainer onClick={() => toggleModal('add', true)}>
                                    <FaPlusCircle />
                                </AddFinanceiroButtonIconContainer>
                                <AddFinanceiroText onClick={() => toggleModal('add', true)}>Adicionar</AddFinanceiroText>
                                <AddFinanceiroButtonIconContainer onClick={() => toggleModal('importar', true)} style={{ marginLeft: '10px' }}>
                                    <CiImport strokeWidth="1.5" />
                                </AddFinanceiroButtonIconContainer>
                                <AddFinanceiroText onClick={() => toggleModal('importar', true)}>Importar</AddFinanceiroText>
                            </AddFinanceiroContainer>
                        </ClientFinancialHeader>
                        <SearchBar search={search} setSearch={setSearch} />
                        <ClientFinancialListContainer>
                            <ClientFinancialListHeader>
                                <ClientFinancialListLabel>Cliente</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Nº Parcelas</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Valor Parcela</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Pag. Total</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Custo</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Lucro Est.</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Parcelas Rest.</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Valor Quitado</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Valor Restante</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Se Pagou?</ClientFinancialListLabel>
                            </ClientFinancialListHeader>
                            {terceiro ? renderClientList(currentTerceirosPageItens) : renderClientList(currentPageItens)}
                            <LegendaContent>
                                <LegendaIcone />
                                <LegendaText>Nota fiscal Emitida</LegendaText>
                            </LegendaContent>
                            <Pagination currentPage={page} setPage={setPage} totalPages={terceiro ? totalPagesTerceiro : totalPages} />
                        </ClientFinancialListContainer>
                    </>
                )
            }

            <Modal
                isOpen={modalState.add}
                onRequestClose={() => toggleModal('add', false)}
                style={ModalStyles}
            >
                <StyledFormArea>
                    <div style={{ display: 'flex', marginBottom: '30px', alignItems: 'center', justifyContent: 'center' }}>
                        <ClientTitle><FaFileInvoice /> Cadastrar Cliente</ClientTitle>
                    </div>
                    <Formik
                        initialValues={{
                            nome: '',
                            numParcelasTotal: 0,
                            valorParcela: 0,
                            pagTotal: 0,
                            custoImplantacao: 0,
                            lucro: 0,
                            numParcelasRest: 0,
                            valorQuitado: 0,
                            valorRest: 0,
                            sePagou: false,
                            notafiscal: false,
                            terceiro: false,
                            contractId: null,
                            clientId: null,
                            montadorId: null,
                        }}

                        validationSchema={
                            Yup.object({
                                nome: Yup.string().required('Nome é obrigatório'),
                                numParcelasTotal: Yup.number().nullable().required('Numero de parcelas é obrigatório'),
                                valorParcela: Yup.number().nullable().required('Valor da parcela é obrigatório'),
                                pagTotal: Yup.number().nullable().required('Total é obrigatório'),
                                custoImplantacao: Yup.number().nullable().required('Custo é obrigatório'),
                                lucro: Yup.number().nullable().required('Lucro é obrigatório'),
                                numParcelasRest: Yup.number().nullable().required('Parcelas Restantes é obrigatório'),
                                valorQuitado: Yup.number().nullable().required('Valor quitado é Obrigatório'),
                                valorRest: Yup.number().nullable().required('Valor restante é obrigatório'),
                                sePagou: Yup.boolean(),
                                notafiscal: Yup.boolean(),
                                terceiro: Yup.boolean(),
                            })
                        }

                        onSubmit={(values, { setSubmitting, setFieldError }) => {
                            createClientFinanceiro(values, user, setSubmitting, setFieldError, setLoading, toggleModal);
                        }}
                    >
                        {
                            ({ isSubmitting, setFieldValue, values }) => (
                                <Form>
                                    <FormContent>
                                        <FormInputArea>
                                            <FormInputLabelRequired><FaIdCard />Nome</FormInputLabelRequired>
                                            <FormInput
                                                type='text'
                                                name='nome'
                                                placeholder='Nome do cliente'
                                                autoComplete='nome'
                                            />
                                        </FormInputArea>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaMoneyBill />Valor Parcela</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='valorParcela'
                                                        placeholder='Valor da Parcelas'
                                                        min='0'
                                                        step='0.01'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><TbNumber />Parcelas</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='numParcelasTotal'
                                                    placeholder='Total de Parcelas'
                                                    min='0'
                                                    step='1'
                                                    onBlur={() => {
                                                        const numParcelas = values.numParcelasTotal;
                                                        if (!values.pagTotal && values.valorParcela >= 0 && numParcelas >= 0) {
                                                            const valorTotal = numParcelas * values.valorParcela;
                                                            setFieldValue('pagTotal', parseFloat(valorTotal.toFixed(2)));
                                                        }
                                                    }}
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaMoneyBill />Pagamento Total</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='pagTotal'
                                                        placeholder='Pagamaneto Total'
                                                        min='0'
                                                        step='0.01'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><FaMoneyBill />Custo</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='custoImplantacao'
                                                    placeholder='Custo Total'
                                                    min='0'
                                                    step='0.01'
                                                    onBlur={() => {
                                                        const custo = values.custoImplantacao;
                                                        if (values.pagTotal >= 0 && custo >= 0) {
                                                            const lucro = values.pagTotal - custo;
                                                            setFieldValue('lucro', parseFloat(lucro.toFixed(2)));
                                                        }
                                                    }}
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaMoneyBill />Lucro</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='lucro'
                                                        placeholder='Lucro'
                                                        min='0'
                                                        step='0.01'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><TbNumber />Parcelas Rest.</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='numParcelasRest'
                                                    placeholder='Parcelas Restante'
                                                    min='0'
                                                    step='1'
                                                    onBlur={() => {
                                                        const parcelasRest = values.numParcelasRest;
                                                        if (values.pagTotal >= 0 && values.numParcelasTotal >= 0 && parcelasRest >= 0 && values.valorParcela >= 0) {
                                                            const parcelasPagas = values.numParcelasTotal - parcelasRest;
                                                            const valorQuitado = parcelasPagas * values.valorParcela;
                                                            const valorRest = values.pagTotal - valorQuitado;

                                                            setFieldValue('valorRest', parseFloat(valorRest.toFixed(2)));
                                                            setFieldValue('valorQuitado', parseFloat(valorQuitado.toFixed(2)));
                                                        }
                                                    }}
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaMoneyBill />Valor Quitado</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='valorQuitado'
                                                        placeholder='Quitado'
                                                        min='0'
                                                        step='0.01'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><FaMoneyBill />Valor Rest.</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='valorRest'
                                                    placeholder='Valor Restante'
                                                    min='0'
                                                    step='0.01'
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start'
                                                    }}>
                                                        <Field
                                                            type='checkbox'
                                                            name='notaFiscal'
                                                            style={{
                                                                marginRight: '10px',
                                                            }}
                                                        />
                                                        <FormInputLabelRequired htmlFor='notaFiscal'>Nota Fiscal Emitida?</FormInputLabelRequired>
                                                    </div>
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-start'
                                                }}>
                                                    <Field
                                                        type='checkbox'
                                                        name='terceiro'
                                                        style={{
                                                            marginRight: '10px',
                                                        }}
                                                    />
                                                    <FormInputLabelRequired htmlFor='terceiro'>Cliente de Terceiro?</FormInputLabelRequired>
                                                </div>
                                            </FormInputArea>
                                        </SubItensContainer>
                                    </FormContent>
                                    <ButtonGroup>
                                        <BackButton type='button' onClick={() => toggleModal('add', false)}>Voltar</BackButton>
                                        {
                                            isSubmitting && (
                                                <ThreeDots color={colors.icon} />
                                            )
                                        }
                                        {
                                            !isSubmitting && (
                                                <SubmitButton type='submit'>Cadastrar</SubmitButton>
                                            )
                                        }
                                    </ButtonGroup>
                                </Form>
                            )
                        }
                    </Formik>
                </StyledFormArea>
            </Modal>
            <Modal
                isOpen={modalState.edit}
                onRequestClose={() => toggleModal('edit', false)}
                style={ModalStyles}
            >
                <StyledFormArea>
                    <div style={{ display: 'flex', marginBottom: '30px', alignItems: 'center', justifyContent: 'center' }}>
                        <ClientTitle><FaFileInvoice /> Editar Cliente</ClientTitle>
                    </div>
                    <Formik
                        initialValues={{
                            id: currentClient.id,
                            nome: currentClient.nome,
                            numParcelasTotal: currentClient.numParcelasTotal,
                            valorParcela: currentClient.valorParcela,
                            pagTotal: currentClient.pagTotal,
                            custoImplantacao: currentClient.custoImplantacao,
                            lucro: currentClient.lucro,
                            numParcelasRest: currentClient.numParcelasRest,
                            valorQuitado: currentClient.valorQuitado,
                            valorRest: currentClient.valorRest,
                            sePagou: currentClient.sePagou,
                            notafiscal: currentClient.notafiscal,
                            terceiro: currentClient.terceiro,
                            contractId: currentClient.contractId,
                            clientId: currentClient.clientId,
                            montadorId: currentClient.montadorId,
                        }}

                        validationSchema={
                            Yup.object({
                                nome: Yup.string().required('Nome é obrigatório'),
                                numParcelasTotal: Yup.number().nullable().required('Numero de parcelas é obrigatório'),
                                valorParcela: Yup.number().nullable().required('Valor da parcela é obrigatório'),
                                pagTotal: Yup.number().nullable().required('Total é obrigatório'),
                                custoImplantacao: Yup.number().nullable().required('Custo é obrigatório'),
                                lucro: Yup.number().nullable().required('Lucro é obrigatório'),
                                numParcelasRest: Yup.number().nullable().required('Parcelas Restantes é obrigatório'),
                                valorQuitado: Yup.number().nullable().required('Valor quitado é Obrigatório'),
                                valorRest: Yup.number().nullable().required('Valor restante é obrigatório'),
                                sePagou: Yup.boolean(),
                                notafiscal: Yup.boolean(),
                                terceiro: Yup.boolean(),
                            })
                        }

                        onSubmit={(values, { setSubmitting, setFieldError }) => {
                            updateClientFinanceiro(values, user, setSubmitting, setFieldError, setLoading, toggleModal);
                        }}
                    >
                        {
                            ({ isSubmitting, setFieldValue, values }) => (
                                <Form>
                                    <FormContent>
                                        <FormInputArea>
                                            <FormInputLabelRequired><FaIdCard />Nome</FormInputLabelRequired>
                                            <FormInput
                                                type='text'
                                                name='nome'
                                                placeholder='Nome do cliente'
                                                autoComplete='nome'
                                            />
                                        </FormInputArea>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaMoneyBill />Valor Parcela</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='valorParcela'
                                                        placeholder='Valor da Parcelas'
                                                        min='0'
                                                        step='0.01'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><TbNumber />Parcelas</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='numParcelasTotal'
                                                    placeholder='Total de Parcelas'
                                                    min='0'
                                                    step='1'
                                                    onBlur={() => {
                                                        const numParcelas = values.numParcelasTotal;
                                                        if (!values.pagTotal && values.valorParcela >= 0 && numParcelas >= 0) {
                                                            const valorTotal = numParcelas * values.valorParcela;
                                                            setFieldValue('pagTotal', parseFloat(valorTotal.toFixed(2)));
                                                        }
                                                    }}
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaMoneyBill />Pagamento Total</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='pagTotal'
                                                        placeholder='Pagamaneto Total'
                                                        min='0'
                                                        step='0.01'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><FaMoneyBill />Custo</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='custoImplantacao'
                                                    placeholder='Custo Total'
                                                    min='0'
                                                    step='0.01'
                                                    onBlur={() => {
                                                        const custo = values.custoImplantacao;
                                                        if (values.pagTotal >= 0 && custo >= 0) {
                                                            const lucro = values.pagTotal - custo;
                                                            setFieldValue('lucro', parseFloat(lucro.toFixed(2)));
                                                        }
                                                    }}
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaMoneyBill />Lucro</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='lucro'
                                                        placeholder='Lucro'
                                                        min='0'
                                                        step='0.01'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><TbNumber />Parcelas Rest.</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='numParcelasRest'
                                                    placeholder='Parcelas Restante'
                                                    min='0'
                                                    step='1'
                                                    onBlur={() => {
                                                        const parcelasRest = values.numParcelasRest;
                                                        if (values.pagTotal >= 0 && values.numParcelasTotal >= 0 && parcelasRest >= 0 && values.valorParcela >= 0) {
                                                            const parcelasPagas = values.numParcelasTotal - parcelasRest;
                                                            const valorQuitado = parcelasPagas * values.valorParcela;
                                                            const valorRest = values.pagTotal - valorQuitado;

                                                            setFieldValue('valorRest', parseFloat(valorRest.toFixed(2)));
                                                            setFieldValue('valorQuitado', parseFloat(valorQuitado.toFixed(2)));
                                                        }
                                                    }}
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaMoneyBill />Valor Quitado</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='valorQuitado'
                                                        placeholder='Quitado'
                                                        min='0'
                                                        step='0.01'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabelRequired><FaMoneyBill />Valor Rest.</FormInputLabelRequired>
                                                <FormInput
                                                    type='number'
                                                    name='valorRest'
                                                    placeholder='Valor Restante'
                                                    min='0'
                                                    step='0.01'
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start'
                                                    }}>
                                                        <Field
                                                            type='checkbox'
                                                            name='notaFiscal'
                                                            style={{
                                                                marginRight: '10px',
                                                            }}
                                                        />
                                                        <FormInputLabelRequired htmlFor='notaFiscal'>Nota Fiscal Emitida?</FormInputLabelRequired>
                                                    </div>
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-start'
                                                }}>
                                                    <Field
                                                        type='checkbox'
                                                        name='terceiro'
                                                        style={{
                                                            marginRight: '10px',
                                                        }}
                                                    />
                                                    <FormInputLabelRequired htmlFor='terceiro'>Cliente de Terceiro?</FormInputLabelRequired>
                                                </div>
                                            </FormInputArea>
                                        </SubItensContainer>
                                    </FormContent>
                                    <ButtonGroup>
                                        <BackButton type='button' onClick={() => toggleModal('edit', false)}>Voltar</BackButton>
                                        {
                                            isSubmitting && (
                                                <ThreeDots color={colors.icon} />
                                            )
                                        }
                                        {
                                            !isSubmitting && (
                                                <SubmitButton type='submit'>Cadastrar</SubmitButton>
                                            )
                                        }
                                    </ButtonGroup>
                                </Form>
                            )
                        }
                    </Formik>
                </StyledFormArea>
            </Modal>
            <Modal
                isOpen={modalState.delete}
                onRequestClose={() => toggleModal('delete', false)}
                style={ModalStyles}
            >
                <DeleteContainer>
                    <DeleteTitle>Deseja deletar o cliente {currentClient.nome}?</DeleteTitle>
                    <DeleteButtonContainer>
                        <BackButton type="button" onClick={() => toggleModal('delete', false)}>Voltar</BackButton>
                        {!isDeleting ? (
                            <SubmitButton
                                type="button"
                                onClick={() => {
                                    deleteClientFinanceiro(currentClient.id, user, setIsDeleting, setLoading, toggleModal, setContractsLoading);
                                }}
                            >
                                Deletar
                            </SubmitButton>
                        ) : (
                            <ThreeDots color={colors.icon} width={100} />
                        )}
                    </DeleteButtonContainer>
                </DeleteContainer>
            </Modal>
            <Modal
                isOpen={modalState.importar}
                onRequestClose={() => toggleModal('importar', false)}
                style={ModalStyles}
            >
                <StyledFormArea>
                    <div style={{ display: 'flex', marginBottom: '30px', alignItems: 'center', justifyContent: 'center' }}>
                        <ClientTitle><FaFileInvoice /> Importar Cliente</ClientTitle>
                    </div>
                    {
                        importing ? (
                            <>
                                <Formik
                                    initialValues={{
                                        nome: currentClient.nome,
                                        numParcelasTotal: currentClient.numParcelasTotal,
                                        valorParcela: currentClient.valorParcela,
                                        pagTotal: currentClient.pagTotal,
                                        custoImplantacao: currentClient.custoImplantacao,
                                        lucro: currentClient.lucro,
                                        numParcelasRest: currentClient.numParcelasRest,
                                        valorQuitado: currentClient.valorQuitado,
                                        valorRest: currentClient.valorRest,
                                        sePagou: currentClient.sePagou,
                                        notafiscal: currentClient.notafiscal,
                                        terceiro: currentClient.terceiro,
                                        contractId: currentClient.contractId,
                                    }}

                                    validationSchema={
                                        Yup.object({
                                            nome: Yup.string().required('Nome é obrigatório'),
                                            numParcelasTotal: Yup.number().nullable().required('Numero de parcelas é obrigatório'),
                                            valorParcela: Yup.number().nullable().required('Valor da parcela é obrigatório'),
                                            pagTotal: Yup.number().nullable().required('Total é obrigatório'),
                                            custoImplantacao: Yup.number().nullable().required('Custo é obrigatório'),
                                            lucro: Yup.number().nullable().required('Lucro é obrigatório'),
                                            numParcelasRest: Yup.number().nullable().required('Parcelas Restantes é obrigatório'),
                                            valorQuitado: Yup.number().nullable().required('Valor quitado é Obrigatório'),
                                            valorRest: Yup.number().nullable().required('Valor restante é obrigatório'),
                                            sePagou: Yup.boolean(),
                                            notafiscal: Yup.boolean(),
                                            terceiro: Yup.boolean(),
                                        })
                                    }

                                    onSubmit={(values, { setSubmitting, setFieldError }) => {
                                        createClientImporting(values, user, setSubmitting, setFieldError, setLoading, toggleModal, setContractsLoading, setCurrentClient, setImporting);
                                    }}
                                >
                                    {
                                        ({ isSubmitting, setFieldValue, values }) => (
                                            <Form>
                                                <FormContent>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaIdCard />Nome</FormInputLabelRequired>
                                                        <FormInput
                                                            type='text'
                                                            name='nome'
                                                            placeholder='Nome do cliente'
                                                            autoComplete='nome'
                                                        />
                                                    </FormInputArea>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaMoneyBill />Valor Parcela</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='number'
                                                                    name='valorParcela'
                                                                    placeholder='Valor da Parcelas'
                                                                    min='0'
                                                                    step='0.01'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><TbNumber />Parcelas</FormInputLabelRequired>
                                                            <FormInput
                                                                type='number'
                                                                name='numParcelasTotal'
                                                                placeholder='Total de Parcelas'
                                                                min='0'
                                                                step='1'
                                                                onBlur={() => {
                                                                    const numParcelas = values.numParcelasTotal;
                                                                    if (!values.pagTotal && values.valorParcela >= 0 && numParcelas >= 0) {
                                                                        const valorTotal = numParcelas * values.valorParcela;
                                                                        setFieldValue('pagTotal', parseFloat(valorTotal.toFixed(2)));
                                                                    }
                                                                }}
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaMoneyBill />Pagamento Total</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='number'
                                                                    name='pagTotal'
                                                                    placeholder='Pagamaneto Total'
                                                                    min='0'
                                                                    step='0.01'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaMoneyBill />Custo</FormInputLabelRequired>
                                                            <FormInput
                                                                type='number'
                                                                name='custoImplantacao'
                                                                placeholder='Custo Total'
                                                                min='0'
                                                                step='0.01'
                                                                onBlur={() => {
                                                                    const custo = values.custoImplantacao;
                                                                    if (values.pagTotal >= 0 && custo >= 0) {
                                                                        const lucro = values.pagTotal - custo;
                                                                        setFieldValue('lucro', parseFloat(lucro.toFixed(2)));
                                                                    }
                                                                }}
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaMoneyBill />Lucro</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='number'
                                                                    name='lucro'
                                                                    placeholder='Lucro'
                                                                    min='0'
                                                                    step='0.01'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><TbNumber />Parcelas Rest.</FormInputLabelRequired>
                                                            <FormInput
                                                                type='number'
                                                                name='numParcelasRest'
                                                                placeholder='Parcelas Restante'
                                                                min='0'
                                                                step='1'
                                                                onBlur={() => {
                                                                    const parcelasRest = values.numParcelasRest;
                                                                    if (values.pagTotal >= 0 && values.numParcelasTotal >= 0 && parcelasRest >= 0 && values.valorParcela >= 0) {
                                                                        const parcelasPagas = values.numParcelasTotal - parcelasRest;
                                                                        const valorQuitado = parcelasPagas * values.valorParcela;
                                                                        const valorRest = values.pagTotal - valorQuitado;

                                                                        setFieldValue('valorRest', parseFloat(valorRest.toFixed(2)));
                                                                        setFieldValue('valorQuitado', parseFloat(valorQuitado.toFixed(2)));
                                                                    }
                                                                }}
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaMoneyBill />Valor Quitado</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='number'
                                                                    name='valorQuitado'
                                                                    placeholder='Quitado'
                                                                    min='0'
                                                                    step='0.01'
                                                                />
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaMoneyBill />Valor Rest.</FormInputLabelRequired>
                                                            <FormInput
                                                                type='number'
                                                                name='valorRest'
                                                                placeholder='Valor Restante'
                                                                min='0'
                                                                step='0.01'
                                                            />
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                    <SubItensContainer>
                                                        <Limitador>
                                                            <FormInputArea>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'flex-start'
                                                                }}>
                                                                    <Field
                                                                        type='checkbox'
                                                                        name='notaFiscal'
                                                                        style={{
                                                                            marginRight: '10px',
                                                                        }}
                                                                    />
                                                                    <FormInputLabelRequired htmlFor='notaFiscal'>Nota Fiscal Emitida?</FormInputLabelRequired>
                                                                </div>
                                                            </FormInputArea>
                                                        </Limitador>
                                                        <FormInputArea>
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'flex-start'
                                                            }}>
                                                                <Field
                                                                    type='checkbox'
                                                                    name='terceiro'
                                                                    style={{
                                                                        marginRight: '10px',
                                                                    }}
                                                                />
                                                                <FormInputLabelRequired htmlFor='terceiro'>Cliente de Terceiro?</FormInputLabelRequired>
                                                            </div>
                                                        </FormInputArea>
                                                    </SubItensContainer>
                                                </FormContent>
                                                <ButtonGroup>
                                                    <BackButton type='button' onClick={() => {
                                                        setClientImporting({});
                                                        setCurrentClient({});
                                                        setImporting(false);
                                                    }}>Voltar</BackButton>
                                                    {
                                                        isSubmitting && (
                                                            <ThreeDots color={colors.icon} />
                                                        )
                                                    }
                                                    {
                                                        !isSubmitting && (
                                                            <SubmitButton type='submit'>Cadastrar</SubmitButton>
                                                        )
                                                    }
                                                </ButtonGroup>
                                            </Form>
                                        )
                                    }
                                </Formik>
                            </>
                        ) : (
                            <>
                                <FormInputArea>
                                    <FormContractSelect contracts={contracts} setSelectedContract={setClientImporting} />
                                </FormInputArea>
                                <ButtonGroup>
                                    <BackButton type='button' onClick={() => toggleModal('importar', false)}>Voltar</BackButton>
                                    <SubmitButton type='button' onClick={() => handleImport()}>Avançar</SubmitButton>
                                </ButtonGroup>
                            </>
                        )
                    }
                </StyledFormArea>
            </Modal>
        </ClientFinancialContainer>
    );
}

export default ClientsSegment;