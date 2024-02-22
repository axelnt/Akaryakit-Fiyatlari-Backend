import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { config } from 'dotenv';
import { PrismaService } from 'prisma/prisma.service';
import { CITY_IDS } from 'src/common/constants/constants';
import { STATION } from './tp.module';
import { TpService } from './tp.service';

config();

@Injectable()
export class TpSchedulerService {
  constructor(
    private readonly tpService: TpService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  private readonly logger = new Logger(TpSchedulerService.name);

  @Cron(process.env.CRON_UPDATE_INTERVAL)
  async handleCron() {
    this.logger.debug('Updating TP prices');

    // Get the station
    const station = await this.prismaService.station.findUnique({
      where: {
        displayName: STATION.displayName,
      },
    });

    if (!station) {
      return;
    }

    const keysArray = Object.keys(CITY_IDS);
    const keysAsNumbers: number[] = keysArray.map(Number);

    for (const key of keysAsNumbers) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.logger.debug(`Checking ${key}`);
      const fuels = await this.tpService.getPrice(key);
      this.logger.debug(fuels);

      if (!fuels || fuels.length === 0) {
        continue;
      }

      for (const item of fuels) {
        const fuelInDb = await this.prismaService.fuel.findFirst({
          where: {
            stationId: station.id,
            cityId: key,
            districtName: item.districtName,
          },
        });
        if (fuelInDb) {
          await this.prismaService.fuel.update({
            where: {
              id: fuelInDb.id,
            },
            data: {
              gasolinePrice: item.gasolinePrice ? item.gasolinePrice : 0,
              dieselPrice: item.dieselPrice ? item.dieselPrice : 0,
              lpgPrice: item.lpgPrice ? item.lpgPrice : 0,
            },
          });
        } else {
          await this.prismaService.fuel.create({
            data: {
              cityId: key,
              districtName: item.districtName,
              gasolinePrice: item.gasolinePrice ? item.gasolinePrice : 0,
              dieselPrice: item.dieselPrice ? item.dieselPrice : 0,
              lpgPrice: item.lpgPrice ? item.lpgPrice : 0,
              station: {
                connect: {
                  id: station.id,
                },
              },
            },
          });
        }
      }
    }
  }
}