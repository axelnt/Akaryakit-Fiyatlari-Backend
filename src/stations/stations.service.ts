import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllStations() {
    const stations = await this.prismaService.station.findMany({
      select: {
        id: true,
        displayName: true,
        active: true,
        hasGasoline: true,
        hasDiesel: true,
        hasLpg: true,
      },
    });
    if (!stations) {
      return {
        status: 'error',
        message: 'No station found',
        data: null,
      };
    }

    return {
      status: 'success',
      data: stations,
      message: null,
    };
  }
}
