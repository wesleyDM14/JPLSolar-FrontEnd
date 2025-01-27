import Modal from 'react-modal';
import { useEffect, useMemo, useState } from "react";
import {
    AddFinanceiroButtonIconContainer,
    AddFinanceiroContainer,
    AddFinanceiroText,
    AdminContainer,
    BackButton,
    ClientFinancialContainer,
    ClientFinancialHeader,
    ClientFinancialListContainer,
    ClientFinancialListContent,
    ClientFinancialListHeader,
    ClientFinancialListLabel,
    ClientFinancialListValue,
    DeleteButtonContainer,
    DeleteContainer,
    DeleteIconContainer,
    DeleteTitle,
    EditIconContainer,
    LegendaContent,
    LegendaIcone,
    LegendaText,
    StyledFormArea,
    SubmitButton,
    TerceiroSwitchButton,
    TerceiroSwitchContainer,
    TerceiroSwitchTitle,
} from "./styles";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { FaEdit, FaPlusCircle, FaThumbsDown, FaThumbsUp, FaTrashAlt } from "react-icons/fa";
import Loading from "../../components/Loading";
import { formatCurrencyBRL } from "../../utils/formatString";
import { colors, ModalStyles } from '../../utils/GlobalStyles';
import { ThreeDots } from 'react-loader-spinner';
import { deleteClientFinanceiro, getClientsFinanceiro } from '../../services/financialServices';

const ClientsSegment = ({ user }) => {

    Modal.setAppElement(document.getElementById('root'));

    const [clients, setClients] = useState([]);
    const [clientTerceiros, setClientTerceiros] = useState([]);

    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const [modalState, setModalState] = useState({
        add: false,
        edit: false,
        delete: false,
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
                loading ? (
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
                    {/* Form Content for Adding Client */}
                </StyledFormArea>
            </Modal>
            <Modal
                isOpen={modalState.edit}
                onRequestClose={() => toggleModal('edit', false)}
                style={ModalStyles}
            >
                <StyledFormArea>
                    {/* Form Content for Editing Client */}
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
                                    deleteClientFinanceiro(currentClient.id, user, setIsDeleting, setLoading);
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
        </ClientFinancialContainer>
    );
}

export default ClientsSegment;