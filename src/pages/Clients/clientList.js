import Modal from "react-modal";
import {
    AdminContainer,
    BackButton,
    ButtonGroup,
    ClientLabel,
    ClientListContainer,
    ClientListHeader,
    ClientListHeaderLabel,
    ClientTitle,
    ClientValue,
    ClientValueContainer,
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
    SingleClient,
    StyledFormArea,
    SubItensContainer,
    SubmitButton
} from "./styles";
import Pagination from "../../components/Pagination";
import { useMemo, useState } from "react";
import { FaEdit, FaFileInvoice, FaMapMarkerAlt, FaMapPin, FaPhoneAlt, FaTrashAlt, FaUser, FaWhatsapp } from "react-icons/fa";
import { colors, ModalStyles } from "../../utils/GlobalStyles";
import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { MdDriveFileRenameOutline } from "react-icons/md";
import { FormInput, MaskedInputComponent } from "../../components/FormLib";
import { ThreeDots } from "react-loader-spinner";
import { deleteClient, updateClient } from "../../services/clientServices";
import { ImWarning } from "react-icons/im";

const ClientList = ({ clients, navigate, search, page, setPage, itensPerPage, setLoading, user }) => {

    Modal.setAppElement(document.getElementById('root'));

    const [selectedClient, setSelectedClient] = useState({});

    const [modalEditIsOpen, setModalEditIsOpen] = useState(false);
    const [modalDeleteIsOpen, setModalDeleteIsOpen] = useState(false);

    const openEditModal = () => setModalEditIsOpen(true);

    const closeEditModal = () => {
        setModalEditIsOpen(false);
        setSelectedClient({});
    };

    const openDeleteModal = () => setModalDeleteIsOpen(true);
    
    const closeDeleteModal = () => {
        setModalDeleteIsOpen(false);
        setSelectedClient({});
    };

    const filteredClients = useMemo(() =>
        clients.filter(client =>
            client.name.toLowerCase().includes(search.toLowerCase()) ||
            client.phone.toLowerCase().includes(search.toLowerCase()) ||
            client.address.toLowerCase().includes(search.toLowerCase())
        ), [clients, search]
    );

    const totalPages = Math.ceil(filteredClients.length / itensPerPage);
    const currentPageItens = filteredClients.slice((page - 1) * itensPerPage, page * itensPerPage);

    return (
        <ClientListContainer>
            <ClientListHeader>
                <ClientListHeaderLabel className="first-label">Nome</ClientListHeaderLabel>
                <ClientListHeaderLabel>Telefone</ClientListHeaderLabel>
                <ClientListHeaderLabel className="label-responsive">Cidade</ClientListHeaderLabel>
                <ClientListHeaderLabel>Opções</ClientListHeaderLabel>
            </ClientListHeader>
            {
                currentPageItens.map((cliente) => (
                    <SingleClient key={cliente.id}>
                        <ClientValueContainer>
                            <ClientLabel><FaUser style={{ marginLeft: '5px' }} /></ClientLabel>
                            <ClientValue>{cliente.name}</ClientValue>
                        </ClientValueContainer>
                        <ClientValueContainer>
                            <ClientLabel><FaWhatsapp /></ClientLabel>
                            <ClientValue
                                href={`https://whatsa.me/55${cliente.phone}`}
                                target='_blank'
                                onClick={(event) => {
                                    event.stopPropagation();
                                }}
                            >{cliente.phone}</ClientValue>
                        </ClientValueContainer>
                        <ClientValueContainer className="label-responsive">
                            <ClientLabel className="label-responsive"><FaMapPin /></ClientLabel>
                            <ClientValue className="label-responsive">{cliente.address}</ClientValue>
                        </ClientValueContainer>
                        <AdminContainer>
                            <EditIconContainer onClick={(event) => {
                                event.stopPropagation();
                                setSelectedClient(cliente);
                                openEditModal();
                            }}>
                                <FaEdit />
                            </EditIconContainer>
                            <DeleteIconContainer onClick={(event) => {
                                event.stopPropagation();
                                setSelectedClient(cliente);
                                openDeleteModal();
                            }}>
                                <FaTrashAlt />
                            </DeleteIconContainer>
                        </AdminContainer>
                    </SingleClient>
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
                        <ClientTitle><FaFileInvoice /> Editar Cliente</ClientTitle>
                    </div>
                    <Formik
                        initialValues={{
                            id: selectedClient.id,
                            name: selectedClient.name,
                            phone: selectedClient.phone,
                            address: selectedClient.address,
                        }}
                        validationSchema={
                            Yup.object({
                                name: Yup.string().required('Nome é orbigatório.'),
                                phone: Yup.string().matches(/^\d{11}$/, 'Telefone inválido'),
                                address: Yup.string(),
                            })
                        }
                        onSubmit={(values, { setSubmitting, setFieldError }) => {
                            updateClient(values, user, setFieldError, setSubmitting, setLoading);
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
                                                placeholder='Nome do Cliente'
                                                autoComplete='name'
                                            />
                                        </FormInputArea>
                                        <SubItensContainer>
                                            <Limitador>
                                                <FormInputArea>
                                                    <FormInputLabel><FaPhoneAlt /> Telefone</FormInputLabel>
                                                    <MaskedInputComponent
                                                        name='phone'
                                                        type='text'
                                                        mask={['(', /[0-9]/, /[0-9]/, ')', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, '-', /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/]}
                                                        value={values.phone}
                                                        placeholder='Telefone do Cliente'
                                                        autoComplete='tel'
                                                    />
                                                </FormInputArea>
                                            </Limitador>
                                            <FormInputArea>
                                                <FormInputLabel><FaMapMarkerAlt /> Endereço</FormInputLabel>
                                                <FormInput
                                                    type='text'
                                                    name='address'
                                                    placeholder='Endereço do Cliente'
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
                    <DeleteTitle>Deseja excluir o Cliente {selectedClient.name}?</DeleteTitle>
                    <DeleteButtonContainer>
                        <BackButton onClick={() => {
                            closeDeleteModal();
                        }}>
                            Cancelar
                        </BackButton>
                        <SubmitButton onClick={() => {
                            deleteClient(selectedClient.id, user, setLoading);
                        }}>
                            Excluir
                        </SubmitButton>
                    </DeleteButtonContainer>
                </DeleteContainer>
            </Modal>
        </ClientListContainer >
    );
}

export default ClientList;