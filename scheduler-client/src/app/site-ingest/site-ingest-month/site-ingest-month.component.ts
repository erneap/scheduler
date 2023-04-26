import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { Workcode } from 'src/app/models/teams/workcode';
import { IngestManualChange } from 'src/app/models/web/internalWeb';

@Component({
  selector: 'app-site-ingest-month',
  templateUrl: './site-ingest-month.component.html',
  styleUrls: ['./site-ingest-month.component.scss']
})
export class SiteIngestMonthComponent {
  private _employees: Employee[] = [];
  @Input()
  public set employees(emps: IEmployee[]) {
    this._employees = [];
    emps.forEach(emp => {
      this._employees.push(new Employee(emp));
    });
    this.changeMonth('set');
  }
  get employees(): Employee[] {
    return this._employees;
  }
  @Input() leavecodes: Workcode[] = [];
  @Input() ingestType: string = 'manual';
  @Output() changed = new EventEmitter<IngestManualChange>();
  month: Date;
  dateLabel: string = '';
  showList: Employee[] = [];
  showApprove: boolean = false;
  
  dates: Date[] = [];

  constructor() {
    const now = new Date();
    this.month = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    this.changeMonth('set');
  }

  changeMonth(direction: string) {
    const months: string[] = [ "January", "Febuary", "March", "April", "May",
      "June", "July", "August", "September", "October", "November", "December"];
    if (direction.toLowerCase() === 'down') {
      this.month = new Date(Date.UTC(this.month.getFullYear(), 
        this.month.getMonth() - 1, 1))
    } else if (direction.toLowerCase() === 'up') {
      this.month = new Date(Date.UTC(this.month.getFullYear(), 
        this.month.getMonth() + 1, 1))
    }

    this.dateLabel = `${months[this.month.getMonth()]} ${this.month.getFullYear()}`;
    this.showList = [];
    this.employees.forEach(emp => {
      if (emp.activeOnDate(this.month)) {
        this.showList.push(new Employee(emp));
      }
    });
    this.setDates();
  }

  setDates() {
    this.dates = [];
    let start = new Date(Date.UTC(this.month.getFullYear(), 
      this.month.getMonth(), 1))
    while (start.getMonth() === this.month.getMonth()) {
      this.dates.push(start);
      start = new Date(start.getTime() + (24 * 3600000));
    }
  }

  getMonthWidthStyle(): string {
    let totalwidth = (this.dates.length * 37) + 202 + 102;
    let monthWidth = totalwidth - 204;
    return `width: ${monthWidth}px;`;
  }

  onChange(change: IngestManualChange) {
    this.showApprove = true;
    this.changed.emit(change);
  }

  onApprove() {
    this.showApprove = false;
    this.changed.emit(new IngestManualChange('', this.month, 'approved'));
  }
}
