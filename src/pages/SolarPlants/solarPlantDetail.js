import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getErrorListData, getSolarPlantById, getSolarPlantParams } from "../../services/solarPlantServices";
import Loading from "../../components/Loading";
import {
    BoltIconContainer,
    Card,
    CardInner,
    CardInnerContent,
    CardInnerContentContainer,
    CardInnerTitle,
    Chart,
    ChartLeftIconContainer,
    ChartRightIconContainer,
    ChartsCards,
    ChartSelectedDateContainer,
    ChartTitle,
    ChartTitleContainer,
    ChartTitleContent,
    ChartTypeButton,
    ChartTypeSelectedContainer,
    Device,
    DeviceCardContainer,
    DeviceCardContent,
    DeviceCardIconContainer,
    DeviceCards,
    Greeting,
    InfoDeviceIconContainer,
    InfoHome,
    InfoHomeCard,
    InfoHomeDetail,
    InfoHomeTitle,
    InforHomeIconContainer,
    LoadingchartContainer,
    MainCards,
    SelectedChartContainer,
    SelectedErrorDateContainer,
    SolarPlantDetailHeader,
    SolarPlantsContainer,
    StyledThead,
    TableBodyContainer,
    TableBodyContent,
    TableError,
    TableHeaderContainer,
    TableHeaderContent,
    TitleContent,
    TitleDescription,
    TitleDetailContainer,
    TitleIconContainer,
} from "./styles";
import { FaAddressBook, FaBolt, FaBug, FaHome, FaPager, FaQuestion } from "react-icons/fa";
import Pagination from "../../components/Pagination";
import { ThreeDots } from "react-loader-spinner";
import { colors } from "../../utils/GlobalStyles";
import DatePicker from "react-date-picker";
import 'react-date-picker/dist/DatePicker.css';
import Graphic from "../../components/Graphic";

