import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get()
  find(@Query('userId') userId?: string) {
    return userId ? this.documentsService.findByUser(userId) : this.documentsService.findAll();
  }
}
