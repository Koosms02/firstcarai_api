import { Body, Controller, Post } from '@nestjs/common';
import { AiAdvisorService } from './ai-advisor.service';
import { ChatAdvisorDto } from './dto/chat-advisor.dto';

@Controller('ai-advisor')
export class AiAdvisorController {
  constructor(private readonly service: AiAdvisorService) {}

  @Post('chat')
  chat(@Body() dto: ChatAdvisorDto) {
    return this.service.chat(dto);
  }
}
