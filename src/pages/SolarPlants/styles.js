import styled from "styled-components";
import { colors } from "../../utils/GlobalStyles";

export const SolarPlantsContainer = styled.div`
    grid-area: main;
    display: block;
    padding: 0 25px;

    @media only screen and (max-width: 978px){
        padding: 5px 10px;
    }
`;

export const SolarPlantHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 35px;

    @media only screen and (max-width: 978px){
        padding: 0;
    }
`;

export const SolarPlantTitle = styled.h1`
    display: flex;
    align-items: center;
    font-size: 26px;
    color: ${colors.title};
    font-weight: 700;

    svg {
        margin-right: 10px;
    }

    @media only screen and (max-width: 978px){
        font-size: 18px;
    }
`;

export const AddSolarPlantContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`;

export const AddIcon = styled.div`
    font-size: 28px;
    display: flex;
    align-items: center;
    color: ${colors.icon};
    margin-right: 15px;

    @media only screen and (max-width: 978px){
        font-size: 18px;
        margin-right: 5px;
    }
`;

export const AddText = styled.h3`
    color: ${colors.mainText};
    font-size: 1.1rem;
    font-weight: 700;

    @media only screen and (max-width: 978px){
        font-size: 0.9rem;
    }
`;

export const SolarPlantContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

export const NoContentContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90%;
    margin-top: 10px;
    padding: 50px 35px;
    background-color: ${colors.white};
    border-radius: 5px;
    box-shadow: 5px 5px 13px #ededed, -5px -5px 13px #fff;

    @media only screen and (max-width: 978px){
        padding: 30px 10px;
        flex-direction: column;
    }
`;

export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;

    svg {
        font-size: 150px;
        color: ${colors.icon};
    }

    @media only screen and (max-width: 978px){
        svg {
            font-size: 50px;  
        }
    }
`;

export const NoContentActionContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-left: 30px;

    @media only screen and (max-width: 978px){
        margin-left: 0;
    }
`;

export const TextContent = styled.h5`
    font-size: 1.3rem;
    color: ${colors.mainText};

    @media only screen and (max-width: 978px){
        font-size: 0.9rem;
    }
`;

export const AddSolarPlantButton = styled.button`
    display: flex;
    width: 180px;
    align-items: center;
    justify-content: center;
    margin-top: 15px;
    padding: 10px 25px;
    background-color: ${colors.btnSecondary};
    border: 1px solid green;
    border-radius: 3px;
    font-size: 14px;
    color: ${colors.white};
    cursor: pointer;

    svg {
        margin-right: 15px;
        color: ${colors.white} !important;
    }

    &:hover{
        background-color: ${colors.hover};
    }

    @media only screen and (max-width: 978px){
        padding: 5px 15px;
    }
`;

export const SolarPlantListContainer = styled.div`
    min-width: 90%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;

    @media only screen and (min-width: 1920px){
        grid-template-columns: 1fr 1fr 1fr;
    }

    @media only screen and (max-width: 978px){
        display: flex;
        flex-direction: column;
    }
`;

export const StyledFormArea = styled.div`
    margin-top: 10px;
    padding: 30px 30px;
    background-color: ${colors.white};
    border-radius: 5px;
    box-shadow: 5px 5px 13px ${colors.background}, -5px -5px 13px ${colors.white};

    @media only screen and (max-width: 978px){
        padding: 30px 10px;
        margin-top: 0px;
    }
`;

export const FormContent = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    margin-top: 15px;

    @media only screen and (max-width: 978px){
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-top: 0px;
    }
`;

export const FormColumn = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: ${(props) => props.$espacamento ? props.$espacamento : 0}px;

    @media only screen and (max-width: 978px){
        margin-left: 0;
    }
`;

export const FormInputArea = styled.div`
    box-sizing: inherit;
    width: 100%;
    margin-bottom: 20px;

    @media only screen and (max-width: 978px){
        margin-bottom: 5px;
    }
`;

export const Limitador = styled.div`
    width: 90%;

    @media only screen and (max-width: 978px){
        width: 100%;
    }
`;

export const FormInputLabelRequired = styled.p`
    font-weight: 600;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    font-size: 14px;

    &::after{
        display: inline-block;
        content: "*";
        margin-left: 2px;
        color: ${colors.icon};
    }

    svg {
        margin-right: 5px;
    }
`;

export const FormInputLabel = styled.p`
    font-weight: 600;
    margin-bottom: 5px;
`;

export const SubItensContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);

    @media only screen and (max-width: 978px){
        display: flex;
        flex-direction: column;
    }
`;

export const ButtonGroup = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    padding: 0px 35px;
    min-width: 90%;

    @media only screen and (max-width: 978px){
        flex-direction: column;
        padding: 0;
    }
