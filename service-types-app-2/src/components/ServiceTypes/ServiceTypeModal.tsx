import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ServiceType } from '../../types';
import { createServiceType, updateServiceType } from '../../services/serviceTypesApi';

interface ServiceTypeModalProps {
  show: boolean;
  onHide: () => void;
  serviceType?: ServiceType;
  onServiceTypeUpdated: () => void;
}

const ServiceTypeModal: React.FC<ServiceTypeModalProps> = ({ show, onHide, serviceType, onServiceTypeUpdated }) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (serviceType) {
      setName(serviceType.name);
      setDescription(serviceType.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [serviceType]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (serviceType) {
      await updateServiceType({ ...serviceType, name, description });
    } else {
      await createServiceType({ name, description });
    }
    onServiceTypeUpdated();
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{serviceType ? 'Edit Service Type' : 'Create Service Type'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formServiceTypeName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter service type name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group controlId="formServiceTypeDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter service type description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            {serviceType ? 'Update' : 'Create'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ServiceTypeModal;