import { Component } from '@angular/core';
import { Workcenter } from 'src/app/models/sites/workcenter';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-site-availability-month',
  templateUrl: './site-availability-month.component.html',
  styleUrls: ['./site-availability-month.component.scss']
})
export class SiteAvailabilityMonthComponent {
  months: string[] = new Array("January", "Febuary", "March", "April", "May",
  "June", "July", "August", "September", "October", "November", "December");

  weekdays: string[] = new Array("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa");

  month: Date;
  monthLabel: string = '';
  daysInMonth: number = 30;
  wkctrStyle: string = "width: 1700px;";
  monthStyle: string = "width: 1300px;";
  dates: Date[] = [];
  workcenters: Workcenter[] = [];

  constructor(
    protected siteService: SiteService
  ) {
    const now = new Date();
    this.month = new Date(now.getFullYear(), now.getMonth(), 1);
    this.setStyles();
  }

  setStyles() {
    let nextMonth = new Date(this.month.getFullYear(), this.month.getMonth() + 1, 1);
    nextMonth = new Date(nextMonth.getTime() - (24 * 3600000));
    this.daysInMonth = nextMonth.getDate();
    let width = ((27 * this.daysInMonth) + 202) - 2;
    let monthWidth = width - 408;
    this.wkctrStyle = `width: ${width}px;`;
    this.monthStyle = `width: ${monthWidth}px;`;
    this.monthLabel = `${this.months[this.month.getMonth()]} ${this.month.getFullYear()}`;
    this.dates = [];
    let start = new Date(Date.UTC(this.month.getFullYear(), 
      this.month.getMonth(), 1));
    while (start.getMonth() === this.month.getMonth()) {
      this.dates.push(new Date(start));
      start = new Date(start.getTime() + (24 * 3600000));
    }
    this.workcenters = [];
    const site = this.siteService.getSite();
    if (site && site.workcenters && site.workcenters.length > 0) {
      site.workcenters.forEach(wk => {
        if (wk.shifts && wk.shifts.length > 0) {
          this.workcenters.push(new Workcenter(wk));
        }
      });
    }
  }

  getDateSyyle(dt: Date): string {
    if (dt.getDay() === 0 || dt.getDay() === 6) {
      return 'background-color: cyan;color: black;';
    }
    return 'background-color: white;color: black;';
  }

  changeMonth(direction: string, period: string) {
    if (direction.substring(0,1).toLowerCase() === 'u') {
      if (period.substring(0,1).toLowerCase() === 'm') {
        this.month = new Date(this.month.getFullYear(), 
          this.month.getMonth() + 1, 1);
      } else {
        this.month = new Date(this.month.getFullYear() + 1,
          this.month.getMonth(), 1)
      }
    } else {
      if (period.substring(0,1).toLowerCase() === 'm') {
        this.month = new Date(this.month.getFullYear(), 
          this.month.getMonth() - 1, 1);
      } else {
        this.month = new Date(this.month.getFullYear() - 1,
          this.month.getMonth(), 1)
      }
    }
    this.setStyles();
  }
}
