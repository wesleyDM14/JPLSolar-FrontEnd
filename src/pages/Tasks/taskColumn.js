import { createTask, deleteColumn, deleteTask, updateTask } from "../../services/tasksService";
import { AddTaskButton, ColumnContainer, ColumnTitle, DeleteColumnButton } from "./styles";
import Modal from "react-modal";
import { useState } from "react";
import { colors, ModalStyles } from "../../utils/GlobalStyles";
import { BackButton, ButtonGroup, DeleteButtonContainer, DeleteContainer, DeleteTitle, FormContent, FormInputArea, FormInputLabel, FormInputLabelRequired, IconWrapper, Limitador, StyledFormArea, SubItensContainer, SubmitButton } from "../Parterns/styles";
import { ImWarning } from "react-icons/im";
import * as Yup from 'yup';
import { ClientTitle } from "../Clients/styles";
import { FaAddressCard, FaCalendarAlt, FaFileInvoice } from "react-icons/fa";
import { Form, Formik } from "formik";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { FormInput, StyledDatePicker } from "../../components/FormLib";
import { ThreeDots } from "react-loader-spinner";
import { Draggable, Droppable } from "../../components/DragAndDrop";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

const TaskColumn = ({ column, setLoading, user }) => {
    Modal.setAppElement(document.getElementById('root'));

    const [modalEditTaskIsOpen, setModalEditTaskIsOpen] = useState(false);
    const [modalCreateTaskIsOpen, setModalCreateTaskIsOpen] = useState(false);
    const [modalDeleteColumnIsOpen, setModalDeleteColumnIsOpen] = useState(false);
    const [modalDeleteTaskIsOpen, setModalDeleteTaskIsOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState({});
    const [deleting, setDeleting] = useState(false);

    const openEditTaskModal = () => setModalEditTaskIsOpen(true);

    const closeEditTaskModal = () => {
        setModalEditTaskIsOpen(false);
        setSelectedTask({});
    };

    const openDeleteColumnModal = () => setModalDeleteColumnIsOpen(true);

    const closeDeleteColumnModal = () => {
        setModalDeleteColumnIsOpen(false);
    };

    const openDeleteTaskModal = () => setModalDeleteTaskIsOpen(true);

    const closeDeleteTaskModal = () => {
        setModalDeleteTaskIsOpen(false);
    };

    const openCreateTaskModal = () => setModalCreateTaskIsOpen(true);

    const closeCreateTaskModal = () => setModalCreateTaskIsOpen(false);

    return (
        <Droppable key={column.id} id={column.id}>
            <ColumnContainer>
                <ColumnTitle>{column.title}</ColumnTitle>
                <SortableContext
                    items={column.Task.map((task) => `${column.id}:${task.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    {
                        column.Task.map((task) => (
                            <Draggable
                                key={task.id}
                                id={`${column.id}:${task.id}`}
                                onClick={() => {
                                    setSelectedTask(task);
                                    openEditTaskModal();
                                }}>
                                <div style={{ padding: "1rem", border: "1px solid #ccc" }}>
                                    {task.name}
                                </div>
                            </Draggable>
                        ))
                    }
                </SortableContext>
                <AddTaskButton onClick={openCreateTaskModal}>Adicionar Tarefa</AddTaskButton>
                <DeleteColumnButton onClick={openDeleteColumnModal}>Deletar Coluna</DeleteColumnButton>
                <Modal
                    isOpen={modalDeleteColumnIsOpen}
                    onRequestClose={closeDeleteColumnModal}
                    style={ModalStyles}
                >
                    <DeleteContainer>
                        <IconWrapper>
                            <ImWarning />
                        </IconWrapper>
                        <DeleteTitle>Deseja excluir a Coluna {column.title}?</DeleteTitle>
                        <DeleteButtonContainer>
                            <BackButton onClick={() => {
                                closeDeleteColumnModal();
                            }}>
                                Cancelar
                            </BackButton>
                            {
                                !deleting && (
                                    <SubmitButton onClick={() => {
                                        setDeleting(true);
                                        deleteColumn(user, column.id, setLoading, setDeleting);
                                    }}>
                                        Excluir
                                    </SubmitButton>
                                )
                            }
                            {
                                deleting && (
                                    <ThreeDots color={colors.icon} />
                                )
                            }

                        </DeleteButtonContainer>
                    </DeleteContainer>
                </Modal>
                <Modal
                    isOpen={modalCreateTaskIsOpen}
                    onRequestClose={closeCreateTaskModal}
                    style={ModalStyles}
                >
                    <StyledFormArea>
                        <div style={{ display: 'flex', marginBottom: '30px', alignItems: 'center', justifyContent: 'center' }}>
                            <ClientTitle><FaFileInvoice /> Nova Tarefa</ClientTitle>
                        </div>
                        <Formik
                            initialValues={{
                                columnId: column.id,
                                name: '',
                                description: '',
                                data: new Date(),
                            }}
                            validationSchema={
                                Yup.object({
                                    name: Yup.string().required('Nome é orbigatório.'),
                                    description: Yup.string().required('Descrição é obirgatória.'),
                                    data: Yup.date(),
                                })
                            }
                            onSubmit={(values, { setSubmitting, setFieldError }) => {
                                createTask(user, values, setSubmitting, setFieldError, setLoading);
                            }}
                        >
                            {
                                ({ isSubmitting, setFieldValue, values }) => (
                                    <Form>
                                        <FormContent>
                                            <FormInputArea>
                                                <FormInputLabelRequired><MdDriveFileRenameOutline />Nome</FormInputLabelRequired>
                                                <FormInput
                                                    type='text'
                                                    name='name'
                                                    placeholder='Titulo da Tarefa'
                                                    autoComplete='name'
                                                />
                                            </FormInputArea>
                                            <SubItensContainer>
                                                <Limitador>
                                                    <FormInputArea>
                                                        <FormInputLabel><FaAddressCard /> Descrição</FormInputLabel>
                                                        <FormInput
                                                            type='text'
                                                            name='description'
                                                            placeholder='Descrção da Tarefa'
                                                            autoComplete='name'
                                                        />
                                                    </FormInputArea>
                                                </Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaCalendarAlt />Data da Tarefa</FormInputLabelRequired>
                                                    <StyledDatePicker
                                                        name='installationDate'
                                                        setFieldValue={setFieldValue}
                                                        selected={values.data ? values.data : new Date()}
                                                    />
                                                </FormInputArea>
                                            </SubItensContainer>
                                            <ButtonGroup>
                                                <BackButton type="button" onClick={
                                                    () => {
                                                        closeCreateTaskModal();
                                                    }
                                                }>
                                                    Cancelar</BackButton>
                                                {
                                                    !isSubmitting && (
                                                        <SubmitButton type="submit">Criar Tarefa</SubmitButton>
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
                    isOpen={modalEditTaskIsOpen}
                    onRequestClose={closeEditTaskModal}
                    style={ModalStyles}
                >
                    <StyledFormArea>
                        <div style={{ display: 'flex', marginBottom: '30px', alignItems: 'center', justifyContent: 'center' }}>
                            <ClientTitle><FaFileInvoice />Tarefa</ClientTitle>
                        </div>
                        <Formik
                            initialValues={{
                                id: selectedTask.id,
                                columnId: selectedTask.columnId,
                                name: selectedTask.name,
                                description: selectedTask.description,
                                data: selectedTask.dataFinal ? selectedTask.dataFinal : new Date(),
                                position: selectedTask.position,
                            }}
                            validationSchema={
                                Yup.object({
                                    name: Yup.string(),
                                    description: Yup.string(),
                                    data: Yup.date(),
                                })
                            }
                            onSubmit={(values, { setSubmitting, setFieldError }) => {
                                updateTask(user, values, setSubmitting, setFieldError, setLoading);
                            }}
                        >
                            {
                                ({ isSubmitting, setFieldValue, values }) => (
                                    <Form>
                                        <FormContent>
                                            <FormInputArea>
                                                <FormInputLabelRequired><MdDriveFileRenameOutline />Nome</FormInputLabelRequired>
                                                <FormInput
                                                    type='text'
                                                    name='name'
                                                    placeholder='Titulo da Tarefa'
                                                    autoComplete='name'
                                                />
                                            </FormInputArea>
                                            <SubItensContainer>
                                                <Limitador>
                                                    <FormInputArea>
                                                        <FormInputLabel><FaAddressCard /> Descrição</FormInputLabel>
                                                        <FormInput
                                                            type='text'
                                                            name='description'
                                                            placeholder='Descrção da Tarefa'
                                                            autoComplete='name'
                                                        />
                                                    </FormInputArea>
                                                </Limitador>
                                                <FormInputArea>
                                                    <FormInputLabelRequired><FaCalendarAlt />Data da Tarefa</FormInputLabelRequired>
                                                    <StyledDatePicker
                                                        name='data'
                                                        setFieldValue={setFieldValue}
                                                        selected={values.data ? values.data : new Date()}
                                                    />
                                                </FormInputArea>
                                            </SubItensContainer>
                                            <ButtonGroup>
                                                <BackButton type="button" onClick={
                                                    () => {
                                                        closeEditTaskModal();
                                                    }
                                                }>
                                                    Cancelar</BackButton>
                                                <BackButton type="button" onClick={
                                                    () => {
                                                        openDeleteTaskModal();
                                                    }
                                                }>
                                                    Deletar
                                                </BackButton>
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
                    isOpen={modalDeleteTaskIsOpen}
                    onRequestClose={closeDeleteTaskModal}
                    style={ModalStyles}
                >
                    <DeleteContainer>
                        <IconWrapper>
                            <ImWarning />
                        </IconWrapper>
                        <DeleteTitle>Deseja excluir a tarefa {selectedTask.name}?</DeleteTitle>
                        <DeleteButtonContainer>
                            <BackButton onClick={() => {
                                closeDeleteTaskModal();
                            }}>
                                Cancelar
                            </BackButton>
                            {
                                !deleting && (
                                    <SubmitButton onClick={() => {
                                        setDeleting(true);
                                        deleteTask(user, selectedTask.id, setLoading, setDeleting);
                                    }}>
                                        Excluir
                                    </SubmitButton>
                                )
                            }

                            {
                                deleting && (
                                    <ThreeDots color={colors.icon} />
                                )
                            }
                        </DeleteButtonContainer>
                    </DeleteContainer>
                </Modal>
            </ColumnContainer>
        </Droppable>
    );
}

export default TaskColumn;