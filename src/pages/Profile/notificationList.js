import { useState } from "react";
import Modal from "react-modal";
import {
    AdminNotificationContainer,
    BackButton,
    DeleteButtonContainer,
    DeleteContainer,
    DeleteIconContainer,
    DeleteTitle,
    NotificationContainer,
    NotificationHeader,
    NotificationLabel,
    NotificationValue,
    NotificationValueArea,
    NotificationValueLabel,
    SingleNotification,
    SubmitButton,
} from "./styles";
import Pagination from "../../components/Pagination";
import { FaEnvelope, FaEnvelopeOpen, FaTrashAlt } from "react-icons/fa";
import { ModalStyles } from "../../utils/GlobalStyles";
import { IconWrapper } from "../Clients/styles";
import { ImWarning } from "react-icons/im";
import { deleteNotification } from "../../services/userServices";

const NotificationList = ({ notifications, page, setPage, itensPerPage, setIsNotificationLoading, user }) => {
    Modal.setAppElement(document.getElementById('root'));

    const [selectedNotification, setSelectedNotification] = useState({});

    const [modalNotificationIsOpen, setModalNotificationIsOpen] = useState(false);
    const [modalDeleteIsOpen, setModalDeleteIsOpen] = useState(false);

    const openNotificationModal = () => setModalNotificationIsOpen(true);

    const closeNotificationModal = () => {
        setModalNotificationIsOpen(false);
        setSelectedNotification({});
    };

    const openDeleteModal = () => setModalDeleteIsOpen(true);

    const closeDeleteModal = () => {
        setModalDeleteIsOpen(false);
        setSelectedNotification({});
    };

    const totalPages = Math.ceil(notifications.length / itensPerPage);
    const currentPageItens = notifications.slice((page - 1) * itensPerPage, page * itensPerPage);

    return (
        <NotificationContainer>
            <NotificationHeader>
                <NotificationLabel>Título</NotificationLabel>
                <NotificationLabel>Opções</NotificationLabel>
            </NotificationHeader>
            {
                currentPageItens.map((notification) => (
                    <SingleNotification key={notification.id} onClick={
                        () => {
                            setSelectedNotification(notification);
                            openNotificationModal();
                        }
                    }>
                        <NotificationValueArea>
                            <NotificationValueLabel>{notification.isRead ? <FaEnvelopeOpen /> : <FaEnvelope />}</NotificationValueLabel>
                            <NotificationValue $isRead={notification.isRead}>{notification.message}</NotificationValue>
                        </NotificationValueArea>
                        <AdminNotificationContainer>
                            <DeleteIconContainer onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNotification(notification);
                                openDeleteModal();
                            }}>
                                <FaTrashAlt />
                            </DeleteIconContainer>
                        </AdminNotificationContainer>
                    </SingleNotification>
                ))
            }
            <Modal
                isOpen={modalDeleteIsOpen}
                onRequestClose={closeDeleteModal}
                style={ModalStyles}
            >
                <DeleteContainer>
                    <IconWrapper>
                        <ImWarning />
                    </IconWrapper>
                    <DeleteTitle>Deseja excluir a Notificação?</DeleteTitle>
                    <DeleteButtonContainer>
                        <BackButton onClick={() => {
                            closeDeleteModal();
                        }}>
                            Cancelar
                        </BackButton>
                        <SubmitButton onClick={() => {
                            deleteNotification(user, selectedNotification.id, setIsNotificationLoading, closeDeleteModal);
                        }}>
                            Excluir
                        </SubmitButton>
                    </DeleteButtonContainer>
                </DeleteContainer>
            </Modal>
            <Modal
                isOpen={modalNotificationIsOpen}
                onRequestClose={closeNotificationModal}
                style={ModalStyles}
            >
                <DeleteContainer>
                    <DeleteTitle>{selectedNotification.message}</DeleteTitle>
                    <DeleteButtonContainer>
                        <BackButton onClick={() => {
                            closeNotificationModal();
                        }}>
                            Cancelar
                        </BackButton>
                        <SubmitButton onClick={() => {
                            deleteNotification(user, selectedNotification.id, setIsNotificationLoading, closeNotificationModal);
                        }}>
                            Excluir
                        </SubmitButton>
                    </DeleteButtonContainer>
                </DeleteContainer>
            </Modal>
            <Pagination currentPage={page} setPage={setPage} totalPages={totalPages} />
        </NotificationContainer>
    )

}

export default NotificationList;