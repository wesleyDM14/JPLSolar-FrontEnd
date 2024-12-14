import { useEffect, useState } from "react";
import { getDashboardData } from "../../services/dashboardServices";
import {
    Card,
    CardDetail,
    CardIcon,
    CardInfo,
    CardProduction,
    CardsContainer,
    CardTitle,
    DashboardContainer,
    ErrorSection,
    Header,
    NavButton,
    SectionTitle,
    Title,
} from './styles';
import Loading from "../../components/Loading";
import { FaBolt, FaCircle, FaExclamationTriangle, FaHouzz, FaRegMoon } from "react-icons/fa";

const Dashboard = ({ navigate, user }) => {

    const [loading, setLoading] = useState(true);
    const [solarPlants, setSolarPlants] = useState([]);
    const [solarPlantsWithError, setSolarPlantsWithError] = useState([]);
    const [totalUsinas, setTotalUsinas] = useState(0);
    const [totalPowerInstaled, setTotalPowerInstaled] = useState(0);
    const [visiblePlants, setVisiblePlants] = useState([]);
    const [exiting, setExiting] = useState(false);
    const [visibleErrorPlants, setVisibleErrorPlants] = useState([]);
    const [errorIndex, setErrorIndex] = useState(0);
    const [exitingErrorPlants, setExitingErrorPlants] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const renderIcon = (status) => {
        if (status === '1') return <FaCircle />;
        if (status === '0') return <FaRegMoon />;
        return <FaExclamationTriangle />;
    }

    useEffect(() => {
        if (loading) {
            getDashboardData(user, setLoading, setSolarPlants, setSolarPlantsWithError, setTotalUsinas, setTotalPowerInstaled);
        } else {
            const initialPlants = solarPlants.slice(0, Math.min(4, solarPlants.length));
            setVisiblePlants(initialPlants);
            setCurrentIndex(Math.min(4, solarPlants.length));
        }
    }, [loading, user, solarPlants]);

    useEffect(() => {
        const rotateInterval = setInterval(() => {
            if (solarPlants.length > 0) {
                setExiting(true); // Ativa a animação de saída

                // Aguarda a animação de saída antes de trocar os cards
                setTimeout(() => {
                    const nextPlants = [];

                    for (let i = 0; i < Math.min(4, solarPlants.length); i++) {
                        const nextIndex = (currentIndex + i) % solarPlants.length;

                        // Volta ao início se ultrapassar o total
                        nextPlants.push(solarPlants[nextIndex % solarPlants.length]);
                    }

                    setVisiblePlants(nextPlants);
                    setExiting(false); // Desativa a animação de saída

                    // Avança 4 posições ou volta ao início
                    setCurrentIndex((currentIndex + 4) % solarPlants.length);
                }, 500); // Tempo da animação de saída
            }
        }, 5000); // Troca a cada 5 segundos

        return () => clearInterval(rotateInterval);
    }, [solarPlants, currentIndex]);

    useEffect(() => {
        // Inicializa as plantas com erro a partir de solarPlantsWithError
        setVisibleErrorPlants(solarPlantsWithError.slice(errorIndex, errorIndex + 8));
    }, [errorIndex, solarPlantsWithError]);

    const handleErrorNavigation = (direction) => {
        if (solarPlantsWithError.length > 0) {
            setExitingErrorPlants(true); // Ativa a animação de saída para as usinas com erro

            // Calcula o novo índice com base na direção (1 = próximo, -1 = anterior)
            let newIndex = errorIndex + direction;

            // Se o índice ultrapassar o número de "páginas", volta para o início
            if (newIndex < 0) {
                newIndex = Math.floor(solarPlantsWithError.length / 8);
            } else if (newIndex > Math.floor(solarPlantsWithError.length / 8)) {
                newIndex = 0;
            }

            // Atualiza o índice da "página"
            setErrorIndex(newIndex);

            // Define as usinas que serão visíveis nesta "página"
            const startIdx = newIndex * 8;
            const endIdx = Math.min(startIdx + 8, solarPlantsWithError.length);
            const nextErrorPlants = solarPlantsWithError.slice(startIdx, endIdx);

            // Aguarda a animação de saída antes de mostrar as próximas usinas com erro
            setTimeout(() => {
                setVisibleErrorPlants(nextErrorPlants);
                setExitingErrorPlants(false); // Desativa a animação de saída após o tempo
            }, 200); // Tempo da animação de saída
        }
    };

    return (
        <DashboardContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <Header>
                            <Title>Painel de Controle - JPL Solar</Title>
                        </Header>
                        <CardsContainer>
                            <Card>
                                <CardIcon $status='1'>
                                    <FaHouzz />
                                </CardIcon>
                                <CardTitle>Total de Usinas</CardTitle>
                                <CardProduction>{totalUsinas}</CardProduction>
                            </Card>
                            <Card>
                                <CardIcon $status='1'>
                                    <FaBolt />
                                </CardIcon>
                                <CardTitle>Potência Instalada</CardTitle>
                                <CardProduction>{totalPowerInstaled}</CardProduction>
                            </Card>
                        </CardsContainer>

                        {solarPlantsWithError.length > 0 && (
                            <ErrorSection $cardCount={visibleErrorPlants.length}>
                                <SectionTitle>Usinas com Erro</SectionTitle>
                                <CardsContainer>
                                    {visibleErrorPlants.map((plant, i) => (
                                        <Card key={i} $isExiting={exitingErrorPlants} onClick={() => navigate(`/plantas-solares/${plant.id}`)} style={{ display: exitingErrorPlants ? 'none' : 'flex' }}>
                                            <CardIcon $status={plant.status}>
                                                {renderIcon(plant.status)}
                                            </CardIcon>
                                            <CardInfo>
                                                <CardTitle>{plant.solarPlantCode}</CardTitle>
                                                <CardDetail>Cliente: {plant.clientName}</CardDetail>
                                            </CardInfo>
                                            <CardProduction>
                                                <FaBolt />
                                                {plant.eTotal > 1000
                                                    ? `${(plant.eTotal / 1000)?.toFixed(2)} MWh`
                                                    : `${plant.eTotal?.toFixed(2)} kWh`}
                                            </CardProduction>
                                        </Card>
                                    ))}
                                </CardsContainer>
                                <NavButton className="left" onClick={(e) => {
                                    e.stopPropagation();
                                    handleErrorNavigation(-1);
                                }}>&lt;</NavButton>
                                <NavButton className="right" onClick={(e) => {
                                    e.stopPropagation();
                                    handleErrorNavigation(1);
                                }}>&gt;</NavButton>
                            </ErrorSection>
                        )}

                        <CardsContainer>
                            {
                                visiblePlants.map((plant, i) => (
                                    <Card key={i} $isExiting={exiting} onClick={() => navigate(`/plantas-solares/${plant.id}`)}>
                                        <CardIcon $status={plant.status}>
                                            {renderIcon(plant.status)}
                                        </CardIcon>
                                        <CardInfo>
                                            <CardTitle>{plant.solarPlantCode}</CardTitle>
                                            <CardDetail>Cliente: {plant.clientName}</CardDetail>
                                        </CardInfo>
                                        <CardProduction>
                                            <FaBolt />
                                            {plant.eTotal > 1000
                                                ? `${(plant.eTotal / 1000)?.toFixed(2)} MWh`
                                                : `${plant.eTotal?.toFixed(2)} kWh`}
                                        </CardProduction>
                                    </Card>
                                ))
                            }
                        </CardsContainer>
                    </>
                )
            }
        </DashboardContainer>
    )
}

export default Dashboard;