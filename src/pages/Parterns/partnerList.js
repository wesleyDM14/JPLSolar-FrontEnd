import Modal from 'react-modal';
import {
    AdminContainer,
    BackButton,
    ButtonGroup,
    DeleteButtonContainer,
    DeleteContainer,
    DeleteIconContainer,
    DeleteTitle,
    EditIconContainer,
    FormContent,
    FormInputArea,
    FormInputLabel,
    FormInputLabelRequired,
    IconWrapper,
    Limitador,
    PartnerLabel,
    PartnerListContainer,
    PartnerListHeader,
    PartnerListHeaderLabel,
    PartnerTitle,
    PartnerValue,
    PartnerValueContainer,
    SinglePartner,
    StyledFormArea,
    SubItensContainer,
    SubmitButton,
} from './styles';
import { FaEdit, FaFileInvoice, FaMapMarkerAlt, FaMapPin, FaPhoneAlt, FaTrashAlt, FaUser, FaWhatsapp } from 'react-icons/fa';
import { useMemo, useState } from 'react';
import Pagination from '../../components/Pagination';
import { colors, ModalStyles } from '../../utils/GlobalStyles';
import { Form, Formik } from 'formik';
import { deletePartner, updatePartner } from '../../services/partnerService';
import { MdDriveFileRenameOutline } from 'react-icons/md';
import { FormInput, MaskedInputComponent } from '../../components/FormLib';
import { ThreeDots } from 'react-loader-spinner';
import { ImWarning } from 'react-icons/im';
import * as Yup from 'yup';

