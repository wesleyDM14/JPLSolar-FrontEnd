import Modal from 'react-modal';
import Pagination from '../../components/Pagination';
import { useMemo, useState } from 'react';
import { colors, ModalStyles } from '../../utils/GlobalStyles';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { ThreeDots } from "react-loader-spinner";
import { FormInput } from '../../components/FormLib';
import {
    IconSolarPlantContainer,
    SingleSolarPlant,
    SolarPlantListContainer,
} from './styles';
import { FaSolarPanel } from 'react-icons/fa';

const SolarPlantList = ({ solarPlants, navigate, search, page, setPage, itensPerPage, setLoading, user }) => {
    Modal.setAppElement(document.getElementById('root'));

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
                        <SingleSolarPlant key={solarPlant.id}>
                            <IconSolarPlantContainer>
                                <FaSolarPanel />
                            </IconSolarPlantContainer>
                        </SingleSolarPlant>
                    ))
                }
            </SolarPlantListContainer>
            <Pagination currentPage={page} setPage={setPage} totalPages={totalPages} />
        </>

    );
}

export default SolarPlantList;