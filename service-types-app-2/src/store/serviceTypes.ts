import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ServiceType } from '../types';

interface ServiceTypesState {
    serviceTypes: ServiceType[];
    loading: boolean;
    error: string | null;
}

const initialState: ServiceTypesState = {
    serviceTypes: [],
    loading: false,
    error: null,
};

const serviceTypesSlice = createSlice({
    name: 'serviceTypes',
    initialState,
    reducers: {
        fetchServiceTypesStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchServiceTypesSuccess(state, action: PayloadAction<ServiceType[]>) {
            state.loading = false;
            state.serviceTypes = action.payload;
        },
        fetchServiceTypesFailure(state, action: PayloadAction<string>) {
            state.loading = false;
            state.error = action.payload;
        },
        addServiceType(state, action: PayloadAction<ServiceType>) {
            state.serviceTypes.push(action.payload);
        },
        updateServiceType(state, action: PayloadAction<ServiceType>) {
            const index = state.serviceTypes.findIndex(serviceType => serviceType.id === action.payload.id);
            if (index !== -1) {
                state.serviceTypes[index] = action.payload;
            }
        },
        deleteServiceType(state, action: PayloadAction<number>) {
            state.serviceTypes = state.serviceTypes.filter(serviceType => serviceType.id !== action.payload);
        },
    },
});

export const {
    fetchServiceTypesStart,
    fetchServiceTypesSuccess,
    fetchServiceTypesFailure,
    addServiceType,
    updateServiceType,
    deleteServiceType,
} = serviceTypesSlice.actions;

export default serviceTypesSlice.reducer;