`;

export const SubmitButton = styled.button`
    cursor: pointer;
    font-weight: 600;
    border: 1px solid ${colors.btnSecondary};
    border-radius: 4px;
    padding: 8px 12px;
    min-height: 40px;
    min-width: 100px;
    transition: all .2s ease-out;
    background-color: ${colors.btnPrimary};
    color: ${colors.white};

    &:hover{
        background-color: ${colors.hover};
    }

    @media only screen and (max-width: 978px){
        min-width: 80%;
    }
`;

export const BackButton = styled.button`
    cursor: pointer;
    margin-right: 15px;
    font-weight: 600;
    border: 1px solid ${colors.btnPrimary};
    border-radius: 4px;
    padding: 8px 12px;
    min-height: 40px;
    min-width: 100px;
    transition: all .2s ease-out;
    background-color: ${colors.white};
    color: ${colors.mainText};

    &:hover{
        background-color: ${colors.background};
    }

    @media only screen and (max-width: 978px){
        min-width: 80%;
        margin-right: 0;
        margin-bottom: 15px;
    }
`;

export const SingleSolarPlant = styled.div`
    display: grid;
    grid-template-columns: 1fr 6fr 1fr;
    margin-top: 20px;
    padding: 25px;
    border-radius: 5px;
    background-color: ${colors.white};
    box-shadow: 5px 5px 13px #ededed, -5px -5px 13px #fff;
    cursor: pointer;
`;

export const SolarPlantValue = styled.a`
    font-size: 15px;
    font-weight: bold;
    color: ${colors.mainText};
    text-decoration: none;

    @media only screen and (max-width: 978px){
       font-size: 13px;
    }
`;

export const SolarPlantLabel = styled.p`
    font-size: 15px;
    color: ${colors.description};
    margin-right: 5px;

    @media only screen and (max-width: 978px){
       font-size: 14px;
    }
`;

export const AdminContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
`;

export const EditIconContainer = styled.div`
    margin-right: 45%;
    font-size: 18px;
    color: ${colors.mainText};

    @media only screen and (max-width: 978px){
       font-size: 14px;
    }
`;

export const DeleteIconContainer = styled.div`
    font-size: 18px;
    color: ${colors.red};

    @media only screen and (max-width: 978px){
       font-size: 14px;
    }
`;

export const DeleteContainer = styled.div`
    align-items: center;
    justify-content: center;
    display: flex;
    flex-direction: column;
    padding: 25px;
`;

export const DeleteTitle = styled.h5`
    font-size: 20px;
    color: ${colors.title};

    @media only screen and (max-width: 978px){
        font-size: 14px;
    }
`;

export const DeleteButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    margin-top: 25px;
    width: 100%;

    @media only screen and (max-width: 978px){
        flex-direction: column;
    }
`;

export const StyledFormTitle = styled.h2`
    font-size: 28px;
    text-align: center;
    color: ${colors.title};
    padding: 5px;
    margin-bottom: 20px;
`;

export const SelectWrapper = styled.div`
    position: relative;
    display: flex;
    width: 100%;

    &:after {
        content: '▼';
        font-size: 12px;
        color: #363636;
        position: absolute;
        left: 90%;
        top: 45%;
        transform: translateY(-50%);
        pointer-events: none;
    }
`;

export const FormSelect = styled.select`
    width: 100%;
    padding: 10px 2px;
    font-size: 17px;
    letter-spacing: 1px;
    color: ${colors.mainText};
    background-color:${colors.background};
    border-radius: 5px;
    border: 0;
    outline: 0;
    display: block;
    margin: 0px 0 10px 0;
    transition: ease-in-out 0.3s;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    cursor: pointer;

    &::-ms-expand {
        display: none;
    }
`;

export const IconSolarPlantContainer = styled.div`
    font-size: 80px;
    display: flex;
    color: ${colors.icon};
    align-items: center;
    justify-content: center;

    @media only screen and (max-width: 978px){
        font-size: 60px;
    }
