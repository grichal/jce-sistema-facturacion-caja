import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/serviceTypes';
import ServiceTypeItem from './ServiceTypeItem';
import ServiceTypeModal from './ServiceTypeModal';
import useModal from '../../hooks/useModal';

const ServiceTypesList: React.FC = () => {
    const serviceTypes = useSelector((state: RootState) => state.serviceTypes.list);
    const { isOpen, openModal, closeModal } = useModal();

    return (
        <div>
            <h2>Service Types</h2>
            <button onClick={openModal}>Add Service Type</button>
            <ul>
                {serviceTypes.map(serviceType => (
                    <ServiceTypeItem key={serviceType.id} serviceType={serviceType} onEdit={openModal} />
                ))}
            </ul>
            <ServiceTypeModal isOpen={isOpen} onClose={closeModal} />
        </div>
    );
};

export default ServiceTypesList;