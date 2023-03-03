import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Schedule, Variation } from 'src/app/models/employees/assignments';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { ChangeAssignmentRequest, EmployeeResponse } from 'src/app/models/web/employeeWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-site-employee-variation',
  templateUrl: './site-employee-variation.component.html',
  styleUrls: ['./site-employee-variation.component.scss']
})
export class SiteEmployeeVariationComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setVariationLists();
  }
  get employee(): Employee {
    return this._employee;
  }
  @Output() changed = new EventEmitter<Employee>();

  variations: Variation[] = [];
  variation: Variation;
  variationForm: FormGroup;

  constructor(
    protected authService: AuthService,
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected dialogService: DialogService,
    private fb: FormBuilder
  ) {
    this.variation = new Variation();
    this.variation.schedule.setScheduleDays(7);
    this.variationForm = this.fb.group({
      variation: '0',
      start: [new Date(), [Validators.required]],
      end: [new Date(), [Validators.required]],
      mids: false,
    });
  }

  setVariationLists() {
    const now = new Date();
    const site = this.siteService.getSite();
    let siteid = '';
    if (site) {
      siteid = site.id;
    }
    this.variations = [];
    let count = 0;
    this.employee.data.variations.forEach(v => {
      const vari = new Variation(v);
      if (vari.enddate.getTime() >= now.getTime() 
        && vari.site.toLowerCase() === siteid.toLowerCase()) {
        this.variations.push(vari)
      }
    });
    this.variations.sort((a,b) => a.compareTo(b));
  }

  dateString(date: Date): string {
    const months: string[] = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
    return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  getLabel(vari: Variation) {
    let answer = '';
    if (vari.mids) {
      answer += '(MIDS) ';
    } else {
      answer += '(OTHER) ';
    }
    answer += `${this.dateString(vari.startdate)}-${this.dateString(vari.enddate)}`;
    return answer;
  }

  selectVariation() {
    
    const variID = Number(this.variationForm.value.variation);
    if (variID > 0) {
      this.employee.data.variations.forEach(vari => {
        if (vari.id === variID) {
          this.variation = new Variation(vari);
        }
      });
    } else {
      this.variation = new Variation();
      this.variation.schedule.setScheduleDays(7);
    }
    this.setVariation();
  }

  setVariation() {
    this.variationForm.controls['start'].setValue(this.variation.startdate);
    this.variationForm.controls['end'].setValue(this.variation.enddate);
    this.variationForm.controls['mids'].setValue(this.variation.mids);
  }
  
  updateSchedule(data: string) {
    if (typeof(data) === 'string') {
      const chgParts = data.split("|");
      const change: ChangeAssignmentRequest = {
        employee: this.employee.id,
        asgmt: this.variation.id,
        schedule: 0,
        field: chgParts[3],
        value: chgParts[4],
      }
      if (chgParts[0].toLowerCase() === 'schedule') {
        this.authService.statusMessage = `Updating Employee Assignment -`
          + `Schedule Days`;
        this.dialogService.showSpinner();
        this.empService.updateAssignmentSchedule(change)
          .subscribe({
            next: resp => {
              this.dialogService.closeSpinner();
              if (resp.headers.get('token') !== null) {
                this.authService.setToken(resp.headers.get('token') as string);
              }
              const data: EmployeeResponse | null = resp.body;
              if (data && data !== null) {
                if (data.employee) {
                  this.employee = new Employee(data.employee);
                  this.employee.data.variations.forEach(agmt => {
                    if (agmt.id === this.variation.id) {
                      this.variation = new Variation(agmt);
                      this.setVariation();
                    }
                  });
                }
                const emp = this.empService.getEmployee();
                if (data.employee && emp && emp.id === data.employee.id) {
                  this.empService.setEmployee(data.employee);
                }
                const site = this.siteService.getSite();
                if (site && site.employees && site.employees.length && data.employee) {
                  let found = false;
                  for (let i=0; i < site.employees.length && !found; i++) {
                    if (site.employees[i].id === data.employee.id) {
                      site.employees[i] = new Employee(data.employee);
                      found = true;
                    }
                  }
                  if (!found) {
                    site.employees.push(new Employee(data.employee));
                  }
                  site.employees.sort((a,b) => a.compareTo(b));
                  this.siteService.setSite(site);
                  this.siteService.setSelectedEmployee(data.employee);
                }
              }
              this.changed.emit(new Employee(this.employee));
              this.authService.statusMessage = "Update complete";
            },
            error: err => {
              this.dialogService.closeSpinner();
              this.authService.statusMessage = err.error.exception;
            }
          });
      } else {
        change.workday = Number(chgParts[2]);
        this.dialogService.showSpinner();
        this.authService.statusMessage = `Updating Employee Assignment -`
          + `Schedule Days`;
        this.empService.updateAssignmentWorkday(change)
          .subscribe({
            next: resp => {
              this.dialogService.closeSpinner();
              if (resp.headers.get('token') !== null) {
                this.authService.setToken(resp.headers.get('token') as string);
              }
              const data: EmployeeResponse | null = resp.body;
              if (data && data !== null) {
                if (data.employee) {
                  this.employee = new Employee(data.employee);
                  this.employee.data.variations.forEach(agmt => {
                    if (agmt.id === this.variation.id) {
                      this.variation = new Variation(agmt);
                      this.setVariation();
                    }
                  });
                }
                const emp = this.empService.getEmployee();
                if (data.employee && emp && emp.id === data.employee.id) {
                  this.empService.setEmployee(data.employee);
                }
                const site = this.siteService.getSite();
                if (site && site.employees && site.employees.length && data.employee) {
                  let found = false;
                  for (let i=0; i < site.employees.length && !found; i++) {
                    if (site.employees[i].id === data.employee.id) {
                      site.employees[i] = new Employee(data.employee);
                      found = true;
                    }
                  }
                  if (!found) {
                    site.employees.push(new Employee(data.employee));
                  }
                  site.employees.sort((a,b) => a.compareTo(b));
                  this.siteService.setSite(site);
                  this.siteService.setSelectedEmployee(data.employee);
                }
              }
              this.changed.emit(new Employee(this.employee));
              this.authService.statusMessage = "Update complete";
            },
            error: err => {
              this.dialogService.closeSpinner();
              this.authService.statusMessage = err.error.exception;
            }
          });
      }
    }
  }
}
