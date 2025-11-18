import React from 'react';
import { ServiceType } from '../../types';
import { useModal } from '../../hooks/useModal';
import ServiceTypeModal from './ServiceTypeModal';

interface ServiceTypeItemProps {
    serviceType: ServiceType;
    onEdit: (serviceType: ServiceType) => void;
}

const ServiceTypeItem: React.FC<ServiceTypeItemProps> = ({ serviceType, onEdit }) => {
    const { isOpen, openModal, closeModal } = useModal();

    const handleEditClick = () => {
        onEdit(serviceType);
        openModal();
    };

    return (
        <div className="service-type-item">
            <h3>{serviceType.name}</h3>
            <button onClick={handleEditClick}>Edit</button>
            <ServiceTypeModal isOpen={isOpen} onClose={closeModal} serviceType={serviceType} />
        </div>
    );
};

export default ServiceTypeItem;