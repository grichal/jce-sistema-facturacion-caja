import axios from 'axios';
import { ServiceType, APIResponse } from '../types';

const API_URL = 'https://api.example.com/service-types';

export const fetchServiceTypes = async (): Promise<APIResponse<ServiceType[]>> => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createServiceType = async (serviceType: ServiceType): Promise<APIResponse<ServiceType>> => {
    const response = await axios.post(API_URL, serviceType);
    return response.data;
};

export const updateServiceType = async (id: string, serviceType: ServiceType): Promise<APIResponse<ServiceType>> => {
    const response = await axios.put(`${API_URL}/${id}`, serviceType);
    return response.data;
};

export const deleteServiceType = async (id: string): Promise<APIResponse<void>> => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};