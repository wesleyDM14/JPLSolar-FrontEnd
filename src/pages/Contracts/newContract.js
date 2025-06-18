import React, { useState } from "react";
import { Field, Form, Formik } from "formik";
import {
    BackButton,
    ButtonGroup,
    ContractHeader,
    ContractsContainer,
    ContractTitle,
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
    Step,
    StepNumber,
    StyledFormArea,
    StyledFormTitle,
    SubItensContainer,
    SubItensContainerTriplo,
    SubmitButton,
} from "./styles";
import * as Yup from 'yup';
import { FormInput, MaskedInputComponent, StyledDatePicker } from "../../components/FormLib";
import { ThreeDots } from "react-loader-spinner";
import { colors } from "../../utils/GlobalStyles";
import { FaFileInvoice, FaMailBulk, } from "react-icons/fa";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { createContract } from "../../services/contractService";
import { PiIdentificationCard } from "react-icons/pi";
import { GrUserWorker } from "react-icons/gr";
import { CiCalendarDate } from "react-icons/ci";
import { CgSelectR } from "react-icons/cg";
import { FaLocationDot } from "react-icons/fa6";
import { AiOutlineFieldNumber } from "react-icons/ai";
import { RiMoneyDollarBoxLine } from "react-icons/ri";

const NewContract = ({ navigate, user }) => {

    const [step, setStep] = useState(1);

    const initialValues = {
        nome: '',
        email: '',
        profissao: '',
        estadoCivil: '',
        dataNascimento: new Date(),
        cpf: '',
        rg: '',
        logradouro: '',
        numero: 0,
        bairro: '',
        cidade: '',
        uf: '',
        cep: '',
        modeloModulos: '',
        modeloInversor: '',
        potModulos: 0,
        potInversor: 0,
        dataContrato: new Date(),
        carencia: 0,
        dataPrimeiraParcela: null,
        quantParcelas: 0,
        priceTotal: 0,
        priceParcela: 0,
        avalista: false,
        nomeAvalista: '',
        profissaoAvalista: '',
        cpfAvalista: '',
        logradouroAvalista: '',
        numeroAvalista: 0,
        bairroAvalista: '',
        cidadeAvalista: '',
        ufAvalista: '',
        cepAvalista: '',
        genero: '',
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
        genero: Yup.string().required('Genero é obrigatório'),
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

    return (
        <ContractsContainer>
            <ContractHeader>
                <ContractTitle><FaFileInvoice style={{ marginRight: '10px' }} />Adicionar Novo Contrato</ContractTitle>
            </ContractHeader>
            <StyledFormArea>
                <ProgressBarElement currentStep={step} totalSteps={3} />
                <StyledFormTitle>
                    {step === 1 && "Dados Pessoais"}
                    {step === 2 && "Dados Técnicos"}
                    {step === 3 && "Dados Financeiros"}
                </StyledFormTitle>
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchemas[step - 1]}
                    onSubmit={(values, { setSubmitting, setFieldError }) => {
                        if (step === 3) {
                            createContract(values, user, navigate, setSubmitting, setFieldError);
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
                                                            <FormInput
                                                                type='text'
                                                                name='rg'
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
                                            Registrar
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
        </ContractsContainer >
    );
}

export default NewContract;