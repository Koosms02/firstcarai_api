// Cars table removed in schema simplification — this controller is no longer used.
import { Controller } from '@nestjs/common';
import { CarsService } from './cars.service';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}
}
