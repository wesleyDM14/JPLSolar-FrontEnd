import Modal from 'react-modal';
import React, { useMemo, useState } from 'react';
import Pagination from '../../components/Pagination';
import { colors, ModalStyles } from '../../utils/GlobalStyles';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import {
    AdminContainer,
    BackButton,
    ButtonGroup,
    ContractLabel,
    ContractListContainer,
    ContractListHeader,
    ContractListHeaderLabel,
    ContractValue,
    ContractValueContainer,
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
    Limitador,
    Line,
    NextButton,
    ProgressBarContainer,
    SelectWrapper,
    SingleContract,
    Step,
    StepNumber,
    StyledFormArea,
    StyledFormTitle,
    SubItensContainer,
    SubItensContainerTriplo,
    SubmitButton,
} from './styles';
import { FaEdit, FaMailBulk, FaTrashAlt, FaUser } from 'react-icons/fa';
import { ThreeDots } from 'react-loader-spinner';
import { CiCalendarDate } from 'react-icons/ci';
import { FormInput, MaskedInputComponent, StyledDatePicker } from '../../components/FormLib';
import { PiIdentificationCard } from 'react-icons/pi';
import { MdDriveFileRenameOutline } from 'react-icons/md';
import { GrUserWorker } from 'react-icons/gr';
import { CgSelectR } from 'react-icons/cg';
import { FaLocationDot } from 'react-icons/fa6';
import { AiOutlineFieldNumber } from 'react-icons/ai';
import { RiMoneyDollarBoxLine } from 'react-icons/ri';
import { deleteContract, updateContract } from '../../services/contractService';