const PartnerList = ({ partners, navigate, search, page, setPage, itensPerPage, setLoading, user }) => {
    Modal.setAppElement(document.getElementById('root'));

    const [selectedPartner, setSelectedPartner] = useState({});

    const [modalEditIsOpen, setModalEditIsOpen] = useState(false);
    const [modalDeleteIsOpen, setModalDeleteIsOpen] = useState(false);

    const openEditModal = () => setModalEditIsOpen(true);

    const closeEditModal = () => {
        setModalEditIsOpen(false);
        setSelectedPartner({});
    };

    const openDeleteModal = () => setModalDeleteIsOpen(true);

    const closeDeleteModal = () => {
        setModalDeleteIsOpen(false);
        setSelectedPartner({});
    };

    const filteredPartners = useMemo(() =>
        partners.filter(partner =>
            partner.name.toLowerCase().includes(search.toLowerCase()) ||
            partner.phone.toLowerCase().includes(search.toLowerCase()) ||
            partner.address.toLowerCase().includes(search.toLowerCase())
        ), [partners, search]
    );

    const totalPages = Math.ceil(filteredPartners.length / itensPerPage);
    const currentPageItens = filteredPartners.slice((page - 1) * itensPerPage, page * itensPerPage);

    return (
        <PartnerListContainer>
            <PartnerListHeader>
                <PartnerListHeaderLabel className="first-label">Nome</PartnerListHeaderLabel>
                <PartnerListHeaderLabel>Telefone</PartnerListHeaderLabel>
                <PartnerListHeaderLabel className="label-responsive">Cidade</PartnerListHeaderLabel>
                <PartnerListHeaderLabel>Opções</PartnerListHeaderLabel>
            </PartnerListHeader>
            {
                currentPageItens.map((partner) => (
                    <SinglePartner key={partner.id} onClick={() => navigate(`/parceiros/${partner.id}`)}>
                        <PartnerValueContainer>
                            <PartnerLabel><FaUser style={{ marginLeft: '5px' }} /></PartnerLabel>
                            <PartnerValue>{partner.name}</PartnerValue>
                        </PartnerValueContainer>
                        <PartnerValueContainer>
                            <PartnerLabel><FaWhatsapp /></PartnerLabel>
                            <PartnerValue
                                href={`https://whatsa.me/55${partner.phone}`}
                                target='_blank'
                                onClick={(event) => {
                                    event.stopPropagation();
                                }}
                            >{partner.phone}</PartnerValue>
                        </PartnerValueContainer>
                        <PartnerValueContainer className="label-responsive">
                            <PartnerLabel className="label-responsive"><FaMapPin /></PartnerLabel>
                            <PartnerValue className="label-responsive">{partner.address}</PartnerValue>
                        </PartnerValueContainer>
                        <AdminContainer>
                            <EditIconContainer onClick={(event) => {
                                event.stopPropagation();
                                setSelectedPartner(partner);
                                openEditModal();
                            }}>
                                <FaEdit />
                            </EditIconContainer>
                            <DeleteIconContainer onClick={(event) => {
                                event.stopPropagation();
                                setSelectedPartner(partner);
                                openDeleteModal();
                            }}>
                                <FaTrashAlt />
                            </DeleteIconContainer>
                        </AdminContainer>
                    </SinglePartner>
                ))
            }
            <Pagination currentPage={page} setPage={setPage} totalPages={totalPages} />
            <Modal
                isOpen={modalEditIsOpen}
                onRequestClose={closeEditModal}
                style={ModalStyles}
            >
                <StyledFormArea>
                    <div style={{ display: 'flex', marginBottom: '30px', alignItems: 'center', justifyContent: 'center' }}>
                        <PartnerTitle><FaFileInvoice /> Editar Parceiro</PartnerTitle>
                    </div>
                    <Formik
                        initialValues={{
                            id: selectedPartner.id,
                            name: selectedPartner.name,
                            phone: selectedPartner.phone,
                            address: selectedPartner.address,
                        }}
                        validationSchema={
                            Yup.object({
                                name: Yup.string().required('Nome é orbigatório.'),
                                phone: Yup.string().matches(/^\d{11}$/, 'Telefone inválido'),
                                address: Yup.string(),
                            })
                        }
                        onSubmit={(values, { setSubmitting, setFieldError }) => {
                            updatePartner(values, user, setFieldError, setSubmitting, setLoading);
                        }}
                    >
                        {
                            ({ isSubmitting, values }) => (
                                <Form>
                                    <FormContent>
                                        <FormInputArea>
                                            <FormInputLabelRequired><MdDriveFileRenameOutline />Nome</FormInputLabelRequired>
                                            <FormInput
                                                type='text'
                                                name='name'
                                                placeholder='Nome do Parceiro'
                                                autoComplete='name'
                                            />
                                        </FormInputArea>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabel><FaPhoneAlt />Telefone</FormInputLabel>
                                                    <MaskedInputComponent
                                                        name='phone'
                                                        type='text'
                                                        mask={['(', /[0-9]/, /[0-9]/, ')', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/]}
                                                        value={values.phone}
                                                        placeholder='Telefone do Parceiro'
                                                        autoComplete='tel'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabel><FaMapMarkerAlt /> Endereço</FormInputLabel>
                                                <FormInput
                                                    type='text'
                                                    name='address'
                                                    placeholder='Endereço do Parceiro'
                                                    autoComplete='street-address'
                                                />
                                            </FormInputArea>
                                        </SubItensContainer>
                                        <ButtonGroup>
                                            <BackButton type="button" onClick={
                                                () => {
                                                    closeEditModal();
                                                }
                                            }>
                                                Cancelar</BackButton>
                                            {
                                                !isSubmitting && (
                                                    <SubmitButton type="submit">Atualizar</SubmitButton>
                                                )
                                            }
                                            {
                                                isSubmitting && (
                                                    <ThreeDots color={colors.icon} />
                                                )
                                            }

                                        </ButtonGroup>
                                    </FormContent>
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
                    <DeleteTitle>Deseja excluir o Parceiro {selectedPartner.name}?</DeleteTitle>
                    <DeleteButtonContainer>
                        <BackButton onClick={() => {
                            closeDeleteModal();
                        }}>
                            Cancelar
                        </BackButton>
                        <SubmitButton onClick={() => {
                            deletePartner(selectedPartner.id, user, setLoading);
                        }}>
                            Excluir
                        </SubmitButton>
                    </DeleteButtonContainer>
                </DeleteContainer>
            </Modal>
        </PartnerListContainer>
    );
}

export default PartnerList;