`;

export const SolarPlantsInfo = styled.div`
    display: inline-block;
    margin-left: 25px;

    @media only screen and (max-width: 978px){
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
`;

export const SolarPlantsOperations = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
`;

export const IconOperation = styled.div`
    color: ${props => props.$active === '1' ? colors.icon : props.$active === '0' ? colors.sidebar : colors.red};
    margin-bottom: 25px;
    font-size: 30px;
`;

export const TitleDetailContainer = styled.div`
    display: flex;
    align-items: center;

    @media only screen and (max-width: 978px){
        margin-bottom: 15px;
    }
`;

export const TitleIconContainer = styled.div`
    font-size: 50px;
    margin-right: 20px;
    color: ${colors.icon};

    @media only screen and (max-width: 978px){
        font-size: 30px;
    }
`;

export const Greeting = styled.div`
    display: block;
`;

export const TitleContent = styled.h1`
    font-size: 24px;
    color: ${colors.title};
    margin-bottom: 5px;

    @media only screen and (max-width: 978px){
        font-size: 18px;
    }
`;

export const TitleDescription = styled.p`
    font-size: 14px;
    font-weight: 700;
    color: ${colors.description};

    @media only screen and (max-width: 978px){
        font-size: 12px;
        font-weight: 500;
    }
`;

export const InfoHome = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: auto;
    padding: 15px;
    border-radius: 5px;
    background-color: ${colors.white};
    box-shadow: 5px 5px 13px #ededed, -5px -5px 13px ${colors.white};

    @media only screen and (max-width: 978px){
        width: 90%;
    }
`;

export const InforHomeIconContainer = styled.div`
    font-size: 30px;
    margin-right: 15px;
    color: ${colors.icon};

    @media only screen and (min-width: 1920px){
        font-size: 40px;
    }
`;

export const InfoHomeCard = styled.div`
    display: inline-block;
    align-items: center;
    justify-content: space-between;
`;

export const InfoHomeTitle = styled.h1`
    font-size: 18px;
    color: ${colors.title};

    @media only screen and (min-width: 1920px){
        font-size: 25px;
    }
`;

export const InfoHomeDetail = styled.p`
    font-size: 12px;
    color: ${colors.mainText};
    font-weight: 700;
`;

export const SolarPlantDetailHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 35px;

    @media only screen and (max-width: 978px){
        flex-direction: column;
        padding: 5px;
    }
`;

export const MainCards = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    margin: 20px 0;

    @media only screen and (max-width: 978px){
        gap: 5px;
    }
`;

export const Card = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    height: 70px;
    padding: 20px;
    border-radius: 5px;
    background-color: ${colors.white};
    box-shadow: 5px 5px 13px #ededed, -5px -5px 13px ${colors.white};

    @media only screen and (max-width: 978px) {
        height: 50px;
        padding: 5px;
    }
`;

export const BoltIconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 5px;
    color: ${colors.greenNeutral};
    font-size: 40px;
    //margin-right: 15px;

    @media only screen and (max-width: 978px) {
        font-size: 20px;
        margin-right: 2px;
    }
`;

export const CardInner = styled.div`
    display: inline;
    text-align: center;
`;

export const CardInnerTitle = styled.h1`
    color: ${colors.mainText};

    @media only screen and (max-width: 978px) {
        font-size: 18px;
    }
`;

export const CardInnerContentContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`;

export const CardInnerContent = styled.span`
    font-size: 18px;
    margin-right: 5px;

    @media only screen and (max-width: 978px) {
        font-size: 15px;
    }
`;

export const ChartsCards = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 30px;
    margin-top: 50px;

    @media only screen and (max-width: 978px) {
        grid-template-columns: 1fr;
        margin-top: 30px;
    }

    @media only screen and (min-width: 1920px){
        grid-template-columns: repeat(2, 1fr);
    }
`;

export const Chart = styled.div`
    padding: 25px;
    border-radius: 5px;
    background-color: #fff;
    box-shadow: 5px 5px 13px #ededed, -5px -5px 13px #fff;
    max-height: 500px;
    min-height: 500px;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;

    @media only screen and (max-width: 978px) {
        min-height: 350px;
        overflow-y: auto;
    }
`;

export const ChartTitle = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
`;

export const ChartTitleContainer = styled.div``;

export const ChartTitleContent = styled.h1`
    font-size: 24px;
    color: ${colors.sidebar};
    margin-bottom: 5px;

    @media only screen and (max-width: 978px) {
        font-size: 20px;
    }
`;

export const ChartLeftIconContainer = styled.div`
    color: ${colors.white};
    font-size: 20px;
    background: ${colors.icon};
    border-radius: 200px 0px 200px 200px;
    -moz-border-radius: 200px 0px 200px 200px;
    -webkit-border-radius: 200px 0px 200px 200px;
    padding: 15px;

    @media only screen and (max-width: 978px) {
        font-size: 15px;
        padding: 8px;
    }
`;

export const ChartRightIconContainer = styled.div`
    color: ${colors.white};
    font-size: 20px;
    background: ${colors.red};
    border-radius: 200px 0px 200px 200px;
    -moz-border-radius: 200px 0px 200px 200px;
    -webkit-border-radius: 200px 0px 200px 200px;
    padding: 15px;

    @media only screen and (max-width: 978px) {
        font-size: 15px;
        padding: 8px;
    }
`;

export const Device = styled.div`
    padding: 15px;
    border-radius: 5px;
    background: ${colors.white};
    box-shadow: 5px 5px 13px #ededed, -5px -5px 13px ${colors.white};
    margin-top: 20px;
`;

export const DeviceCards = styled.div`
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    margin: 10px;

    @media only screen and (max-width: 978px) {
        display: flex;
        flex-direction: column;
    }
`;

export const DeviceCardContainer = styled.div`
    display: flex;
    flex-direction: column;

    @media only screen and (max-width: 978px) {
        justify-content: center;
    }
`;

export const DeviceCardContent = styled.h4`
    font-size: 10px;
    font-weight: 700;
    margin-top: 5px;

    @media only screen and (min-width: 1920px) {
        font-size: 12px;
    }
`;

export const DeviceCardIconContainer = styled.div`
    font-size: 80px;
    color: ${colors.icon};
    text-align: center;

    @media only screen and (max-width: 978px) {
        font-size: 50px;
    }
`;

export const InfoDeviceIconContainer = styled.div`
    font-size: 12px;
    color: ${colors.greenNeutral};
    display: inline;
    margin: 2px;
    cursor: pointer;
`;

export const StyledThead = styled.thead`
    display: table-header-group;
    vertical-align: middle;
    border-color: inherit;
`;

export const TableError = styled.table`
    width: 100%;
    font-size: 12px;
    border-collapse: collapse;
    border-spacing: 0;
    display: table;
    box-sizing: border-box;
    text-indent: initial;
    margin-top: 15px;
`;

export const TableHeaderContainer = styled.tr`
    height: 48px;
    color: ${colors.white};
    font-weight: bold;
    background: ${colors.darkGray};
    font-size: 13px;
    display: table-row;
    vertical-align: inherit;

    @media only screen and (max-width: 978px) {
        height: auto;
        font-size: 10px;
    }
`;

export const TableHeaderContent = styled.td`
    display: table-cell;
    vertical-align: inherit;
    border: 1px solid #000;
    padding: 2px 10px;
`;

export const TableBodyContainer = styled.tr`
    height: 48px;
    color: ${colors.mainText};
    background: ${colors.white};
    font-size: 11px;
    border: 1px solid ${colors.mainText};
    display: table-row;
    vertical-align: inherit;

    @media only screen and (max-width: 978px) {
        font-size: 10px;
    }
`;

export const TableBodyContent = styled.td`
    display: table-cell;
    vertical-align: inherit;
    border-bottom: 1px solid ${colors.darkGray};
    padding: 2px 10px;
`;

export const LoadingchartContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 25%;

    @media only screen and (max-width: 978px) {
        height: auto;
    }
`;

export const SelectedErrorDateContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 5px;
`;

export const SelectedChartContainer = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;

    @media only screen and (max-width: 978px) {
        flex-direction: column;
    }
`;

export const ChartSelectedDateContainer = styled.div`
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    @media only screen and (max-width: 978px) {
        width: 100%;
    }
`;

export const ChartTypeSelectedContainer = styled.div`
    display: flex;
    flex-direction: row;
    width: 50%;
    align-items: center;
    justify-content: center;

    @media only screen and (max-width: 978px) {
        width: 100%;
        margin-top: 15px;
    }
`;

export const ChartTypeButton = styled.button`
    background-color: ${props => props.$active ? colors.btnSecondary : colors.background};
    border: none;
    color: ${props => props.$active ? colors.white : colors.mainText};
    padding: 10px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin-left: 2px;
    border-radius: 5px;
    cursor: pointer;

    &:disabled {
        cursor: not-allowed !important;
    }

    &:not(:disabled):hover {
        background-color: ${colors.navbar};
        color: ${colors.white};
    }
`;

export const GenerateReportContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

export const GenerateReportIconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        color: ${colors.icon};
        font-size: 45px;
    }

    @media only screen and (max-width: 978px) {
        svg {
            margin-top: 30px;
            font-size: 35px;
        }
    }
`;

export const GenerateReportTitle = styled.span`
    font-size: 14px;
    font-weight: 700;
    margin-top: 5px;
    text-align: center;

    @media only screen and (max-width: 978px) {
        font-size: 12px;
    }
`;

export const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

export const ModalContent = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    width: 300px;
    text-align: left;
`;

export const ModalTitle = styled.h3`
    font-size: 16px;
    margin-bottom: 10px;
    color: ${colors.title};
    text-align: center;
`;

export const ModalLabel = styled.p`
    font-size: 14px;
    color: ${colors.mainText};
`;

export const ModalButton = styled.button`
    background-color: ${colors.btnPrimary};
    align-self: center;
    border: none;
    color: ${colors.white};
    padding: 7px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 14px;
    margin-left: 2px;
    margin-top: 15px;
    border-radius: 5px;
    cursor: pointer;

    :hover {
        background-color: ${colors.hover};
    }
`;