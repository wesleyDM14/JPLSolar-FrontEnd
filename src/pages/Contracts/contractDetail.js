import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { downloadContractPdf, downloadPromissoriaPdf, getContractById } from "../../services/contractService";
import {
    BackButton,
    ButtonGroup,
    ContractContent,
    ContractDetailArea,
    ContractDetailLabel,
    ContractDetailMainContainer,
    ContractDetailSection,
    ContractDetailSectionSeparator,
    ContractDetailSectionTitle,
    ContractDetailValue,
    ContractHeader,
    ContractsContainer,
    ContractTitle,
    DownloadArea,
    DownloadButton,
    SubItensContainer
} from "./styles";
import Loading from "../../components/Loading";
import { FaDownload, FaFileContract, FaUser } from "react-icons/fa";
import { colors } from "../../utils/GlobalStyles";
import { ThreeDots } from "react-loader-spinner";
import { formatCPF, formatRG } from "../../functions/textFormatFunctions";
import { TbReport } from "react-icons/tb";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { calculateLastDate, calculateRemaingDays } from "../../functions/dateFuntions";

const ContractDetail = ({ navigate, user }) => {

    const { contractId } = useParams();
    const [contract, setContract] = useState({});
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (loading) {
            getContractById(contractId, user, setContract, setLoading);
        }
    }, [loading, user, contractId]);

    return (
        <ContractsContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <ContractHeader className="responsive-header">
                            <ContractTitle><FaFileContract style={{ marginRight: '15px' }} />Contrato</ContractTitle>
                            {
                                downloading ? (
                                    <DownloadArea>
                                        <ThreeDots
                                            color={colors.icon}
                                            height={49}
                                            width={100}
                                        />
                                    </DownloadArea>
                                ) : (
                                    <DownloadArea>
                                        <DownloadButton $left={'15px'} onClick={() => {
                                            setDownloading(true);
                                            downloadPromissoriaPdf(contract.id, user, setDownloading)
                                        }}>
                                            <FaDownload /> Promissoria
                                        </DownloadButton>
                                        <DownloadButton onClick={() => {
                                            setDownloading(true);
                                            downloadContractPdf(contract.id, user, setDownloading);
                                        }}>
                                            <FaDownload />Contrato
                                        </DownloadButton>
                                    </DownloadArea>
                                )
                            }
                        </ContractHeader>
                        <ContractContent>
                            <ContractDetailMainContainer>
                                <ContractDetailSection>
                                    <ContractDetailSectionTitle><FaUser />Dados do Cliente</ContractDetailSectionTitle>
                                    <ContractDetailSectionSeparator />
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Nome: </ContractDetailLabel>
                                        <ContractDetailValue>{contract.nome}</ContractDetailValue>
                                    </ContractDetailArea>
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Email: </ContractDetailLabel>
                                        <ContractDetailValue>{contract.email}</ContractDetailValue>
                                    </ContractDetailArea>
                                    <SubItensContainer>
                                        <ContractDetailArea>
                                            <ContractDetailLabel>CPF: </ContractDetailLabel>
                                            <ContractDetailValue>{formatCPF(contract.cpf)}</ContractDetailValue>
                                        </ContractDetailArea>
                                        <ContractDetailArea>
                                            <ContractDetailLabel>RG: </ContractDetailLabel>
                                            <ContractDetailValue>{formatRG(contract.rg)}</ContractDetailValue>
                                        </ContractDetailArea>
                                    </SubItensContainer>
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Cidade: </ContractDetailLabel>
                                        <ContractDetailValue>{contract.endereco.cidade} - {contract.endereco.uf.toUpperCase()}</ContractDetailValue>
                                    </ContractDetailArea>
                                </ContractDetailSection>
                                <ContractDetailSection>
                                    <ContractDetailSectionTitle><TbReport />Dados Técnicos</ContractDetailSectionTitle>
                                    <ContractDetailSectionSeparator />
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Modelo Inversor: </ContractDetailLabel>
                                        <ContractDetailValue>{contract.modeloInversor}</ContractDetailValue>
                                    </ContractDetailArea>
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Potência Inversor: </ContractDetailLabel>
                                        <ContractDetailValue>{contract.potInversor} kW</ContractDetailValue>
                                    </ContractDetailArea>
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Modelo Módulos Fotovotaicos: </ContractDetailLabel>
                                        <ContractDetailValue>{contract.modeloModulos}</ContractDetailValue>
                                    </ContractDetailArea>
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Potência Módulos Fotovotaicos: </ContractDetailLabel>
                                        <ContractDetailValue>{contract.potModulos} kWp</ContractDetailValue>
                                    </ContractDetailArea>
                                </ContractDetailSection>
                                <ContractDetailSection>
                                    <ContractDetailSectionTitle><RiMoneyDollarCircleFill />Dados Financeiros</ContractDetailSectionTitle>
                                    <ContractDetailSectionSeparator />
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Data do Contrato: </ContractDetailLabel>
                                        <ContractDetailValue>{new Date(contract.dataContrato).toLocaleDateString()}</ContractDetailValue>
                                    </ContractDetailArea>
                                    <SubItensContainer>
                                        <ContractDetailArea>
                                            <ContractDetailLabel>Data da Primeira Parcela: </ContractDetailLabel>
                                            <ContractDetailValue>{new Date(contract.dataPrimeiraParcela).toLocaleDateString()}</ContractDetailValue>
                                        </ContractDetailArea>
                                        <ContractDetailArea>
                                            <ContractDetailLabel>Data da Ultima Parcela: </ContractDetailLabel>
                                            <ContractDetailValue>{calculateLastDate(contract.dataPrimeiraParcela, contract.quantParcelas).toLocaleDateString()}</ContractDetailValue>
                                        </ContractDetailArea>
                                    </SubItensContainer>
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Carência: </ContractDetailLabel>
                                        <ContractDetailValue>{contract.carencia} dias ({calculateRemaingDays(contract.dataContrato, contract.carencia)} dias restantes)</ContractDetailValue>
                                    </ContractDetailArea>
                                    <ContractDetailArea>
                                        <ContractDetailLabel>Número de Parcelas: </ContractDetailLabel>
                                        <ContractDetailValue>{contract.quantParcelas}</ContractDetailValue>
                                    </ContractDetailArea>
                                    <SubItensContainer>
                                        <ContractDetailArea>
                                            <ContractDetailLabel>Valor Total: </ContractDetailLabel>
                                            <ContractDetailValue>R${parseFloat(contract.priceTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</ContractDetailValue>
                                        </ContractDetailArea>
                                        <ContractDetailArea>
                                            <ContractDetailLabel>Valor da Parcela: </ContractDetailLabel>
                                            <ContractDetailValue>R${parseFloat(contract.priceParcela).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</ContractDetailValue>
                                        </ContractDetailArea>
                                    </SubItensContainer>
                                </ContractDetailSection>
                            </ContractDetailMainContainer>
                            <ButtonGroup onClick={() => {
                                navigate(-1);
                            }}>
                                <BackButton>Voltar</BackButton>
                            </ButtonGroup>
                        </ContractContent>
                    </>
                )
            }
        </ContractsContainer>
    );
}

export default ContractDetail;