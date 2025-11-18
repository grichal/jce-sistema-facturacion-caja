export interface ServiceType {
    id: number;
    name: string;
    description?: string;
}

export interface APIResponse<T> {
    data: T;
    message: string;
    success: boolean;
}