const ContractList = ({ contracts, navigate, search, page, setPage, itensPerPage, setLoading, user }) => {

    Modal.setAppElement(document.getElementById('root'));

    const [selectedContract, setSelectedContract] = useState({});
    const [deleting, setDeleting] = useState(false);
    const [modalEditIsOpen, setModalEditIsOpen] = useState(false);
    const [modalDeleteIsOpen, setModalDeleteIsOpen] = useState(false);
    const [step, setStep] = useState(1);

    const openEditModal = () => setModalEditIsOpen(true);

    const closeEditModal = () => {
        setModalEditIsOpen(false);
        setSelectedContract({});
        setStep(1);
    };

    const openDeleteModal = () => setModalDeleteIsOpen(true);

    const closeDeleteModal = () => {
        setModalDeleteIsOpen(false);
        setSelectedContract({});
    };

    const validationSchemaPersonal = Yup.object({
        nome: Yup.string().required('Nome é obrigatório'),
        email: Yup.string().email().required('Email é obrigatório'),
        profissao: Yup.string().required('Profissão é obrigatório'),
        estadoCivil: Yup.string().required('Estado Civil é obrigatório'),
        dataNascimento: Yup.date().required('Data de Nascimento é obrigatória'),
        cpf: Yup.string().required('CPF é obrigatório'),
        rg: Yup.string().required('RG é obrigatório'),
        logradouro: Yup.string().required('Rua é obrigatório'),
        numero: Yup.number().required('Número é obrigatório'),
        bairro: Yup.string().required('Bairro é obrigatório'),
        cidade: Yup.string().required('Cidade é obrigatório'),
        uf: Yup.string().required('UF é obrigatório').length(2, 'UF deve ter exatamente 2 caracteres'),
        cep: Yup.string().required('CEP é obrigatório'),
        genero: Yup.string().required('Gênero é obrigatório'),
    });

    const validationSchemaTecnical = Yup.object({
        modeloModulos: Yup.string().required('Modelo de modulos é obrigatório'),
        modeloInversor: Yup.string().required('Modelo de inversor é obrigatório'),
        potModulos: Yup.number().required('Potência do Módulo é obrigatória').moreThan(0, 'Não pode ser 0'),
        potInversor: Yup.number().required('Potência do Inversor é obrigatória').moreThan(0, 'Não pode ser 0.'),
    });

    const validationSchemaFinanceiro = Yup.object({
        dataContrato: Yup.date().required('Data de Contrato é obrigatório.'),
        carencia: Yup.number().required('Carência é Obrigatório.'),
        dataPrimeiraParcela: Yup.date().required('Data da primeira parcela é obrigatório.'),
        quantParcelas: Yup.number().required('Quantidade de parcelas é Obrigatório.'),
        priceTotal: Yup.number().required('Preço total é Obrigatório.'),
        priceParcela: Yup.number().required('Preço da parcela é Obrigatório.'),
        avalista: Yup.boolean(),
        nomeAvalista: Yup.string().when('avalista', {
            is: true,  // Se avalista for true
            then: Yup.string().required('Nome do avalista é obrigatório'),
            otherwise: Yup.string().notRequired(),
        }),
        profissaoAvalista: Yup.string().when('avalista', {
            is: true,
            then: Yup.string().required('Profissão do avalista é obrigatória'),
            otherwise: Yup.string().nullable(),
        }),
        cpfAvalista: Yup.string().when('avalista', {
            is: true,
            then: Yup.string()
                .required('CPF do avalista é obrigatório'),
            otherwise: Yup.string().notRequired(),
        }),
        logradouroAvalista: Yup.string().when('avalista', {
            is: true,
            then: Yup.string().required('Logradouro do avalista é obrigatório'),
            otherwise: Yup.string().notRequired(),
        }),
        numeroAvalista: Yup.number().when('avalista', {
            is: true,
            then: Yup.number().required('Número é obrigatório').min(1, 'Número deve ser maior que zero'),
            otherwise: Yup.number().notRequired(),
        }),
        bairroAvalista: Yup.string().when('avalista', {
            is: true,
            then: Yup.string().required('Bairro do avalista é obrigatório'),
            otherwise: Yup.string().notRequired(),
        }),
        cidadeAvalista: Yup.string().when('avalista', {
            is: true,
            then: Yup.string().required('Cidade do avalista é obrigatória'),
            otherwise: Yup.string().notRequired(),
        }),
        ufAvalista: Yup.string().when('avalista', {
            is: true,
            then: Yup.string()
                .required('UF do avalista é obrigatória')
                .length(2, 'UF deve ter 2 caracteres'),
            otherwise: Yup.string().notRequired(),
        }),
        cepAvalista: Yup.string().when('avalista', {
            is: true,
            then: Yup.string()
                .required('CEP do avalista é obrigatório'),
            otherwise: Yup.string().notRequired(),
        }),
    });

    const validationSchemas = [
        validationSchemaPersonal,
        validationSchemaTecnical,
        validationSchemaFinanceiro
    ];

    const filteredContracts = useMemo(() =>
        contracts.filter(contract =>
            contract.nome.toLowerCase().includes(search.toLowerCase())
        ), [contracts, search]
    );

    const totalPages = Math.ceil(filteredContracts.length / itensPerPage);
    const currentPageItems = filteredContracts.slice((page - 1) * itensPerPage, page * itensPerPage);

    const ProgressBarElement = ({ currentStep, totalSteps }) => {
        const stepWidth = 100 / (totalSteps - 1);
        const circleSize = 30;

        const getLineWidth = (index) => {
            return index < totalSteps - 1 ? `calc(${stepWidth}% - ${circleSize / 2}px)` : '0';
        };

        const getLineLeft = (index) => {
            return `calc(${stepWidth}% * ${index} + ${circleSize / 2}px)`;
        };

        return (
            <ProgressBarContainer>
                {[...Array(totalSteps).keys()].map(index => (
                    <React.Fragment key={index}>
                        {index < totalSteps - 1 && (
                            <Line
                                $active={index < currentStep - 1}
                                width={getLineWidth(index)}
                                $left={getLineLeft(index)}
                            />
                        )}
                        <Step>
                            <StepNumber $active={index < currentStep}>
                                {index + 1}
                            </StepNumber>
                        </Step>
                    </React.Fragment>
                ))}
            </ProgressBarContainer>
        );
    };

    const handleNext = (validateForm) => {
        validateForm().then(errors => {
            if (Object.keys(errors).length === 0) {
                setStep(step + 1);
            } else {
                const errorMessages = Object.keys(errors).map(field => `${field}: ${errors[field]}`).join('\n');
                window.alert(errorMessages);
            }
        });
    };

    return (
        <ContractListContainer>
            <ContractListHeader>
                <ContractListHeaderLabel>Nome</ContractListHeaderLabel>
                <ContractListHeaderLabel className="label-responsive">Data</ContractListHeaderLabel>
                <ContractListHeaderLabel className="label-responsive">Responsável</ContractListHeaderLabel>
                <ContractListHeaderLabel>Opções</ContractListHeaderLabel>
            </ContractListHeader>
            {
                currentPageItems.map((contract) => (
                    <SingleContract
                        key={contract.id}
                        onClick={() => navigate(`/contratos/${contract.id}`)}
                    >
                        <ContractValueContainer>
                            <ContractLabel><FaUser /></ContractLabel>
                            <ContractValue>{contract.nome}</ContractValue>
                        </ContractValueContainer>
                        <ContractValueContainer className="label-responsive">
                            <ContractLabel className="label-responsive"><CiCalendarDate className="label-responsive" /></ContractLabel>
                            <ContractValue className="label-responsive">{new Date(contract.dataContrato).toLocaleDateString()}</ContractValue>
                        </ContractValueContainer>
                        <ContractValueContainer className="label-responsive">
                            <ContractLabel className="label-responsive"><GrUserWorker className="label-responsive" /></ContractLabel>
                            <ContractValue className="label-responsive">{contract.User.name}</ContractValue>
                        </ContractValueContainer>
                        <AdminContainer>
                            <EditIconContainer onClick={(event) => {
                                event.stopPropagation();
                                setSelectedContract(contract);
                                openEditModal();
                            }}>
                                <FaEdit />
                            </EditIconContainer>
                            <DeleteIconContainer onClick={(event) => {
                                event.stopPropagation();
                                setSelectedContract(contract);
                                openDeleteModal();
                            }}>
                                <FaTrashAlt />
                            </DeleteIconContainer>
                        </AdminContainer>
                    </SingleContract>
                ))
            }
            <Pagination totalPages={totalPages} currentPage={page} setPage={setPage} />
            <Modal
                isOpen={modalDeleteIsOpen}
                onRequestClose={closeDeleteModal}
                style={ModalStyles}
            >
                <DeleteContainer>
                    <DeleteTitle>Quer realmente excluir {selectedContract.nome}?</DeleteTitle>
                    <DeleteButtonContainer>
                        <BackButton onClick={
                            () => {
                                setSelectedContract({});
                                closeDeleteModal();
                            }
                        }>
                            Cancelar
                        </BackButton>
                        {
                            deleting && (
                                <ThreeDots color={colors.icon} />
                            )
                        }
                        {
                            !deleting && (
                                <SubmitButton onClick={
                                    async () => {
                                        setDeleting(true);
                                        await deleteContract(selectedContract.id, user, setLoading, closeDeleteModal)
                                    }
                                }>
                                    Confirmar
                                </SubmitButton>
                            )
                        }
                    </DeleteButtonContainer>
                </DeleteContainer>
            </Modal>
            <Modal
                isOpen={modalEditIsOpen}
                onRequestClose={closeEditModal}
                style={ModalStyles}
            >
                <StyledFormArea>
                    <ProgressBarElement currentStep={step} totalSteps={3} />
                    <StyledFormTitle>
                        {step === 1 && "Dados Pessoais"}
                        {step === 2 && "Dados Técnicos"}
                        {step === 3 && "Dados Financeiros"}
                    </StyledFormTitle>
                    <Formik
                        initialValues={{
                            id: selectedContract.id,
                            nome: selectedContract.nome,
                            email: selectedContract.email,
                            profissao: selectedContract.profissao,
                            estadoCivil: selectedContract.estadoCivil,
                            dataNascimento: selectedContract.dataNascimento,
                            cpf: selectedContract.cpf,
                            rg: selectedContract.rg,
                            logradouro: selectedContract.endereco ? selectedContract.endereco.logradouro : '',
                            numero: selectedContract.endereco ? selectedContract.endereco.numero : 0,
                            bairro: selectedContract.endereco ? selectedContract.endereco.bairro : '',
                            cidade: selectedContract.endereco ? selectedContract.endereco.cidade : '',
                            uf: selectedContract.endereco ? selectedContract.endereco.uf : '',
                            cep: selectedContract.endereco ? selectedContract.endereco.cep : '',
                            modeloModulos: selectedContract.modeloModulos,
                            modeloInversor: selectedContract.modeloInversor,
                            potModulos: selectedContract.potModulos,
                            potInversor: selectedContract.potInversor,
                            dataContrato: selectedContract.dataContrato,
                            carencia: selectedContract.carencia,
                            dataPrimeiraParcela: selectedContract.dataPrimeiraParcela,
                            quantParcelas: selectedContract.quantParcelas,
                            priceTotal: selectedContract.priceTotal,
                            priceParcela: selectedContract.priceParcela,
                            avalista: selectedContract.avalistaId ? true : false,
                            nomeAvalista: selectedContract.avalistaId ? selectedContract.avalista.nome : '',
                            profissaoAvalista: selectedContract.avalistaId ? selectedContract.avalista.profissao : '',
                            cpfAvalista: selectedContract.avalistaId ? selectedContract.avalista.cpf : '',
                            logradouroAvalista: selectedContract.avalistaId ? selectedContract.avalista.endereco.logradouro : '',
                            numeroAvalista: selectedContract.avalistaId ? selectedContract.avalista.endereco.numero : 0,
                            bairroAvalista: selectedContract.avalistaId ? selectedContract.avalista.endereco.bairro : '',
                            cidadeAvalista: selectedContract.avalistaId ? selectedContract.avalista.endereco.cidade : '',
                            ufAvalista: selectedContract.avalistaId ? selectedContract.avalista.endereco.uf : '',
                            cepAvalista: selectedContract.avalistaId ? selectedContract.avalista.endereco.cep : '',
                            genero: selectedContract.genero,
                        }}
                        validationSchema={validationSchemas[step - 1]}
                        onSubmit={(values, { setSubmitting, setFieldError }) => {
                            if (step === 3) {
                                updateContract(values, user, setSubmitting, setFieldError, setLoading, closeEditModal);
                            }
                        }}
                    >
                        {
                            ({ setFieldValue, isSubmitting, validateForm, values }) => (
                                <Form>
                                    {
                                        step === 1 && (
                                            <>
                                                <FormContent>
                                                    <FormColumn>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><MdDriveFileRenameOutline />Nome</FormInputLabelRequired>
                                                            <FormInput
                                                                type='text'
                                                                name='nome'
                                                                placeholder='Nome do Cliente'
                                                                autoComplete='nome'
                                                            />
                                                        </FormInputArea>
                                                        <SubItensContainer>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><PiIdentificationCard />CPF</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <MaskedInputComponent
                                                                        name='cpf'
                                                                        mask={[/[0-9]/, /[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/]}
                                                                        value={values.cpf}
                                                                        type='text'
                                                                        placeholder='CPF do Cliente'
                                                                        autoComplete='cpf'
                                                                    />
                                                                </Limitador>
                                                            </FormInputArea>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><PiIdentificationCard />RG</FormInputLabelRequired>
                                                                <MaskedInputComponent
                                                                    name='rg'
                                                                    mask={[/[0-9]/, /[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/]}
                                                                    value={values.rg}
                                                                    type='text'
                                                                    placeholder='RG do Cliente'
                                                                    autoComplete='rg'
                                                                />
                                                            </FormInputArea>
                                                        </SubItensContainer>
                                                        <SubItensContainer>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><CgSelectR />Gênero</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <SelectWrapper>
                                                                        <Field as={FormSelect} name='genero'>
                                                                            <option value=''>Selecione o Gênero</option>
                                                                            <option value='MASCULINO'>Masculino</option>
                                                                            <option value='FEMININO'>Feminino</option>
                                                                        </Field>
                                                                    </SelectWrapper>
                                                                </Limitador>
                                                            </FormInputArea>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><GrUserWorker />Profissao</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='text'
                                                                    name='profissao'
                                                                    placeholder='Profissao do Cliente'
                                                                    autoComplete='profissao'
                                                                />
                                                            </FormInputArea>
                                                        </SubItensContainer>
                                                        <SubItensContainer>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><CiCalendarDate />Data de Nascimento</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <StyledDatePicker
                                                                        name='dataNascimento'
                                                                        setFieldValue={setFieldValue}
                                                                        selected={values.dataNascimento ? values.dataNascimento : new Date()}
                                                                    />
                                                                </Limitador>
                                                            </FormInputArea>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><CgSelectR />Estado Civil</FormInputLabelRequired>
                                                                <SelectWrapper>
                                                                    <Field as={FormSelect} name='estadoCivil'>
                                                                        <option value=''>Selecione o estado civil</option>
                                                                        <option value='SOLTEIRO'>Solteiro(a)</option>
                                                                        <option value='CASADO'>Casado(a)</option>
                                                                        <option value='SEPARADO'>Separado(a)</option>
                                                                        <option value='DIVORCIADO'>Divorciado(a)</option>
                                                                        <option value='VIUVO'>Viúvo(a)</option>
                                                                    </Field>
                                                                </SelectWrapper>
                                                            </FormInputArea>
                                                        </SubItensContainer>
                                                    </FormColumn>
                                                    <FormColumn $espacamento={12}>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaMailBulk />Email</FormInputLabelRequired>
                                                            <FormInput
                                                                type='text'
                                                                name='email'
                                                                placeholder='Email do Cliente'
                                                                autoComplete='email'
                                                            />
                                                        </FormInputArea>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired><FaLocationDot />Logradouro</FormInputLabelRequired>
                                                            <FormInput
                                                                type='text'
                                                                name='logradouro'
                                                                placeholder='Rua do Cliente'
                                                                autoComplete='logradouro'
                                                            />
                                                        </FormInputArea>
                                                        <SubItensContainerTriplo>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><AiOutlineFieldNumber />Numero</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <FormInput
                                                                        type='number'
                                                                        name='numero'
                                                                        placeholder='Numero'
                                                                        autoComplete='numero'
                                                                        min='0'
                                                                        step='1'
                                                                    />
                                                                </Limitador>
                                                            </FormInputArea>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaLocationDot />Bairro</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <FormInput
                                                                        type='text'
                                                                        name='bairro'
                                                                        placeholder='Bairro'
                                                                        autoComplete='bairro'
                                                                    />
                                                                </Limitador>
                                                            </FormInputArea>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaLocationDot />CEP</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <MaskedInputComponent
                                                                        name='cep'
                                                                        mask={[/[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/, /[0-9]/]}
                                                                        value={values.cep}
                                                                        type='text'
                                                                        placeholder='CEP'
                                                                        autoComplete='cep'
                                                                    />
                                                                </Limitador>
                                                            </FormInputArea>
                                                        </SubItensContainerTriplo>
                                                        <SubItensContainer>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaLocationDot />Cidade</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <FormInput
                                                                        type='text'
                                                                        name='cidade'
                                                                        placeholder='Cidade'
                                                                        autoComplete='cidade'
                                                                    />
                                                                </Limitador>
                                                            </FormInputArea>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><FaLocationDot />UF</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='text'
                                                                    name='uf'
                                                                    placeholder='UF'
                                                                    autoComplete='uf'
                                                                />
                                                            </FormInputArea>
                                                        </SubItensContainer>
                                                    </FormColumn>
                                                </FormContent>
                                            </>
                                        )
                                    }
                                    {
                                        step === 2 && (
                                            <>
                                                <FormContent>
                                                    <FormColumn>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired>Modelo Módulos</FormInputLabelRequired>
                                                            <FormInput
                                                                name='modeloModulos'
                                                                type='text'
                                                                placeholder='Modelo dos Módulos'
                                                                autoComplete='modeloModulos'
                                                            />
                                                        </FormInputArea>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired>Potência dos Módulos (kWp)</FormInputLabelRequired>
                                                            <FormInput
                                                                name='potModulos'
                                                                type='number'
                                                                step='0.01'
                                                                min='0'
                                                                autoComplete='potModulos'
                                                            />
                                                        </FormInputArea>
                                                    </FormColumn>
                                                    <FormColumn $espacamento={12}>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired>Modelo Inversor</FormInputLabelRequired>
                                                            <FormInput
                                                                name='modeloInversor'
                                                                type='text'
                                                                placeholder='Modelo do Inversor'
                                                                autoComplete='modeloInversor'
                                                            />
                                                        </FormInputArea>
                                                        <FormInputArea>
                                                            <FormInputLabelRequired>Potência do Inversor(kW)</FormInputLabelRequired>
                                                            <FormInput
                                                                name='potInversor'
                                                                type='number'
                                                                step='0.01'
                                                                min='0'
                                                                autoComplete='potInversor'
                                                            />
                                                        </FormInputArea>
                                                    </FormColumn>
                                                </FormContent>
                                            </>
                                        )
                                    }
                                    {
                                        step === 3 && (
                                            <>
                                                <FormContent>
                                                    <FormColumn>
                                                        <SubItensContainer>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><CiCalendarDate />Data do Contrato</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <StyledDatePicker
                                                                        name='dataContrato'
                                                                        setFieldValue={setFieldValue}
                                                                        selected={values.dataContrato ? values.dataContrato : new Date()}
                                                                    />
                                                                </Limitador>
                                                            </FormInputArea>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><CiCalendarDate />Data da Primeira Parcela</FormInputLabelRequired>
                                                                <StyledDatePicker
                                                                    name='dataPrimeiraParcela'
                                                                    setFieldValue={setFieldValue}
                                                                    selected={values.dataPrimeiraParcela ? values.dataPrimeiraParcela : new Date()}
                                                                />
                                                            </FormInputArea>
                                                        </SubItensContainer>
                                                        <SubItensContainer>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><AiOutlineFieldNumber />Carência (em dias)</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <FormInput
                                                                        type='number'
                                                                        name='carencia'
                                                                        step='1'
                                                                        min='0'
                                                                        autoComplete='carencia'
                                                                        onBlur={() => {
                                                                            const carencia = values.carencia;
                                                                            if (!values.dataPrimeiraParcela && values.dataContrato && carencia >= 0) {
                                                                                const dataContrato = new Date(values.dataContrato);
                                                                                const dataPrimeiraParcela = new Date(dataContrato);
                                                                                dataPrimeiraParcela.setDate(dataContrato.getDate() + carencia);
                                                                                setFieldValue('dataPrimeiraParcela', dataPrimeiraParcela);
                                                                            }
                                                                        }}
                                                                    />
                                                                </Limitador>
                                                            </FormInputArea>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><AiOutlineFieldNumber />Quantidade de Parcelas</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='number'
                                                                    name='quantParcelas'
                                                                    step='1'
                                                                    min='0'
                                                                    onBlur={() => {
                                                                        const quantParcelas = values.quantParcelas;
                                                                        const priceTotal = values.priceTotal;
                                                                        if (quantParcelas > 0 && priceTotal > 0) {
                                                                            const priceParcela = priceTotal / quantParcelas;
                                                                            setFieldValue('priceParcela', parseFloat(priceParcela.toFixed(2)));
                                                                        }
                                                                    }}
                                                                />
                                                            </FormInputArea>
                                                        </SubItensContainer>
                                                        <SubItensContainer>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><RiMoneyDollarBoxLine />Preço Total (R$)</FormInputLabelRequired>
                                                                <Limitador>
                                                                    <FormInput
                                                                        type='number'
                                                                        name='priceTotal'
                                                                        step='0.01'
                                                                        min='0'
                                                                    />
                                                                </Limitador>
                                                            </FormInputArea>
                                                            <FormInputArea>
                                                                <FormInputLabelRequired><RiMoneyDollarBoxLine />Preço Parcelas (R$)</FormInputLabelRequired>
                                                                <FormInput
                                                                    type='number'
                                                                    name='priceParcela'
                                                                    step='0.01'
                                                                    min='0'
                                                                />
                                                            </FormInputArea>
                                                        </SubItensContainer>
                                                        <FormInputArea>
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'flex-start'
                                                            }}>
                                                                <Field
                                                                    type='checkbox'
                                                                    name='avalista'
                                                                    style={{
                                                                        marginRight: '10px',
                                                                    }}
                                                                />
                                                                <FormInputLabelRequired htmlFor='avalista'>IncluirAvalista?</FormInputLabelRequired>
                                                            </div>
                                                        </FormInputArea>
                                                    </FormColumn>
                                                    {
                                                        values.avalista && (
                                                            <FormColumn $espacamento={12}>
                                                                <FormInputArea>
                                                                    <FormInputLabelRequired><MdDriveFileRenameOutline />Nome do Avalista</FormInputLabelRequired>
                                                                    <FormInput
                                                                        type='text'
                                                                        name='nomeAvalista'
                                                                        placeholder='Nome do Avalista'
                                                                        autoComplete='nomeAvalista'
                                                                    />
                                                                </FormInputArea>
                                                                <SubItensContainer>
                                                                    <FormInputArea>
                                                                        <FormInputLabelRequired><PiIdentificationCard />CPF</FormInputLabelRequired>
                                                                        <Limitador>
                                                                            <MaskedInputComponent
                                                                                name='cpfAvalista'
                                                                                mask={[/[0-9]/, /[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/]}
                                                                                value={values.cpfAvalista}
                                                                                type='text'
                                                                                placeholder='CPF'
                                                                                autoComplete='cpfAvalista'
                                                                            />
                                                                        </Limitador>
                                                                    </FormInputArea>
                                                                    <FormInputArea>
                                                                        <FormInputLabelRequired><GrUserWorker />Profissao</FormInputLabelRequired>
                                                                        <FormInput
                                                                            type='text'
                                                                            name='profissaoAvalista'
                                                                            placeholder='Profissao'
                                                                            autoComplete='profissaoAvalista'
                                                                        />
                                                                    </FormInputArea>
                                                                </SubItensContainer>
                                                                <FormInputArea>
                                                                    <FormInputLabelRequired><FaLocationDot />Logradouro</FormInputLabelRequired>
                                                                    <FormInput
                                                                        type='text'
                                                                        name='logradouroAvalista'
                                                                        placeholder='Rua do Avalista'
                                                                        autoComplete='logradouroAvalista'
                                                                    />
                                                                </FormInputArea>
                                                                <SubItensContainerTriplo>
                                                                    <FormInputArea>
                                                                        <FormInputLabelRequired><AiOutlineFieldNumber />Numero</FormInputLabelRequired>
                                                                        <Limitador>
                                                                            <FormInput
                                                                                type='number'
                                                                                name='numeroAvalista'
                                                                                placeholder='Numero'
                                                                                autoComplete='numeroAvalista'
                                                                                min='0'
                                                                                step='1'
                                                                            />
                                                                        </Limitador>
                                                                    </FormInputArea>
                                                                    <FormInputArea>
                                                                        <FormInputLabelRequired><FaLocationDot />Bairro</FormInputLabelRequired>
                                                                        <Limitador>
                                                                            <FormInput
                                                                                type='text'
                                                                                name='bairroAvalista'
                                                                                placeholder='Bairro'
                                                                                autoComplete='bairroAvalista'
                                                                            />
                                                                        </Limitador>
                                                                    </FormInputArea>
                                                                    <FormInputArea>
                                                                        <FormInputLabelRequired><FaLocationDot />CEP</FormInputLabelRequired>
                                                                        <Limitador>
                                                                            <MaskedInputComponent
                                                                                name='cepAvalista'
                                                                                mask={[/[0-9]/, /[0-9]/, '.', /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/, /[0-9]/]}
                                                                                value={values.cepAvalista}
                                                                                type='text'
                                                                                placeholder='CEP'
                                                                                autoComplete='cepAvalista'
                                                                            />
                                                                        </Limitador>
                                                                    </FormInputArea>
                                                                </SubItensContainerTriplo>
                                                                <SubItensContainer>
                                                                    <FormInputArea>
                                                                        <FormInputLabelRequired><FaLocationDot />Cidade</FormInputLabelRequired>
                                                                        <Limitador>
                                                                            <FormInput
                                                                                type='text'
                                                                                name='cidadeAvalista'
                                                                                placeholder='Cidade'
                                                                                autoComplete='cidadeAvalista'
                                                                            />
                                                                        </Limitador>
                                                                    </FormInputArea>
                                                                    <FormInputArea>
                                                                        <FormInputLabelRequired><FaLocationDot />UF</FormInputLabelRequired>
                                                                        <FormInput
                                                                            type='text'
                                                                            name='ufAvalista'
                                                                            placeholder='UF'
                                                                            autoComplete='ufAvalista'
                                                                        />
                                                                    </FormInputArea>
                                                                </SubItensContainer>
                                                            </FormColumn>
                                                        )
                                                    }
                                                </FormContent>
                                            </>
                                        )
                                    }
                                    <ButtonGroup>
                                        <BackButton
                                            onClick={() => closeEditModal()}
                                            type="button"
                                        >
                                            Cancelar
                                        </BackButton>
                                        {
                                            step > 1 && (
                                                <BackButton
                                                    onClick={() => setStep(step - 1)}
                                                    type="button"
                                                >
                                                    Voltar
                                                </BackButton>
                                            )
                                        }
                                        {
                                            step < 3 && (
                                                <NextButton
                                                    onClick={() => handleNext(validateForm)}
                                                    type="button"
                                                >
                                                    Próximo
                                                </NextButton>
                                            )
                                        }
                                        {(!isSubmitting && step === 3) && (
                                            <SubmitButton type='submit'>
                                                Salvar
                                            </SubmitButton>
                                        )}
                                        {(isSubmitting && step === 3) && (
                                            <ThreeDots
                                                color={colors.theme}
                                                height={49}
                                                width={100}
                                            />
                                        )}
                                    </ButtonGroup>
                                </Form>
                            )
                        }
                    </Formik>
                </StyledFormArea>
            </Modal>
        </ContractListContainer>
    );
}

export default ContractList;