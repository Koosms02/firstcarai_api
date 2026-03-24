export class CreateUserDto {
  email: string;
  netSalary: number;
  creditScore: number;
  yearsLicensed?: number;
  gender?: string;
  location?: string;
}
