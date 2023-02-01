import { Employee, IEmployee } from "../employees/employee";
import { ForecastReport, IForecastReport } from "./forecastreport";
import { ILaborCode, LaborCode } from "./laborcode";
import { IWorkcenter, Workcenter } from "./workcenter";

export interface ISite {
  id: string;
  name: string;
  workcenters?: IWorkcenter[];
  laborCodes?: ILaborCode[];
  forecasts?: IForecastReport[];
  employees?: IEmployee[];
}

export class Site implements ISite {
  id: string;
  name: string;
  workcenters?: Workcenter[];
  laborCodes?: LaborCode[];
  forecasts?: ForecastReport[];
  employees?: Employee[];

  constructor(site?: ISite) {
    this.id = (site) ? site.id : '';
    this.name = (site) ? site.name : '';
    this.workcenters = [];
    if (site && site.workcenters && site.workcenters.length > 0) {
      site.workcenters.forEach(wc => {
        this.workcenters?.push(new Workcenter(wc));
      });
      this.workcenters.sort((a,b) => a.compareTo(b))
    }
    this.laborCodes = [];
    if (site && site.laborCodes && site.laborCodes.length > 0) {
      site.laborCodes.forEach(lc => {
        this.laborCodes?.push(new LaborCode(lc));
      });
      this.laborCodes.sort((a,b) => a.compareTo(b));
    }
    this.forecasts = [];
    if (site && site.forecasts && site.forecasts.length > 0) {
      site.forecasts.forEach(fc => {
        this.forecasts?.push(new ForecastReport(fc));
      });
      this.forecasts.sort((a,b) => a.compareTo(b))
    }
    this.employees = [];
    if (site && site.employees && site.employees.length > 0) {
      site.employees.forEach(emp => {
        this.employees?.push(new Employee(emp));
      });
      this.employees.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: Site): number {
    if (other) {
      if (this.name === other.name) {
        return (this.id < other.id) ? -1 : 1;
      }
      return (this.name < other.name) ? -1 : 1;
    }
    return -1;
  }
}