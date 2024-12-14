import Modal from 'react-modal';
import Pagination from '../../components/Pagination';
import { useMemo, useState } from 'react';
import { colors, ModalStyles } from '../../utils/GlobalStyles';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { ThreeDots } from "react-loader-spinner";
import { FormInput, StyledDatePicker } from '../../components/FormLib';
import {
    AdminContainer,
    BackButton,
    ButtonGroup,
    DeleteButtonContainer,
    DeleteContainer,
    DeleteIconContainer,
    DeleteTitle,
    EditIconContainer,
    FormColumn,
    FormContent,
    FormInputArea,
    FormInputLabelRequired,
    FormSelect,
    IconOperation,
    IconSolarPlantContainer,
    IconWrapper,
    Limitador,
    SelectWrapper,
    SingleSolarPlant,
    SolarPlantLabel,
    SolarPlantListContainer,
    SolarPlantsInfo,
    SolarPlantsOperations,
    SolarPlantTitle,
    SolarPlantValue,
    StyledFormArea,
    SubItensContainer,
    SubmitButton,
} from './styles';
import { FaCalendarAlt, FaEdit, FaHashtag, FaSolarPanel, FaSun, FaTrashAlt } from 'react-icons/fa';
import { PiCodeFill, PiMoonStarsFill } from 'react-icons/pi';
import { BiSolidErrorAlt } from 'react-icons/bi';
import { ImWarning } from 'react-icons/im';
import { deleteSolarPlant, updateSolarPlant } from '../../services/solarPlantServices';
import { IoLocationSharp, IoLogIn } from 'react-icons/io5';
import { RiLockPasswordFill } from 'react-icons/ri';
import { CgSelectR } from 'react-icons/cg';
import { SlEnergy } from 'react-icons/sl';
import { MdEnergySavingsLeaf } from 'react-icons/md';
import { hasActionPermission } from '../../utils/permissions';

