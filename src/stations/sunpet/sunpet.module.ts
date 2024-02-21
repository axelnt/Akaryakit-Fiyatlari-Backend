import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { Station } from 'src/common/interfaces/station.interface';
import { SunpetController } from './sunpet.controller';
import { SunpetSchedulerService } from './sunpet.scheduler';
import { SunpetService } from './sunpet.service';
import { PrismaService } from 'prisma/prisma.service';

export const STATION: Station = {
  displayName: 'Sunpet',
  id: 5,
  hasDiesel: true,
  hasGasoline: true,
  hasLpg: false,
  stationUrl: 'https://www.sunpettr.com.tr/yakit-fiyatlari-{CITY_NAME}',
  cityNameKey: null,
  districtNameKey: 0,
  gasolineKey: 2,
  dieselKey: 3,
  lpgKey: null,
};

@Module({
  imports: [HttpModule],
  controllers: [SunpetController],
  providers: [SunpetService, SunpetSchedulerService, PrismaService],
  exports: [SunpetService],
})
export class SunpetModule {}
