import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import { CITY_IDS } from 'src/common/constants/constants';
import { Fuel } from 'src/common/interfaces/fuel.interface';
import { STATION } from './alpet.module';
@Injectable()
export class AlpetService {
  constructor(private readonly httpService: HttpService) {}

  async getPrice(id: number): Promise<Fuel[]> {
    const fuelArray: Fuel[] = [];
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const cityName = id === 934 || id === 34 ? 'İSTANBUL' : CITY_IDS[id];

    await page.goto(STATION.stationUrl.replace('{CITY_NAME}', cityName));
    const content = await page.content();
    await browser.close();

    const $ = cheerio.load(content);

    const fuelTableRows = $(
      'body main div.pageContent div.container div.row div.col-lg-12 div.box div.table-responsive table.table tbody tr',
    );

    fuelTableRows.each((index, element) => {
      const cells = $(element).find('td');

      const districtName = $(cells[STATION.districtNameKey]).text().trim();
      const gasolinePrice = STATION.hasGasoline
        ? $(cells[STATION.gasolineKey])
            .text()
            .replace(',', '.')
            .split(' ')[0]
            .trim()
        : null;
      const dieselPrice = STATION.hasDiesel
        ? $(cells[STATION.dieselKey])
            .text()
            .replace(',', '.')
            .split(' ')[0]
            .trim()
        : null;
      const lpgPrice = STATION.hasLpg
        ? $(cells[4]).text().replace(',', '.').split(' ')[0].trim()
        : null;

      const fuel: Fuel = {
        cityName: CITY_IDS[id],
        districtName: districtName,
        stationName: STATION.displayName,
        gasolinePrice: gasolinePrice ? parseFloat(gasolinePrice) : null,
        dieselPrice: dieselPrice ? parseFloat(dieselPrice) : null,
        lpgPrice: lpgPrice ? parseFloat(lpgPrice) : null,
      };
      fuelArray.push(fuel);
    });
    return fuelArray;
  }
}