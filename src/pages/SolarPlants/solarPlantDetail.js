import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getChartByType, getErrorListData, getReportByPlantId, getSolarPlantById, getSolarPlantParams } from "../../services/solarPlantServices";
import Loading from "../../components/Loading";
import {
    BackButton,
    BoltIconContainer,
    ButtonGroup,
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
    GenerateReportContainer,
    GenerateReportIconContainer,
    GenerateReportTitle,
    Greeting,
    InfoDeviceIconContainer,
    InfoHome,
    InfoHomeCard,
    InfoHomeDetail,
    InfoHomeTitle,
    InforHomeIconContainer,
    LoadingchartContainer,
    MainCards,
    ModalButton,
    ModalContent,
    ModalLabel,
    ModalOverlay,
    ModalTitle,
    SelectedChartContainer,
    SelectedErrorDateContainer,
    SolarPlantDetailHeader,
    SolarPlantsContainer,
    StyledThead,
    SubmitButton,
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
import { FaAddressBook, FaBolt, FaBug, FaFilePdf, FaHome, FaPager, FaQuestion } from "react-icons/fa";
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
    const [downloading, setDownloading] = useState(false);

    const [errorDate, setErrorDate] = useState(new Date());
    const [chartDate, setChartDate] = useState(new Date());
    const [chartType, setChartType] = useState('time');

    const [isModalOpen, setModalOpen] = useState(false);
    const [isModalDatalogOpen, setModalDatalogOpen] = useState(false);
    const [isModalDownloadOpen, setModalDownloadOpen] = useState(false);

    const [page, setPage] = useState(1);

    const handleModalOpen = () => setModalOpen(true);
    const handleModalClose = () => setModalOpen(false);
    const handleModalDatalogOpen = () => setModalDatalogOpen(true);
    const handleModalDatalogClose = () => setModalDatalogOpen(false);
    const handleModalDownloadOpen = () => setModalDownloadOpen(true);
    const handleModalDownloadClose = () => setModalDownloadOpen(false);

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

    useEffect(() => {
        if (loadingChart) {
            getChartByType(solarPlant, chartDate, chartType, solarPlantParams, user, setPowerData, setLoadingChart);
        }
    }, [chartDate, chartType, loadingChart, solarPlant, solarPlantParams, user]);

    const itensPerPage = 5;

    const totalPages = Math.ceil(errorList.length / itensPerPage);
    const currentPageItens = errorList.slice((page - 1) * itensPerPage, page * itensPerPage);

    const DeviceInfoModal = ({ onClose, isOpen, deviceInfo }) => {
        if (!isOpen) return null;

        return (
            <ModalOverlay onClick={onClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <ModalTitle>Informações do Dispositivo</ModalTitle>
                    <ModalLabel><strong>Mode:</strong> {deviceInfo.modelText}</ModalLabel>
                    <ModalLabel><strong>Version:</strong> {deviceInfo.innerVersion}</ModalLabel>
                    <ModalLabel><strong>Communication version number:</strong> {deviceInfo.communicationVersion}</ModalLabel>
                    <ModalLabel><strong>Build number:</strong> {deviceInfo.fwVersion}</ModalLabel>
                    <ModalLabel><strong>Device Model:</strong> {deviceInfo.deviceModel}</ModalLabel>
                    <ModalButton onClick={onClose}>Fechar</ModalButton>
                </ModalContent>
            </ModalOverlay>
        );
    };

    const DatalogInfoModal = ({ onClose, isOpen, deviceInfo }) => {
        if (!isOpen) return null;

        return (
            <ModalOverlay onClick={onClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <ModalTitle>Informações do Dispositivo</ModalTitle>
                    <ModalLabel><strong>Signal:</strong> {deviceInfo.simSignal}</ModalLabel>
                    <ModalLabel><strong>Collector model:</strong> {deviceInfo.deviceType}</ModalLabel>
                    <ModalLabel><strong>Firmware Version:</strong> {deviceInfo.firmwareVersion}</ModalLabel>
                    <ModalLabel><strong>Ip & Port:</strong> {deviceInfo.ipAndPort}</ModalLabel>
                    <ModalLabel><strong>Data Update Interval:</strong> {deviceInfo.interval} minutes</ModalLabel>
                    <ModalButton onClick={onClose}>Fechar</ModalButton>
                </ModalContent>
            </ModalOverlay>
        );
    };

    const DownloadReportModal = ({ isOpen, onClose }) => {
        const [year, setYear] = useState(new Date().getFullYear());

        const handleYearChange = (e) => {
            setYear(e.target.value);
        }

        const handleConfirm = () => {
            getReportByPlantId(solarPlant.id, user, year, setDownloading);
            onClose();
        }

        if (!isOpen) return null;

        return (
            <ModalOverlay onClick={onClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <ModalTitle>Insira o Ano para geração do relatório</ModalTitle>
                    <input
                        type='number'
                        value={year}
                        onChange={handleYearChange}
                        min='2000'
                        max={new Date().getFullYear()}
                        style={{ padding: '5px', margin: '10px 0', width: '100%' }}
                    />
                    <ButtonGroup>
                        <SubmitButton onClick={handleConfirm}>Gerar</SubmitButton>
                        <BackButton onClick={onClose}>Cancelar</BackButton>
                    </ButtonGroup>
                </ModalContent>
            </ModalOverlay>
        )
    }

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
                                    <CardInnerTitle>{(parseFloat(solarPlantParams.totalData.eToday)).toFixed(2)}</CardInnerTitle>
                                    <CardInnerContentContainer>
                                        <CardInnerContent>kWh</CardInnerContent>
                                        <CardInnerContent>hoje</CardInnerContent>
                                    </CardInnerContentContainer>
                                    <CardInnerContent className="detail-span label-responsive"><i>estimado: {(solarPlant.estimatedGeneration / 30).toFixed(2)} kWh/dia</i></CardInnerContent>
                                </CardInner>
                            </Card>
                            <Card>
                                <BoltIconContainer>
                                    <FaBolt />
                                </BoltIconContainer>
                                <CardInner>
                                    <CardInnerTitle>{(parseFloat(solarPlantParams.totalData.eMonth)).toFixed(2)}</CardInnerTitle>
                                    <CardInnerContentContainer>
                                        <CardInnerContent>kWh</CardInnerContent>
                                        <CardInnerContent>Mês</CardInnerContent>
                                    </CardInnerContentContainer>
                                    <CardInnerContent className="detail-span label-responsive"><i>estimado: {(solarPlant.estimatedGeneration).toFixed(2)} kWh/mês</i></CardInnerContent>
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
                                        <ChartTypeButton $active={chartType === 'time'} disabled={chartType === 'time'} onClick={() => {
                                            setChartType('time');
                                            setLoadingChart(true);
                                        }}>
                                            Time
                                        </ChartTypeButton>
                                        <ChartTypeButton $active={chartType === 'day'} disabled={chartType === 'day'} onClick={() => {
                                            setChartType('day');
                                            setLoadingChart(true);
                                        }}>
                                            Day
                                        </ChartTypeButton>
                                        <ChartTypeButton $active={chartType === 'mouth'} disabled={chartType === 'mouth'} onClick={() => {
                                            setChartType('mouth');
                                            setLoadingChart(true);
                                        }}>
                                            Mouth
                                        </ChartTypeButton>
                                        <ChartTypeButton $active={chartType === 'year'} disabled={chartType === 'year'} onClick={() => {
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
                                                width={200}
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
                                            <ThreeDots color={colors.icon} width={200} />
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
                                        <InfoDeviceIconContainer onClick={handleModalOpen}>
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
                                        <InfoDeviceIconContainer onClick={handleModalDatalogOpen}>
                                            <FaQuestion />
                                        </InfoDeviceIconContainer>
                                    </DeviceCardContent>
                                </DeviceCardContainer>
                                <DeviceCardContainer>
                                    <DeviceCardContent>Rated Power: {solarPlant.inversor === 'GROWATT' ? (parseFloat(solarPlantParams.deviceSN.nominalPower) / 1000).toFixed(2) : solarPlantParams.deviceSN.nominalPower} kWp</DeviceCardContent>
                                    <DeviceCardContent>Current Power: {(parseFloat(solarPlantParams.deviceSN.pac) / 1000).toFixed(2)} kWp</DeviceCardContent>
                                </DeviceCardContainer>
                                <DeviceCardContainer>
                                    {
                                        downloading ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ThreeDots color={colors.icon} width={80} />
                                            </div>

                                        ) : (
                                            <GenerateReportContainer onClick={
                                                () => {
                                                    setDownloading(true);
                                                    handleModalDownloadOpen();
                                                }
                                            }>
                                                <GenerateReportIconContainer>
                                                    <FaFilePdf />
                                                </GenerateReportIconContainer>
                                                <GenerateReportTitle>Download Relatório da Planta Solar</GenerateReportTitle>
                                            </GenerateReportContainer>
                                        )
                                    }
                                </DeviceCardContainer>
                            </DeviceCards>
                        </Device >
                        <DeviceInfoModal onClose={handleModalClose} isOpen={isModalOpen} deviceInfo={solarPlantParams.deviceSNInfo} />
                        <DownloadReportModal onClose={handleModalDownloadClose} isOpen={isModalDownloadOpen} />
                        <DatalogInfoModal onClose={handleModalDatalogClose} isOpen={isModalDatalogOpen} deviceInfo={solarPlantParams.datalogSNInfo} />
                    </SolarPlantsContainer >
                )
            }
        </>
    );
}

export default SolarPlantDetail;