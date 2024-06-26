import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OpetController } from './opet.controller';
import { OpetSchedulerService } from './opet.scheduler';
import { OpetService } from './opet.service';

@Module({
  imports: [HttpModule],
  controllers: [OpetController],
  providers: [OpetService, OpetSchedulerService, PrismaService],
  exports: [OpetService],
})
export class OpetModule {
  constructor(private readonly opetService: OpetService) {}
}
