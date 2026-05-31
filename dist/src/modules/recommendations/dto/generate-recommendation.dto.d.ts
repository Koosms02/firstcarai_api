declare class GuestPreferencesDto {
    preferredBrand?: string;
    carType?: string;
    fuelType?: string;
    transmission?: string;
}
export declare class GenerateRecommendationDto {
    userId?: string;
    netSalary?: number;
    creditScore?: number;
    location?: string;
    idNumber?: string;
    preferences?: GuestPreferencesDto;
}
export {};