const SolarPlantList = ({ solarPlants, navigate, search, page, setPage, itensPerPage, setLoading, user }) => {
    Modal.setAppElement(document.getElementById('root'));

    const userRole = user?.userRole || 'CLIENTE';

    const [selectedSolarPlant, setSelectedSolarPlant] = useState({});

    const [modalEditIsOpen, setModalEditIsOpen] = useState(false);
    const [modalDeleteIsOpen, setModalDeleteIsOpen] = useState(false);

    const openEditModal = () => setModalEditIsOpen(true);

    const closeEditModal = () => {
        setModalEditIsOpen(false);
        setSelectedSolarPlant({});
    };

    const openDeleteModal = () => setModalDeleteIsOpen(true);

    const closeDeleteModal = () => {
        setModalDeleteIsOpen(false);
        setSelectedSolarPlant({});
    };

    const filteredSolarPlants = useMemo(() =>
        solarPlants.filter(solarPlant =>
            solarPlant.code.toLowerCase().includes(search.toLowerCase()) ||
            solarPlant.local.toLowerCase().includes(search.toLowerCase())
        ), [solarPlants, search]
    );

    const totalPages = Math.ceil(filteredSolarPlants.length / itensPerPage);
    const currentPageItens = filteredSolarPlants.slice((page - 1) * itensPerPage, page * itensPerPage);

    return (
        <>
            <SolarPlantListContainer>
                {
                    currentPageItens.map((solarPlant) => (
                        <SingleSolarPlant key={solarPlant.id} onClick={() => navigate(`/plantas-solares/${solarPlant.id}`)}>
                            <IconSolarPlantContainer>
                                <FaSolarPanel />
                            </IconSolarPlantContainer>
                            <SolarPlantsInfo>
                                <SolarPlantLabel>Localização:</SolarPlantLabel>
                                <SolarPlantValue>{solarPlant.local}</SolarPlantValue>
                                <SolarPlantLabel>Potência Instalada:</SolarPlantLabel>
                                <SolarPlantValue>{solarPlant.installedPower} kWp</SolarPlantValue>
                            </SolarPlantsInfo>
                            <SolarPlantsOperations>
                                <IconOperation $active={solarPlant.status}>
                                    {
                                        solarPlant.status === '1' ? (
                                            <FaSun />
                                        ) : solarPlant.status === '0' ? (
                                            <PiMoonStarsFill />
                                        ) : (
                                            <BiSolidErrorAlt />
                                        )
                                    }
                                </IconOperation>
                                {
                                    hasActionPermission(userRole, 'edit-solarPlant') && (
                                        <AdminContainer>
                                            <EditIconContainer onClick={(event) => {
                                                event.stopPropagation();
                                                setSelectedSolarPlant(solarPlant);
                                                openEditModal();
                                            }}>
                                                <FaEdit />
                                            </EditIconContainer>
                                            <DeleteIconContainer onClick={(event) => {
                                                event.stopPropagation();
                                                setSelectedSolarPlant(solarPlant);
                                                openDeleteModal();
                                            }}>
                                                <FaTrashAlt />
                                            </DeleteIconContainer>
                                        </AdminContainer>
                                    )
                                }
                            </SolarPlantsOperations>
                        </SingleSolarPlant>
                    ))
                }
            </SolarPlantListContainer>
            <Pagination currentPage={page} setPage={setPage} totalPages={totalPages} />
            <Modal
                isOpen={modalEditIsOpen}
                onRequestClose={closeEditModal}
                style={ModalStyles}
            >
                <StyledFormArea>
                    <div style={{ display: 'flex', marginBottom: '30px', alignItems: 'center', justifyContent: 'center' }}>
                        <SolarPlantTitle><FaSolarPanel /> Editar Planta Solar</SolarPlantTitle>
                    </div>
                    <Formik
                        initialValues={{
                            id: selectedSolarPlant.id,
                            code: selectedSolarPlant.code,
                            local: selectedSolarPlant.local,
                            installationDate: selectedSolarPlant.installationDate,
                            inverter: selectedSolarPlant.inversor,
                            inverterPot: selectedSolarPlant.inverterPot,
                            panel: selectedSolarPlant.panel,
                            panelPower: selectedSolarPlant.panelPower,
                            numberPanel: selectedSolarPlant.numberPanel,
                            estimatedGeneration: selectedSolarPlant.estimatedGeneration,
                            login: selectedSolarPlant.login,
                            password: selectedSolarPlant.password,
                            clientId: selectedSolarPlant.clientId
                        }}
                        validationSchema={
                            Yup.object({
                                code: Yup.string().required('Código é Obrigatório.'),
                                local: Yup.string().required('Localização é Obrigatório.'),
                                installationDate: Yup.date().required('Data de instalação é obrigatório'),
                                inverterPot: Yup.number().required('Potência do Inversor é obrigatório.'),
                                panel: Yup.string().required('Marca da placa solar é obrigatório.'),
                                panelPower: Yup.string().required('Potência do Painel solar é obrigatório.'),
                                numberPanel: Yup.number().required('Quantidade de paineis solares é obrigatório'),
                                estimatedGeneration: Yup.number().required('Geração Mensal estimada é obrigatória.'),
                                login: Yup.string().required('Login é obrigatório'),
                                password: Yup.string().required('Password é obrigatório'),
                            })
                        }
                        onSubmit={(values, { setSubmitting, setFieldError }) => {
                            updateSolarPlant(values, user, setFieldError, setSubmitting, setLoading);
                        }}
                    >
                        {
                            ({ isSubmitting, setFieldValue, values }) => (
                                <Form>
                                    <FormContent>
                                        <FormColumn>
                                            <SubItensContainer>
                                                <Limitador>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><PiCodeFill />Código</FormInputLabelRequired>
                                                        <FormInput
                                                            type='text'
                                                            name='code'
                                                            placeholder='Código da Usina'
                                                            autoComplete='code'
                                                        />
                                                    </FormInputArea>
                                                </Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><IoLocationSharp />Localização</FormInputLabelRequired>
                                                    <FormInput
                                                        type='text'
                                                        name='local'
                                                        placeholder='Localização'
                                                        autoComplete='local'
                                                    />
                                                </FormInputArea>
                                            </SubItensContainer>
                                            <SubItensContainer>
                                                <Limitador>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><IoLogIn />Login de Monitoramento</FormInputLabelRequired>
                                                        <FormInput
                                                            type='text'
                                                            name='login'
                                                            placeholder='Login'
                                                            autoComplete='login'
                                                        />
                                                    </FormInputArea>
                                                </Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><RiLockPasswordFill />Senha de Monitoramento</FormInputLabelRequired>
                                                    <FormInput
                                                        type='password'
                                                        name='password'
                                                    />
                                                </FormInputArea>
                                            </SubItensContainer>
                                            <SubItensContainer>
                                                <Limitador>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaCalendarAlt />Data de Instalação</FormInputLabelRequired>
                                                        <StyledDatePicker
                                                            name='installationDate'
                                                            setFieldValue={setFieldValue}
                                                            selected={values.installationDate ? values.installationDate : new Date()}
                                                        />
                                                    </FormInputArea>
                                                </Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><CgSelectR />Inversor</FormInputLabelRequired>
                                                    <SelectWrapper>
                                                        <Field as={FormSelect} name='inverter'>
                                                            <option value=''>Selecione o Inversor</option>
                                                            <option value='ABB'>ABB</option>
                                                            <option value='CANADIAN'>CANADIAN</option>
                                                            <option value='DEYE'>DEYE</option>
                                                            <option value='GROWATT'>Growatt</option>
                                                        </Field>
                                                    </SelectWrapper>
                                                </FormInputArea>
                                            </SubItensContainer>
                                        </FormColumn>
                                        <FormColumn $espacamento={12}>
                                            <SubItensContainer>
                                                <Limitador>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaSolarPanel />Marca dos Painéis</FormInputLabelRequired>
                                                        <FormInput
                                                            type='text'
                                                            name='panel'
                                                            placeholder='Marca dos Painéis'
                                                            autoComplete='panel'
                                                        />
                                                    </FormInputArea>
                                                </Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><SlEnergy />Pot. do Painel Solar (W)</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='panelPower'
                                                        min='0'
                                                        step='0.01'
                                                        placeholder='Potência do Painel'
                                                        autoComplete='panelPower'
                                                    />
                                                </FormInputArea>
                                            </SubItensContainer>
                                            <SubItensContainer>
                                                <FormInputArea>
                                                    <Limitador>
                                                        <FormInputLabelRequired><SlEnergy />Pot. do Inversor (kWp)</FormInputLabelRequired>
                                                        <FormInput
                                                            type='number'
                                                            name='inverterPot'
                                                            min='0'
                                                            step='0.01'
                                                            placeholder='Potência do Inversor'
                                                            autoComplete='inverterPot'
                                                        />
                                                    </Limitador>
                                                </FormInputArea>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><MdEnergySavingsLeaf />Geração Estimada (kWh)</FormInputLabelRequired>
                                                    <FormInput
                                                        type='number'
                                                        name='estimatedGeneration'
                                                        min='0'
                                                        step='0.01'
                                                        placeholder='Geração Mensal'
                                                        autoComplete='inverterPot'
                                                    />
                                                </FormInputArea>
                                            </SubItensContainer>
                                            <SubItensContainer>
                                                <Limitador>
                                                    <FormInputArea>
                                                        <FormInputLabelRequired><FaHashtag />Quantidade de Paineis</FormInputLabelRequired>
                                                        <FormInput
                                                            type='number'
                                                            name='numberPanel'
                                                            min='0'
                                                            step='0.01'
                                                            placeholder='Número de Painéis'
                                                            autoComplete='numberPanel'
                                                        />
                                                    </FormInputArea>
                                                </Limitador>
                                            </SubItensContainer>
                                        </FormColumn>
                                    </FormContent>
                                    <ButtonGroup>
                                        <BackButton type="button" onClick={() => closeEditModal()}>Fechar</BackButton>
                                        {
                                            !isSubmitting && (
                                                <SubmitButton type='submit'>Atualizar</SubmitButton>
                                            )
                                        }
                                        {
                                            isSubmitting && (
                                                <ThreeDots color={colors.icon} />
                                            )
                                        }
                                    </ButtonGroup>
                                </Form>
                            )
                        }
                    </Formik>
                </StyledFormArea>
            </Modal>
            <Modal
                isOpen={modalDeleteIsOpen}
                onRequestClose={closeDeleteModal}
                style={ModalStyles}
            >
                <DeleteContainer>
                    <IconWrapper>
                        <ImWarning />
                    </IconWrapper>
                    <DeleteTitle>Deseja excluir a planta solar?</DeleteTitle>
                    <DeleteButtonContainer>
                        <BackButton onClick={() => {
                            closeDeleteModal();
                        }}>
                            Cancelar
                        </BackButton>
                        <SubmitButton onClick={() => {
                            deleteSolarPlant(selectedSolarPlant.id, user, setLoading);
                        }}>
                            Excluir
                        </SubmitButton>
                    </DeleteButtonContainer>
                </DeleteContainer>
            </Modal>
        </>

    );
}

export default SolarPlantList;