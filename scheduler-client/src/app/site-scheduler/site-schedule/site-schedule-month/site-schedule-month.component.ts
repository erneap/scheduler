import { Component } from '@angular/core';
import { Workcenter } from 'src/app/models/sites/workcenter';
import { DialogService } from 'src/app/services/dialog-service.service';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-site-schedule-month',
  templateUrl: './site-schedule-month.component.html',
  styleUrls: ['./site-schedule-month.component.scss']
})
export class SiteScheduleMonthComponent {
  months: string[] = new Array("January", "Febuary", "March", "April", "May",
    "June", "July", "August", "September", "October", "November", "December");

  weekdays: string[] = new Array("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa");

  month: Date;
  monthLabel: string = '';
  daysInMonth: number = 30;
  wkctrStyle: string = "width: 1700px;";
  monthStyle: string = "width: 1300px;";
  workcenters: Workcenter[] = [];
  dates: Date[] = [];

  constructor(
    protected siteService: SiteService,
    protected dialogService: DialogService
  ) {
    const now = new Date();
    this.month = new Date(now.getFullYear(), now.getMonth(), 1);
    this.setStyles();
    this.setWorkcenters();
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
  }

  setWorkcenters() {
    this.dialogService.showSpinner();
    this.workcenters = [];
    const wkctrMap = new Map<string, number>();
    const site = this.siteService.getSite();
    if (site && site.workcenters && site.workcenters.length > 0) {
      site.workcenters.forEach(wc => {
        this.workcenters.push(new Workcenter(wc));
      });
      if (site.employees && site.employees.length > 0) {
        site.employees.forEach(emp => {
          // figure workcenter to include this employee, based on workcenter
          // individual works the most
          wkctrMap.clear();
          let start = new Date(Date.UTC(this.month.getFullYear(), 
            this.month.getMonth(), 1));
          this.dates.forEach(dt => {
            const wd = emp.data.getWorkday(site.id, dt);
            if (wd.workcenter !== '') {
              let cnt = wkctrMap.get(wd.workcenter);
              if (cnt) {
                cnt++;
                wkctrMap.set(wd.workcenter, cnt);
              } else {
                cnt = 1;
                wkctrMap.set(wd.workcenter, cnt);
              }
            }
          }); 
          let wkctr = '';
          let count = 0;
          for (let key of wkctrMap.keys()) {
            let cnt = wkctrMap.get(key);
            if (cnt) {
              if (cnt > count) {
                count = cnt;
                wkctr = key;
              }
            }
          }
          this.workcenters.forEach(wk => {
            if (wk.id.toLowerCase() === wkctr.toLowerCase()) {
              wk.addEmployee(emp, site.showMids, this.month);
            }
          });
        });
      }
    }
    this.dialogService.closeSpinner();
  }

  showShift(shiftID: string): boolean {
    const site = this.siteService.getSite();
    if (site) {
      return ((shiftID.toLowerCase() === 'mids' && site.showMids) 
        || shiftID.toLowerCase() !== 'mids');
    }
    return true;
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
    this.setWorkcenters();
  }
}
