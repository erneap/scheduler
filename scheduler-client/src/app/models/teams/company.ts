export interface ICompanyHoliday {
  id: string;
  name: string;
  sort: number;
  actualdates?: Date[];
}

export class CompanyHoliday implements ICompanyHoliday {
  id: string;
  name: string;
  sort: number;
  actualdates: Date[];

  constructor(hol: ICompanyHoliday) {
    this.id = (hol) ? hol.id : '';
    this.name = (hol) ? hol.name : '';
    this.sort = (hol) ? hol.sort : 0;
    this.actualdates = [];
    if (hol && hol.actualdates && hol.actualdates.length > 0) {
      hol.actualdates.forEach(dt => {
        this.actualdates?.push(new Date(dt));
      });
      this.actualdates.sort((a,b) => {
        return (a.getTime() < b.getTime()) ? -1 : 1;
      })
    }
  }

  compareTo(other?: CompanyHoliday): number {
    if (other) {
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }

  getActual(year: number): Date | undefined {
    let answer: Date | undefined;
    if (this.actualdates) {
      this.actualdates.forEach(dt => {
        if (dt.getFullYear() === year) {
          answer = dt;
        }
      });
    }
    return answer;
  }
}

export interface ICompany {
  id: string;
  name: string;
  ingest: string;
  ingestPwd: string;
  holidays?: ICompanyHoliday[];
}

export class Company implements ICompany {
  id: string;
  name: string;
  ingest: string;
  ingestPwd: string;
  holidays: CompanyHoliday[];

  constructor(com?: ICompany) {
    this.id = (com) ? com.id : '';
    this.name = (com) ? com.name : '';
    this.ingest = (com) ? com.ingest : '';
    this.ingestPwd = (com) ? com.ingestPwd : '';
    this.holidays = [];
    if (com && com.holidays && com.holidays.length > 0) {
      com.holidays.forEach(hol => {
        this.holidays.push(new CompanyHoliday(hol));
      });
      this.holidays.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: Company): number {
    if (other) {
      return (this.name < other.name) ? -1 : 1;
    }
    return -1;
  }
}