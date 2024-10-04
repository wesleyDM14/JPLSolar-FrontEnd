import { useEffect, useState } from "react";
import { getContractsByUserId } from "../../services/contractService";
import {
    AddContractContainer,
    AddIcon,
    AddText,
    ContractContent,
    ContractHeader,
    ContractsContainer,
    ContractTitle,
    IconWrapper,
    NoContentActionContainer,
    NoContentContainer,
    TextContent,
} from "./styles";
import Loading from "../../components/Loading";
import { FaFileContract, FaPlus, FaPlusCircle } from "react-icons/fa";
import SearchBar from "../../components/SearchBar";
import { AddClientButton } from "../Clients/styles";
import { colors } from "../../utils/GlobalStyles";
import ContractList from "./contractList";

const Contracts = ({ navigate, user }) => {

    const [contratos, setContratos] = useState([]);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1);

    const itemsPerPage = 10;

    useEffect(() => {
        if (loading) {
            getContractsByUserId(user, setContratos, setLoading);
        }
    }, [loading, user]);

    return (
        <ContractsContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <ContractHeader>
                            <ContractTitle><FaFileContract style={{ marginRight: '10px' }} /> Contratos</ContractTitle>
                            <AddContractContainer onClick={() => navigate('/contratos/novo')}>
                                <AddIcon>
                                    <FaPlusCircle />
                                </AddIcon>
                                <AddText>Adicionar Novo</AddText>
                            </AddContractContainer>
                        </ContractHeader>
                        <ContractContent>
                            <SearchBar search={search} setSearch={setSearch} />
                            {
                                contratos.length === 0 ? (
                                    <NoContentContainer>
                                        <IconWrapper>
                                            <FaFileContract />
                                        </IconWrapper>
                                        <NoContentActionContainer>
                                            <TextContent>Nenhum Contrato encontrado.</TextContent>
                                            <AddClientButton onClick={() => navigate('/contratos/novo')}>
                                                <FaPlus color={colors.icon} fontSize={15} className="icon-add-button" /> Novo Contrato
                                            </AddClientButton>
                                        </NoContentActionContainer>
                                    </NoContentContainer>
                                ) : (
                                    <ContractList
                                        contracts={contratos}
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
                        </ContractContent>
                    </>
                )
            }
        </ContractsContainer>
    )
}

export default Contracts;