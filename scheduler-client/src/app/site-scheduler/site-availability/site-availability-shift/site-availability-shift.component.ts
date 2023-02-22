import { Component, Input } from '@angular/core';
import { IShift, Shift } from 'src/app/models/sites/workcenter';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-site-availability-shift',
  templateUrl: './site-availability-shift.component.html',
  styleUrls: ['./site-availability-shift.component.scss']
})
export class SiteAvailabilityShiftComponent {
  private _workcenter: string = ''
  private _shift: Shift = new Shift();
  private _date: Date = new Date();
  @Input()
  public set workcenter(wkc: string) {
    this._workcenter = wkc;
  }
  get workcenter(): string {
    return this._workcenter;
  }
  @Input()
  public set shift(id: IShift) {
    this._shift = new Shift(id);
  }
  get shift(): Shift {
    return this._shift;
  }
  @Input()
  public set month(dt: Date) {
    this._date = new Date(dt);
    this.setDates();
  }
  get month(): Date {
    return this._date;
  }
  dates: Date[] = [];

  constructor(
  ) {}

  setDates() {
    this.dates = [];
    let start = new Date(this.month);
    while (start.getMonth() === this.month.getMonth()) {
      this.dates.push(new Date(start));
      start = new Date(start.getTime() + (24 * 3600000));
    }
  }
}
