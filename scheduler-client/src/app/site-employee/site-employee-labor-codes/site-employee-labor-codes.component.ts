import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Employee, EmployeeLaborCode, IEmployee } from 'src/app/models/employees/employee';
import { ISite, Site } from 'src/app/models/sites/site';
import { EmployeeResponse } from 'src/app/models/web/employeeWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

export interface LaborCharge {
  chargenumber: string;
  extension: string;
  checked: boolean;
}

@Component({
  selector: 'app-site-employee-labor-codes',
  templateUrl: './site-employee-labor-codes.component.html',
  styleUrls: ['./site-employee-labor-codes.component.scss']
})
export class SiteEmployeeLaborCodesComponent {
  private _employee: Employee | undefined;
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setLaborCodes();
  }
  get employee(): Employee {
    if (this._employee) {
      return this._employee
    } 
    return new Employee();
  }
  private _site: Site = new Site();
  @Input()
  public set site(iSite: ISite) {
    this._site = new Site(iSite);
    this.setLaborCodes();
  }
  get site(): Site {
    return this._site;
  }
  @Output() changed = new EventEmitter<Employee>();
  laborcodes: LaborCharge[] = [];
  year: number = (new Date()).getFullYear();

  constructor(
    protected authService: AuthService,
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected dialogService: DialogService
  ) { 
    this.setLaborCodes();
  }

  setLaborCodes() {
    this.laborcodes = [];
    const start = new Date(Date.UTC(this.year, 0, 1));
    const end = new Date(Date.UTC(this.year, 11, 31));
    if (this.site.id === '') {
      const iSite = this.siteService.getSite();
      if (iSite) {
        this.site = new Site(iSite);
      }
    }
    if (this.site && this.site.forecasts) {
      this.site.forecasts.forEach(fcst => {
        if (fcst.laborCodes) {
          fcst.laborCodes.forEach(lc => {
            if (lc.startDate.getTime() < end.getTime() 
              && lc.endDate.getTime() > start.getTime()) {
              const elc: LaborCharge = {
                chargenumber: lc.chargeNumber,
                extension: lc.extension,
                checked: this.employee.data.hasLaborCode(lc.chargeNumber, 
                  lc.extension),
              };
              this.laborcodes.push(elc);
            }
          });
        }
      });
    }
  }

  updateYear(direction: string) {
    if (direction.substring(0,1).toLowerCase() === 'u') {
      this.year++;
    } else {
      this.year--;
    }
    this.setLaborCodes();
  }

  onSelect(chgNo: string, ext: string, event: MatCheckboxChange) {
    if (event.checked) {
      this.empService.addLaborCode(this.employee.id, chgNo, ext)
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
              this.setLaborCodes();
            }
            const emp = this.empService.getEmployee();
            if (data.employee && emp && emp.id === data.employee.id) {
              this.empService.setEmployee(data.employee);
            }
          }
          this.changed.emit(new Employee(this.employee));
          this.authService.statusMessage = "Update complete";
        },
        error: err => {
          this.dialogService.closeSpinner();
          this.authService.statusMessage = err.message;
        }
      });
    } else {
      this.empService.removeLaborCode(this.employee.id, chgNo, ext)
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
              this.setLaborCodes();
            }
            const emp = this.empService.getEmployee();
            if (data.employee && emp && emp.id === data.employee.id) {
              this.empService.setEmployee(data.employee);
            }
          }
          this.changed.emit(new Employee(this.employee));
          this.authService.statusMessage = "Update complete";
        },
        error: err => {
          this.dialogService.closeSpinner();
          this.authService.statusMessage = err.message;
        }
      });
    }
  }
}
