import { useState, useEffect } from "react";
import {
    IconWrapper,
    NoContentActionContainer,
    NoContentContainer,
    SolarPlantContent,
    SolarPlantHeader,
    SolarPlantsContainer,
    SolarPlantTitle,
    TextContent,
} from "./styles";
import Loading from "../../components/Loading";
import { FaSolarPanel } from "react-icons/fa";
import SearchBar from "../../components/SearchBar";
import SolarPlantList from "./solarPlantList";
import { getSolarPlantsByUserLoggedIn } from "../../services/solarPlantServices";

const SolarPlants = ({ navigate, user }) => {

    const [solarPlants, setSolarPlants] = useState([]);
    const [userInfo, setUserInfo] = useState({});

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (loading) {
            getSolarPlantsByUserLoggedIn(user, setSolarPlants, setUserInfo, setLoading);
        }
    }, [user, loading]);

    return (
        <SolarPlantsContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <SolarPlantHeader>
                            <SolarPlantTitle><FaSolarPanel />Plantas Solares de {userInfo.name}</SolarPlantTitle>
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
                                            <TextContent>Nenhuma planta solar encontrada para o usuário.</TextContent>
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
    )
}

export default SolarPlants;