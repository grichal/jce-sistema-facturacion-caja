import React, { useEffect, useState } from 'react';
import ServiceTypesList from '../components/ServiceTypes/ServiceTypesList';
import ServiceTypeModal from '../components/ServiceTypes/ServiceTypeModal';
import { fetchServiceTypes } from '../services/serviceTypesApi';
import { ServiceType } from '../types';

const ServiceTypesPage: React.FC = () => {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadServiceTypes = async () => {
            const types = await fetchServiceTypes();
            setServiceTypes(types);
        };
        loadServiceTypes();
    }, []);

    const handleOpenModal = (serviceType?: ServiceType) => {
        setSelectedServiceType(serviceType || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedServiceType(null);
    };

    return (
        <div>
            <h1>Service Types</h1>
            <button onClick={() => handleOpenModal()}>Add Service Type</button>
            <ServiceTypesList serviceTypes={serviceTypes} onEdit={handleOpenModal} />
            <ServiceTypeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                serviceType={selectedServiceType}
                onRefresh={() => fetchServiceTypes().then(setServiceTypes)}
            />
        </div>
    );
};

export default ServiceTypesPage;