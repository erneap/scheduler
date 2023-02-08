import { Component, Input } from '@angular/core';
import { ILeaveDay, LeaveDay } from 'src/app/models/employees/leave';
import { CompanyHoliday, ICompanyHoliday } from 'src/app/models/teams/company';

@Component({
  selector: 'app-pto-holiday-cell',
  templateUrl: './holiday-cell.component.html',
  styleUrls: ['./holiday-cell.component.scss']
})
export class HolidayCellComponent {
  private _holiday: CompanyHoliday = new CompanyHoliday(); 
  private _year: number = (new Date()).getFullYear();
  @Input()
  public set holiday(hol: CompanyHoliday ) {
    this._holiday = hol;
    this.setReferenceDate();
  }
  get holiday(): CompanyHoliday {
    return this._holiday;
  }
  @Input()
  public set dates(hdates: ILeaveDay[]) {
    hdates.forEach(hdt => {
      this._holiday.addLeaveDay(hdt);
    });
  }
  get date(): LeaveDay[] {
    return this._holiday.leaveDays;
  }
  @Input() 
  public set activecell(active: boolean) {
    this._holiday.active = active;
    if (active) {
      this.cellBackground = 'background-color: #FFFFFF;';
    } else {
      this.cellBackground = 'background-color: #808080;'
    }
  }
  get activecell(): boolean {
    return this._holiday.active;
  }
  @Input()
  public set year(yr: number) {
    this._year = yr;
    this.setReferenceDate();
  }
  get year(): number {
    return this._year;
  }
  cellBackground: string = "background-color: #FFFFFF;"
  referenceDate: string = '';

  constructor() {}

  getTotalActual(): string {
    let total: number = 0.0;
    this._holiday.leaveDays.forEach(dt => {
      if (dt.status.toLowerCase() === 'actual') {
        total += dt.hours;
      }
    });
    return total.toFixed(1);
  }

  getTotalScheduled(): string {
    let total: number = 0.0;
    this.holiday.leaveDays.forEach(dt => {
      if (dt.status.toLowerCase() !== 'actual') {
        total += dt.hours;
      }
    });
    return total.toFixed(1);
  }

  setReferenceDate() {
    const months: string[] = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    this.holiday.actualdates.forEach(dt => {
      if (dt.getFullYear() === this.year) {
        this.referenceDate = `${dt.getDate()} ${months[dt.getMonth()]}`;
      }
    })
  }
}
