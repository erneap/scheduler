import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Assignment, Schedule } from 'src/app/models/employees/assignments';
import { Employee, EmployeeLaborCode } from 'src/app/models/employees/employee';
import { LaborCode } from 'src/app/models/sites/laborcode';
import { Workcenter } from 'src/app/models/sites/workcenter';
import { Company } from 'src/app/models/teams/company';
import { MustMatchValidator } from 'src/app/models/validators/must-match-validator.directive';
import { PasswordStrengthValidator } from 'src/app/models/validators/password-strength-validator.directive';
import { ChangeAssignmentRequest, EmployeeResponse } from 'src/app/models/web/employeeWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-new-employee',
  templateUrl: './new-employee.component.html',
  styleUrls: ['./new-employee.component.scss']
})
export class NewEmployeeComponent {
  employee: Employee = new Employee();
  employeeForm: FormGroup;
  companies: Company[] = [];
  laborcodes: EmployeeLaborCode[];
  workcenters: Workcenter[];
  schedule: Schedule;
  teamid: string = '';
  siteid: string = '';

  constructor(
    protected teamService: TeamService,
    protected siteService: SiteService,
    protected empService: EmployeeService,
    protected dialogService: DialogService,
    protected authService: AuthService,
    private fb: FormBuilder
  ) {
    this.companies = [];
    const team = this.teamService.getTeam();
    if (team && team.companies && team.companies.length > 0) {
      this.teamid = team.id;
      team.companies.forEach(co => {
        this.companies.push(new Company(co));
      });
    }
    const now = new Date();
    const site = this.siteService.getSite();
    this.laborcodes = [];
    this.workcenters = [];
    if (site) {
      this.siteid = site.id;
      if ( site.forecasts && site.forecasts.length > 0) {
        site.forecasts.forEach(rpt => {
          if (rpt.startDate.getTime() <= now.getTime() 
            && rpt.endDate.getTime() >= now.getTime() 
            && rpt.laborCodes && rpt.laborCodes.length > 0) {
            rpt.laborCodes.forEach(lc => {
              if (!lc.exercise) {
                const labor = new EmployeeLaborCode();
                labor.chargeNumber = lc.chargeNumber;
                labor.extension = lc.extension;
                this.laborcodes.push(labor);
              }
            });
          }
        });
        this.laborcodes.sort((a,b) => a.compareTo(b));
      }
      if (site.workcenters && site.workcenters.length > 0) {
        site.workcenters.forEach(wc => {
          this.workcenters.push(new Workcenter(wc));
        });
      }
    }
    if (this.employee.data.assignments.length === 0) {
      const asgmt = new Assignment();
      asgmt.startDate = new Date();
      asgmt.endDate = new Date(9999, 12, 30);
      if (asgmt.schedules.length === 0) {
        const sched = new Schedule();
        if (sched.workdays.length === 0) {
          sched.setScheduleDays(7);
        }
        asgmt.schedules.push(sched);
      }
      this.employee.data.assignments.push(asgmt);
    }
    this.schedule = this.employee.data.assignments[0].schedules[0];
    this.siteService.setSelectedEmployee(new Employee());
    this.employeeForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      first: ['', [Validators.required]],
      middle: '',
      last: ['', [Validators.required]],
      password: ['', [Validators.required, new PasswordStrengthValidator()]],
      password2: ['', [Validators.required, new MustMatchValidator()]],
      company: ['', [Validators.required]],
      employeeid: ['', [Validators.required]],
      alternateid: '',
      jobtitle: ['', [Validators.required]],
      rank: '',
      costcenter: '',
      division: '',
      laborcode: '',
      workcenter: '',
      startdate: new Date(),
    });
  }

  clearForm() {
    this.employeeForm.controls['newemail'].setValue('');
    this.employeeForm.controls['first'].setValue('');
    this.employeeForm.controls['middle'].setValue('');
    this.employeeForm.controls['last'].setValue('');
    this.employeeForm.controls['newpassword'].setValue('');
    this.employeeForm.controls['password2'].setValue('');
    this.employeeForm.controls['company'].setValue('');
    this.employeeForm.controls['employeeid'].setValue('');
    this.employeeForm.controls['alternateid'].setValue('');
    this.employeeForm.controls['jobtitle'].setValue('');
    this.employeeForm.controls['rank'].setValue('');
    this.employeeForm.controls['costcenter'].setValue('');
    this.employeeForm.controls['division'].setValue('');
    this.employeeForm.controls['laborcode'].setValue('');
    this.employeeForm.controls['workcenter'].setValue('');
    this.employeeForm.controls['startdate'].setValue(new Date());
  }

  getPasswordError(): string {
    let answer: string = ''
    if (this.employeeForm.get('password')?.hasError('required')) {
      answer = "Password is Required";
    }
    if (this.employeeForm.get('password')?.hasError('passwordStrength')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Password doesn't meet minimum requirements";
    }
    return answer;
  }

  getVerifyError(): string {
    let answer: string = ''
    if (this.employeeForm.get('password2')?.hasError('required')) {
      answer = "Password is Required";
    }
    if (this.employeeForm.get('password2')?.hasError('matching')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Password doesn't match";
    }
    return answer;
  }

  changeAssignmentScheduleDate(data: ChangeAssignmentRequest) {
    if (data.workday) {
      let found = false;
      for (let i=0; 
        i < this.employee.data.assignments[0].schedules[0].workdays.length 
        && !found; i++) {
          const wd = this.employee.data.assignments[0].schedules[0].workdays[i];
          if (wd.id === data.workday) {
            switch (data.field.toLowerCase()) {
              case "code":
                wd.code = data.value;
                break;
              case "workcenter":
                wd.workcenter = data.value;
                break;
              case "hours":
                const hrs = Number(data.value);
                wd.hours = hrs;
                break;
            }
            found = true;
            this.employee.data.assignments[0].schedules[0].workdays[i] = wd;
          }
        }
    }
  }

  changeAssignmentSchedule(data: ChangeAssignmentRequest) {
    if (data.field === 'changeschedule') {
      const days = Number(data.value);
      this.schedule.setScheduleDays(days);
      this.schedule = new Schedule(this.schedule);
    }
  }

  addEmployee() {
    this.employee.name.first = this.employeeForm.value.first;
    this.employee.name.middle = this.employeeForm.value.middle;
    this.employee.name.last = this.employeeForm.value.last;
    this.employee.email = this.employeeForm.value.email;
    const passwd = this.employeeForm.value.password;
    this.employee.data.companyinfo.company = this.employeeForm.value.company;
    this.employee.data.companyinfo.employeeid 
      = this.employeeForm.value.employeeid;
    this.employee.data.companyinfo.alternateid 
      = this.employeeForm.value.alternateid;
    this.employee.data.companyinfo.jobtitle = this.employeeForm.value.jobtitle;
    this.employee.data.companyinfo.rank = this.employeeForm.value.rank;
    this.employee.data.companyinfo.costcenter = this.employeeForm.value.costcenter;
    this.employee.data.companyinfo.division = this.employeeForm.value.division;
    const labor: string = this.employeeForm.value.laborcode;
    const laborParts = labor.split("|");
    const laborcode = new EmployeeLaborCode({
      chargeNumber: laborParts[0],
      extension: laborParts[1],
    });
    this.employee.data.laborCodes.push(laborcode);
    this.employee.data.assignments[0].workcenter = this.employeeForm.value.workcenter;
    this.employee.data.assignments[0].startDate = new Date(this.employeeForm.value.startdate);
    this.employee.data.assignments[0].schedules[0] = this.schedule;

    this.dialogService.showSpinner();
    this.empService.addEmployee(this.employee, passwd, this.teamid, this.siteid)
      .subscribe({
        next: (resp) => {
          this.dialogService.closeSpinner();
          if (resp.headers.get('token') !== null) {
            this.authService.setToken(resp.headers.get('token') as string);
          }

          const data: EmployeeResponse | null = resp.body;
          if (data && data !== null) {
            if (data.employee) {
              this.employee = new Employee(data.employee);
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
        },
        error: err => {

        }
      });
  }
}
