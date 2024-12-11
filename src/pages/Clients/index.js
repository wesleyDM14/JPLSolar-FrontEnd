import { FaPlus, FaPlusCircle, FaUsers } from "react-icons/fa";
import {
    AddClientButton,
    AddClientContainer,
    AddIcon,
    AddText,
    ClientContent,
    ClientHeader,
    ClientsContainer,
    ClientTitle,
    IconWrapper,
    NoContentActionContainer,
    NoContentContainer,
    TextContent,
} from "./styles";
import SearchBar from "../../components/SearchBar";
import { useState } from "react";
import ClientList from "./clientList";
import { colors } from "../../utils/GlobalStyles";
import { useEffect } from "react";
import { getClientsByUserLoggedIn } from "../../services/clientServices";
import Loading from "../../components/Loading";

const Clients = ({ navigate, user }) => {
    const [clients, setClients] = useState([]);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (loading) {
            getClientsByUserLoggedIn(user, setClients, setLoading);
        }
    }, [user, loading]);

    return (
        <ClientsContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <ClientHeader>
                            <ClientTitle><FaUsers style={{ marginRight: '10px' }} />Clientes</ClientTitle>
                            <AddClientContainer onClick={() => navigate('/clientes/novo')}>
                                <AddIcon>
                                    <FaPlusCircle />
                                </AddIcon>
                                <AddText>Adicionar Novo</AddText>
                            </AddClientContainer>
                        </ClientHeader>
                        <ClientContent>
                            <SearchBar search={search} setSearch={setSearch} />
                            {
                                clients.length === 0 ? (
                                    <NoContentContainer>
                                        <IconWrapper>
                                            <FaUsers />
                                        </IconWrapper>
                                        <NoContentActionContainer>
                                            <TextContent>Nenhum Cliente encontrado.</TextContent>
                                            <AddClientButton onClick={() => navigate('/clientes/novo')}>
                                                <FaPlus color={colors.icon} fontSize={15} className="icon-add-button" /> Novo Cliente
                                            </AddClientButton>
                                        </NoContentActionContainer>
                                    </NoContentContainer>
                                ) : (
                                    <ClientList
                                        clients={clients}
                                        itensPerPage={itemsPerPage}
                                        navigate={navigate}
                                        page={page}
                                        setPage={setPage}
                                        search={search}
                                        setLoading={setLoading}
                                        user={user}
                                    />
                                )
                            }
                        </ClientContent>
                    </>
                )
            }
        </ClientsContainer>
    )
}

export default Clients;