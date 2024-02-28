import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { PrismaService } from 'prisma/prisma.service';
import { CITY_IDS } from 'src/common/constants/constants';
import { getDistrict } from 'src/common/constants/districts';
import { Fuel } from 'src/common/interfaces/fuel.interface';
import { STATION } from './sunpet.module';

@Injectable()
export class SunpetService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prismaService: PrismaService,
  ) {}

  async getPrice(id: number): Promise<Fuel[]> {
    const fuelArray: Fuel[] = [];

    const cityName = CITY_IDS[id]
      .toLocaleLowerCase('tr-TR')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .trim();

    const url = STATION.stationUrl.replace('{CITY_NAME}', cityName);
    let responses = [await this.httpService.axiosRef.get(url)];

    if (id === 34) {
      responses = [
        await this.httpService.axiosRef.get(
          STATION.stationUrl.replace('{CITY_NAME}', 'istanbul-anadolu'),
        ),
        await this.httpService.axiosRef.get(
          STATION.stationUrl.replace('{CITY_NAME}', 'istanbul-avrupa'),
        ),
      ];
    }

    responses.forEach((response) => {
      const fuels: Fuel[] = [];

      if (!response.data) {
        return [];
      }

      const $ = cheerio.load(response.data);

      const fuelTableRows = $(
        'body main div#fuel-prices-page section.fuel-prices-table-section div.container div.primary-table-wrapper table.primary-table tbody tr',
      );

      fuelTableRows.each((index, element) => {
        const cells = $(element).find('td');

        const districtName = $(cells[STATION.districtNameKey]).text().trim();

        const normalisedDistrictName = getDistrict(id, districtName);

        if (!normalisedDistrictName) return;

        const gasolinePrice = STATION.hasGasoline
          ? $(cells[STATION.gasolineKey]).text().trim().replace(',', '.')
          : null;
        const dieselPrice = STATION.hasDiesel
          ? $(cells[STATION.dieselKey]).text().trim().replace(',', '.')
          : null;
        const lpgPrice = STATION.hasLpg
          ? $(cells[STATION.lpgKey]).text().trim().replace(',', '.')
          : null;

        const fuel: Fuel = {
          cityName: CITY_IDS[id],
          districtName: normalisedDistrictName,
          stationName: STATION.displayName,
          gasolinePrice: gasolinePrice ? parseFloat(gasolinePrice) : null,
          dieselPrice: dieselPrice ? parseFloat(dieselPrice) : null,
          lpgPrice: lpgPrice ? parseFloat(lpgPrice) : null,
        };

        fuels.push(fuel);
      });

      fuelArray.push(...fuels);
    });

    return fuelArray;
  }

  async migrate(): Promise<void> {
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
      const fuels = await this.getPrice(key);

      if (!fuels || fuels.length === 0) {
        continue;
      }

      for (const item of fuels) {
        if (!item) continue;
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
              districtName: item.districtName ? item.districtName : '',
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
