import { LaborCode } from "./laborcode";

export interface IForecastPeriod {
  month: Date;
  periods?: Date[];
}

export class ForecastPeriod implements IForecastPeriod {
  month: Date;
  periods?: Date[];

  constructor(per?: IForecastPeriod) {
    this.month = (per) ? new Date(per.month) : new Date();
    this.periods = [];
    if (per && per.periods && per.periods.length > 0) {
      per.periods.forEach(pd => {
        this.periods?.push(new Date(pd))
      });
      this.periods.sort((a,b) => (a.getTime() < b.getTime()) ? -1 : 1);
    }
  }

  compareTo(other?: ForecastPeriod): number {
    if (other) {
      return (this.month.getTime() < other.month.getTime()) ? -1 : 1;
    }
    return -1;
  }
}

export interface IForecastReport {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  periods?: ForecastPeriod[];
  laborCodes?: LaborCode[];
}