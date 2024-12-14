import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPartnerById } from "../../services/partnerService";
import {
    BackButton,
    ButtonGroup,
    PartnerContainer,
    PartnerContent,
    PartnerDetailArea,
    PartnerDetailLabel,
    PartnerDetailMainContainer,
    PartnerDetailSection,
    PartnerDetailSectionSeparator,
    PartnerDetailSectionTitle,
    PartnerDetailValue,
} from "./styles";
import Loading from "../../components/Loading";
import { GrUserWorker } from "react-icons/gr";
import { FaWhatsapp } from "react-icons/fa";
import ContractList from "../Contracts/contractList";
import SearchBar from "../../components/SearchBar";
import { formatCurrencyBRL } from "../../utils/formatString";

const PartnerInfo = ({ navigate, user }) => {

    const { partnerId } = useParams();

    const [partner, setPartner] = useState({});
    const [loading, setLoading] = useState(true);
    const [receita, setReceita] = useState(0);

    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1);

    const itemsPerPage = 10;

    useEffect(() => {
        if (loading) {
            getPartnerById(partnerId, user, setPartner, setLoading, setReceita);
        }
    }, [loading, user, partnerId]);

    return (
        <PartnerContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <PartnerContent>
                            <PartnerDetailMainContainer>
                                <PartnerDetailSection>
                                    <PartnerDetailSectionTitle><GrUserWorker />Dados do Parceiro</PartnerDetailSectionTitle>
                                    <PartnerDetailSectionSeparator />
                                    <PartnerDetailArea>
                                        <PartnerDetailLabel>Nome: </PartnerDetailLabel>
                                        <PartnerDetailValue>{partner.name}</PartnerDetailValue>
                                    </PartnerDetailArea>
                                    <PartnerDetailArea>
                                        <PartnerDetailLabel>Contato: </PartnerDetailLabel>
                                        <PartnerDetailValue><FaWhatsapp /> {partner.phone}</PartnerDetailValue>
                                    </PartnerDetailArea>
                                    <PartnerDetailArea>
                                        <PartnerDetailLabel>Endereço: </PartnerDetailLabel>
                                        <PartnerDetailValue>{partner.address}</PartnerDetailValue>
                                    </PartnerDetailArea>
                                </PartnerDetailSection>
                                <PartnerDetailSection>
                                    <PartnerDetailSectionTitle><GrUserWorker />Dados de Contratos</PartnerDetailSectionTitle>
                                    <PartnerDetailSectionSeparator />
                                    <PartnerDetailArea>
                                        <PartnerDetailLabel>Quant. Contratos: </PartnerDetailLabel>
                                        <PartnerDetailValue>{partner.contracts.length}</PartnerDetailValue>
                                    </PartnerDetailArea>
                                    <PartnerDetailArea>
                                        <PartnerDetailLabel>Receita Gerada: </PartnerDetailLabel>
                                        <PartnerDetailValue>{formatCurrencyBRL(receita)}</PartnerDetailValue>
                                    </PartnerDetailArea>
                                </PartnerDetailSection>
                            </PartnerDetailMainContainer>
                            <SearchBar search={search} setSearch={setSearch} />
                            <ContractList
                                contracts={partner.contracts}
                                itensPerPage={itemsPerPage}
                                navigate={navigate}
                                page={page}
                                setPage={setPage}
                                search={search}
                                setLoading={setLoading}
                                user={user}
                            />
                            <ButtonGroup onClick={() => {
                                navigate(-1);
                            }}>
                                <BackButton>Voltar</BackButton>
                            </ButtonGroup>
                        </PartnerContent>
                    </>
                )
            }
        </PartnerContainer>
    );
}

export default PartnerInfo;