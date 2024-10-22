import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSolarPlantsByClientId } from "../../services/solarPlantServices";
import Loading from "../../components/Loading";
import {
    AddIcon,
    AddSolarPlantButton,
    AddSolarPlantContainer,
    AddText,
    IconWrapper,
    NoContentActionContainer,
    NoContentContainer,
    SolarPlantContent,
    SolarPlantHeader,
    SolarPlantsContainer,
    SolarPlantTitle,
    TextContent,
} from "./styles";
import { FaPlus, FaPlusCircle, FaSolarPanel } from "react-icons/fa";
import { colors } from "../../utils/GlobalStyles";
import SolarPlantList from "./solarPlantList";
import SearchBar from "../../components/SearchBar";

const SolarPlantsClient = ({ navigate, user }) => {

    const { clientId } = useParams();
    const [solarPlants, setSolarPlants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (loading) {
            getSolarPlantsByClientId(clientId, user, setSolarPlants, setLoading);
        }
    }, [user, loading, clientId]);

    return (
        <SolarPlantsContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <SolarPlantHeader>
                            <SolarPlantTitle><FaSolarPanel />Plantas Solares</SolarPlantTitle>
                            <AddSolarPlantContainer onClick={() => navigate(`/plantas-solares/cliente/${clientId}/nova`)}>
                                <AddIcon>
                                    <FaPlusCircle />
                                </AddIcon>
                                <AddText>Adicionar</AddText>
                            </AddSolarPlantContainer>
                        </SolarPlantHeader>
                        <SolarPlantContent>
                            <SearchBar search={search} setSearch={setSearch} />
                            {
                                solarPlants.length === 0 ? (
                                    <NoContentContainer>
                                        <IconWrapper>
                                            <FaSolarPanel />
                                        </IconWrapper>
                                        <NoContentActionContainer>
                                            <TextContent>Nenhuma planta solar encontrada para o cliente.</TextContent>
                                            <AddSolarPlantButton onClick={() => navigate(`/plantas-solares/cliente/${clientId}/nova`)}>
                                                <FaPlus color={colors.icon} fontSize={15} className="icon-add-button" /> Nova Planta
                                            </AddSolarPlantButton>
                                        </NoContentActionContainer>
                                    </NoContentContainer>
                                ) : (
                                    <SolarPlantList
                                        solarPlants={solarPlants}
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
                        </SolarPlantContent>
                    </>
                )
            }
        </SolarPlantsContainer>
    );
}

export default SolarPlantsClient;