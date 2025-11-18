import { useState } from 'react';

const useModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const openModal = (data = null) => {
        setModalData(data);
        setIsOpen(true);
    };

    const closeModal = () => {
        setModalData(null);
        setIsOpen(false);
    };

    return {
        isOpen,
        modalData,
        openModal,
        closeModal,
    };
};

export default useModal;