import { useEffect, useState } from "react";
import {
    AddIcon,
    AddPartnerButton,
    AddPartnerContainer,
    AddText,
    IconWrapper,
    NoContentActionContainer,
    NoContentContainer,
    PartnerContainer,
    PartnerContent,
    PartnerHeader,
    PartnerTitle,
    TextContent,
} from "./styles";
import Loading from "../../components/Loading";
import { GrUserWorker } from "react-icons/gr";
import { FaPlus, FaPlusCircle } from "react-icons/fa";
import SearchBar from "../../components/SearchBar";
import { colors } from "../../utils/GlobalStyles";
import { getPartnersByUserLoggedIn } from "../../services/partnerService";
import PartnerList from "./partnerList";

const Partners = ({ navigate, user }) => {

    const [partners, setPartners] = useState([]);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (loading) {
            getPartnersByUserLoggedIn(user, setPartners, setLoading);
        }
    }, [loading, user]);

    return (
        <PartnerContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <PartnerHeader>
                            <PartnerTitle><GrUserWorker style={{ marginRight: '10px' }} />Parceiros</PartnerTitle>
                            <AddPartnerContainer onClick={() => navigate('/parceiros/novo')}>
                                <AddIcon>
                                    <FaPlusCircle />
                                </AddIcon>
                                <AddText>Adicionar</AddText>
                            </AddPartnerContainer>
                        </PartnerHeader>
                        <PartnerContent>
                            <SearchBar search={search} setSearch={setSearch} />
                            {
                                partners.length === 0 ? (
                                    <NoContentContainer>
                                        <IconWrapper>
                                            <GrUserWorker />
                                        </IconWrapper>
                                        <NoContentActionContainer>
                                            <TextContent>Nenhum Parceiro encontrado.</TextContent>
                                            <AddPartnerButton onClick={() => navigate('/parceiros/novo')}>
                                                <FaPlus color={colors.icon} fontSize={15} className="icon-add-button" /> Novo Parceiro
                                            </AddPartnerButton>
                                        </NoContentActionContainer>
                                    </NoContentContainer>
                                ) : (
                                    <PartnerList
                                        partners={partners}
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
                        </PartnerContent>
                    </>
                )
            }
        </PartnerContainer>
    )
}

export default Partners;