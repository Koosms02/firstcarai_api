import { Controller, Get, Param, Query } from '@nestjs/common';
import { CarsService } from './cars.service';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  findAll(
    @Query('make') make?: string,
    @Query('fuelType') fuelType?: string,
    @Query('transmission') transmission?: string,
  ) {
    return this.carsService.findAll(make, fuelType, transmission);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carsService.findOne(id);
  }
}
