import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { Workcode } from 'src/app/models/teams/workcode';
import { IngestManualChange } from 'src/app/models/web/internalWeb';

@Component({
  selector: 'app-site-ingest-month-employee-day',
  templateUrl: './site-ingest-month-employee-day.component.html',
  styleUrls: ['./site-ingest-month-employee-day.component.scss']
})
export class SiteIngestMonthEmployeeDayComponent {
  private _employee: Employee = new Employee();
  private _date: Date = new Date();
  private _ingestType: string = 'manual';
  @Input() 
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setInputValue();
  }
  get employee(): Employee {
    return this._employee;
  }
  @Input()
  public set date(idate: Date) {
    this._date = new Date(idate);
    this.setInputValue();
  }
  get date(): Date {
    return this._date;
  }
  @Input()
  public set ingestType(iType: string) {
    this._ingestType = iType;
  }
  get ingestType(): string {
    return this._ingestType;
  }
  @Input() leavecodes: Workcode[] = [];
  @Output() changed = new EventEmitter<IngestManualChange>();
  dayForm: FormGroup

  constructor(
    private fb: FormBuilder
  ) {
    this.dayForm = this.fb.group({
      changevalue: ['', [Validators.required]],
    })
  }

  setInputValue() {
    this.dayForm.controls["changevalue"].setValue(
      this.employee.getIngestValue(this.date));
  }

  getDisplayValue(): string {
    return this.employee.getIngestValue(this.date);
  }

  onChange() {
    const numRe = new RegExp("^[0-9]{1,2}(\.[0-9])?$");
    const value = this.dayForm.value.changevalue;
    if (numRe.test(value)) {
      this.changed.emit(new IngestManualChange(this.employee.id, this.date, value));
    } else if (value.trim() === '') {
      this.changed.emit(new IngestManualChange(this.employee.id, this.date, '0'));
    } else {
      let found = false;
      this.leavecodes.forEach(wc => {
        if (wc.id === value) {
          found = true;
        }
      });
      if (found) {
        this.changed.emit(new IngestManualChange(this.employee.id, this.date, value));
      } else {
        alert("Illegal value:  It must be a number or one of the leave codes");
      }
    }
  }
}
