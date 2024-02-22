import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CITY_IDS } from 'src/common/constants/constants';
import { Fuel } from 'src/common/interfaces/fuel.interface';
import { STATION } from './opet.module';

@Injectable()
export class OpetService {
  constructor(private readonly httpService: HttpService) {}

  async getPrice(id: number): Promise<Fuel[]> {
    const url = STATION.stationUrl.replace('{ID}', String(id));
    const response = await this.httpService.axiosRef.get(url);

    // The response is an array so create array of Fuel objects
    const fuelArray: Fuel[] = response.data.map((item: any) => {
      const prices = item.prices;
      const fuel: Fuel = {
        cityName: CITY_IDS[id],
        districtName: item[STATION.districtNameKey],
        stationName: STATION.displayName,
        gasolinePrice: STATION.hasGasoline
          ? parseFloat(
              prices.find(
                (price: any) => price.productCode === STATION.gasolineKey,
              ).amount,
            )
          : null,
        dieselPrice: STATION.hasDiesel
          ? parseFloat(
              prices.find(
                (price: any) => price.productCode === STATION.dieselKey,
              ).amount,
            )
          : null,
        lpgPrice: STATION.hasLpg
          ? parseFloat(
              prices.find((price: any) => price.productCode === STATION.lpgKey)
                .amount,
            )
          : null,
      };

      return fuel;
    });

    return fuelArray;
  }
}