const SolarPlantDetail = ({ user, navigate }) => {
    const { solarPlantId } = useParams();

    const [solarPlant, setSolarPlant] = useState({});
    const [solarPlantParams, setSolarPlantParams] = useState({});

    const [powerData, setPowerData] = useState([]);
    const [errorList, setErrorList] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingParams, setLoadingParams] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);
    const [loadingErrorList, setLoadingErrorList] = useState(false);

    const [errorDate, setErrorDate] = useState(new Date());
    const [chartDate, setChartDate] = useState(new Date());
    const [chartType, setChartType] = useState('time');

    const [page, setPage] = useState(1);

    useEffect(() => {
        if (loading) {
            getSolarPlantById(solarPlantId, user, setSolarPlant, setLoading);
        }
    }, [loading, user, solarPlantId]);

    useEffect(() => {
        if (!loading && loadingParams) {
            getSolarPlantParams(solarPlant, user, setSolarPlantParams, setLoadingParams, setPowerData, setErrorList);
        }
    }, [loading, loadingParams, user, solarPlant]);

    useEffect(() => {
        if (loadingErrorList) {
            getErrorListData(solarPlant, solarPlantParams, errorDate.getFullYear(), user, setErrorList, setLoadingErrorList);
        }
    }, [loadingErrorList, solarPlant, solarPlantParams, errorDate, user]);

    const itensPerPage = 5;

    const totalPages = Math.ceil(errorList.length / itensPerPage);
    const currentPageItens = errorList.slice((page - 1) * itensPerPage, page * itensPerPage);

    return (
        <>
            {
                (loadingParams) ? (
                    <Loading />
                ) : (
                    <SolarPlantsContainer>
                        <SolarPlantDetailHeader>
                            <TitleDetailContainer>
                                <TitleIconContainer>
                                    <FaAddressBook />
                                </TitleIconContainer>
                                <Greeting>
                                    <TitleContent>{solarPlant.client.name}</TitleContent>
                                    <TitleDescription>Planta solar instalada por: {solarPlant.user.name}</TitleDescription>
                                </Greeting>
                            </TitleDetailContainer>
                            <InfoHome>
                                <InforHomeIconContainer>
                                    <FaHome />
                                </InforHomeIconContainer>
                                {
                                    solarPlantParams.weather.status === 'permission denied' ?
                                        (
                                            <InfoHomeCard>
                                                <InfoHomeTitle> - °C</InfoHomeTitle>
                                                <InfoHomeDetail> ----- </InfoHomeDetail>
                                                <InfoHomeDetail> Nascer do Sol - Por do Sol</InfoHomeDetail>
                                                <InfoHomeDetail>- - -</InfoHomeDetail>
                                            </InfoHomeCard>
                                        ) : (
                                            <InfoHomeCard>
                                                <InfoHomeTitle>
                                                    {solarPlantParams.weather.now.tmp}°C
                                                </InfoHomeTitle>
                                                <InfoHomeDetail>{solarPlantParams.weather.now.cond_txt} -- {solarPlantParams.weather.basic.location} / {solarPlantParams.weather.basic.admin_area}</InfoHomeDetail>
                                                <InfoHomeDetail>Nascer do Sol - Por do Sol</InfoHomeDetail>
                                                <InfoHomeDetail>{solarPlantParams.weather.basic.sr} - {solarPlantParams.weather.basic.ss}</InfoHomeDetail>
                                            </InfoHomeCard>
                                        )
                                }
                            </InfoHome>
                        </SolarPlantDetailHeader>
                        <MainCards>
                            <Card>
                                <BoltIconContainer>
                                    <FaBolt />
                                </BoltIconContainer>
                                <CardInner>
                                    <CardInnerTitle>{parseFloat(solarPlantParams.totalData.eToday) < 1000 ? (parseFloat(solarPlantParams.totalData.eToday)).toFixed(2) : (solarPlantParams.totalData.eToday / 1000).toFixed(2)}</CardInnerTitle>
                                    <CardInnerContentContainer>
                                        <CardInnerContent>{solarPlantParams.totalData.eToday < 1000 ? 'kWh' : 'MWh'}</CardInnerContent>
                                        <CardInnerContent>hoje</CardInnerContent>
                                    </CardInnerContentContainer>
                                </CardInner>
                            </Card>
                            <Card>
                                <BoltIconContainer>
                                    <FaBolt />
                                </BoltIconContainer>
                                <CardInner>
                                    <CardInnerTitle>{solarPlantParams.totalData.eMonth < 1000 ? (parseFloat(solarPlantParams.totalData.eMonth)).toFixed(2) : (solarPlantParams.totalData.eMonth / 1000).toFixed(2)}</CardInnerTitle>
                                    <CardInnerContentContainer>
                                        <CardInnerContent>{solarPlantParams.totalData.eMonth < 1000 ? 'kWh' : 'MWh'}</CardInnerContent>
                                        <CardInnerContent>Mês</CardInnerContent>
                                    </CardInnerContentContainer>
                                </CardInner>
                            </Card>
                            <Card>
                                <BoltIconContainer>
                                    <FaBolt />
                                </BoltIconContainer>
                                <CardInner>
                                    <CardInnerTitle>{solarPlantParams.totalData.eTotal < 1000 ? (parseFloat(solarPlantParams.totalData.eTotal)).toFixed(2) : (solarPlantParams.totalData.eTotal / 1000).toFixed(2)}</CardInnerTitle>
                                    <CardInnerContentContainer>
                                        <CardInnerContent>{solarPlantParams.totalData.eTotal < 1000 ? 'kWh' : 'MWh'}</CardInnerContent>
                                        <CardInnerContent>Total</CardInnerContent>
                                    </CardInnerContentContainer>
                                </CardInner>
                            </Card>
                        </MainCards>
                        <ChartsCards>
                            <Chart>
                                <ChartTitle>
                                    <ChartTitleContainer>
                                        <ChartTitleContent>Geração Solar</ChartTitleContent>
                                    </ChartTitleContainer>
                                    <ChartLeftIconContainer>
                                        <FaBolt />
                                    </ChartLeftIconContainer>
                                </ChartTitle>
                                <SelectedChartContainer>
                                    <ChartSelectedDateContainer>
                                        <DatePicker
                                            onChange={(value) => {
                                                setChartDate(value);
                                                setLoadingChart(true);
                                            }}
                                            value={chartDate}
                                            clearIcon={null}
                                            maxDetail={chartType === 'time' ? 'month' : chartType === 'day' ? 'year' : chartType === 'mouth' ? 'decade' : 'decade'}
                                            minDetail={chartType === 'time' ? 'month' : chartType === 'day' ? 'year' : chartType === 'mouth' ? 'decade' : 'decade'}
                                        />
                                    </ChartSelectedDateContainer>
                                    <ChartTypeSelectedContainer>
                                        <ChartTypeButton onClick={() => {
                                            setChartType('time');
                                            setLoadingChart(true);
                                        }}>
                                            Time
                                        </ChartTypeButton>
                                        <ChartTypeButton onClick={() => {
                                            setChartType('day');
                                            setLoadingChart(true);
                                        }}>
                                            Day
                                        </ChartTypeButton>
                                        <ChartTypeButton onClick={() => {
                                            setChartType('mouth');
                                            setLoadingChart(true);
                                        }}>
                                            Mouth
                                        </ChartTypeButton>
                                        <ChartTypeButton onClick={() => {
                                            setChartType('year');
                                            setLoadingChart(true);
                                        }}>
                                            Year
                                        </ChartTypeButton>
                                    </ChartTypeSelectedContainer>
                                </SelectedChartContainer>
                                {
                                    loadingChart ? (
                                        <LoadingchartContainer>
                                            <ThreeDots
                                                color={colors.icon}
                                                width={350}
                                            />
                                        </LoadingchartContainer>
                                    ) : (
                                        <Graphic powerData={powerData} type={chartType} inverter={solarPlant.inversor} estimated={solarPlant.estimatedGeneration} />
                                    )
                                }
                            </Chart>
                            <Chart>
                                <ChartTitle>
                                    <ChartTitleContainer>
                                        <ChartTitleContent>Histórico de Erros</ChartTitleContent>
                                    </ChartTitleContainer>
                                    <ChartRightIconContainer>
                                        <FaBug />
                                    </ChartRightIconContainer>
                                </ChartTitle>
                                <SelectedErrorDateContainer>
                                    <DatePicker
                                        onChange={(value) => {
                                            setErrorDate(value);
                                            setLoadingErrorList(true);
                                        }}
                                        value={errorDate}
                                        format={'y'}
                                        maxDetail={'decade'}
                                        minDetail={'decade'}
                                        clearIcon={null}
                                    />
                                </SelectedErrorDateContainer>
                                {
                                    loadingErrorList ? (
                                        <LoadingchartContainer>
                                            <ThreeDots color={colors.icon} width={100} />
                                        </LoadingchartContainer>
                                    ) : (
                                        <>
                                            <TableError>
                                                <StyledThead>
                                                    <TableHeaderContainer>
                                                        <TableHeaderContent>Device Serial Number</TableHeaderContent>
                                                        <TableHeaderContent className="label-responsive">Alias</TableHeaderContent>
                                                        <TableHeaderContent className="label-responsive">Device Type</TableHeaderContent>
                                                        <TableHeaderContent>Time</TableHeaderContent>
                                                        <TableHeaderContent>Event SN</TableHeaderContent>
                                                        <TableHeaderContent>Fault Description</TableHeaderContent>
                                                        <TableHeaderContent className="label-responsive">Solution</TableHeaderContent>
                                                    </TableHeaderContainer>
                                                    {
                                                        currentPageItens.map((element, i) => (
                                                            <TableBodyContainer key={i}>
                                                                <TableBodyContent>{element.sn}</TableBodyContent>
                                                                <TableBodyContent className="label-responsive">{element.alias}</TableBodyContent>
                                                                <TableBodyContent className="label-responsive">{element.deviceType}</TableBodyContent>
                                                                <TableBodyContent>{element.time}</TableBodyContent>
                                                                <TableBodyContent>{element.eventId}</TableBodyContent>
                                                                <TableBodyContent>{element.eventName}</TableBodyContent>
                                                                <TableBodyContent className="label-responsive">{element.solution}</TableBodyContent>
                                                            </TableBodyContainer>
                                                        ))
                                                    }
                                                </StyledThead>
                                            </TableError>
                                            <Pagination currentPage={page} setPage={setPage} totalPages={totalPages} />
                                        </>
                                    )
                                }
                            </Chart>
                        </ChartsCards>
                        <Device>
                            <DeviceCards>
                                <DeviceCardIconContainer>
                                    <FaPager />
                                </DeviceCardIconContainer>
                                <DeviceCardContainer>
                                    <DeviceCardContent>
                                        Device serial Number: {solarPlantParams.deviceSN.alias}
                                        <InfoDeviceIconContainer>
                                            <FaQuestion />
                                        </InfoDeviceIconContainer>
                                    </DeviceCardContent>
                                    <DeviceCardContent>UserName: {solarPlant.login}</DeviceCardContent>
                                    <DeviceCardContent>Password: {solarPlant.password}</DeviceCardContent>
                                </DeviceCardContainer>
                                <DeviceCardContainer>
                                    <DeviceCardContent>Status: {solarPlantParams.deviceSN.status === '1' ? <span style={{ color: `${colors.greenNeutral}` }}>ONLINE</span> : solarPlantParams.deviceSN.status === '0' ? <span style={{ color: 'blue' }}>SLEEPING</span> : <span style={{ color: 'red' }}>OFFLINE</span>}</DeviceCardContent>
                                    <DeviceCardContent>Plant Name: {solarPlantParams.deviceSN.plantName}</DeviceCardContent>
                                </DeviceCardContainer>
                                <DeviceCardContainer>
                                    <DeviceCardContent>Update Time: {solarPlantParams.deviceSN.lastUpdateTime}</DeviceCardContent>
                                    <DeviceCardContent>
                                        Data Logger: {solarPlantParams.deviceSN.datalogSn}
                                        <InfoDeviceIconContainer>
                                            <FaQuestion />
                                        </InfoDeviceIconContainer>
                                    </DeviceCardContent>
                                </DeviceCardContainer>
                                <DeviceCardContainer>
                                    <DeviceCardContent>Rated Power: {solarPlant.inversor === 'GROWATT' ? (parseFloat(solarPlantParams.deviceSN.nominalPower) / 1000).toFixed(2) : solarPlantParams.deviceSN.nominalPower} kWp</DeviceCardContent>
                                    <DeviceCardContent>Current Power: {(parseFloat(solarPlantParams.deviceSN.pac) / 1000).toFixed(2)} kWp</DeviceCardContent>
                                </DeviceCardContainer>
                            </DeviceCards>
                        </Device>
                    </SolarPlantsContainer>
                )
            }
        </>
    );
}

export default SolarPlantDetail;