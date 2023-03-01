import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { transformErrorString } from 'src/app/models/employees/common';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { MustMatchValidator } from 'src/app/models/validators/must-match-validator.directive';
import { PasswordStrengthValidator } from 'src/app/models/validators/password-strength-validator.directive';
import { AuthenticationResponse, EmployeeResponse, Message } from 'src/app/models/web/employeeWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-employee-profile-form',
  templateUrl: './employee-profile-form.component.html',
  styleUrls: ['./employee-profile-form.component.scss']
})
export class EmployeeProfileFormComponent {
  private _employee: Employee | undefined;
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setForm();
  }
  get employee(): Employee {
    if (!this._employee) {
      const iEmp = this.empService.getEmployee();
      if (iEmp) {
        return new Employee(iEmp);
      }
      return new Employee();
    }
    return this._employee;
  }
  @Output() changed = new EventEmitter<Employee>();

  profileForm: FormGroup;
  formError: string = '';
  showPassword: boolean = true;

  constructor(
    protected authService: AuthService,
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected dialogService: DialogService,
    private httpClient: HttpClient,
    private fb: FormBuilder
  ) {
    this.profileForm = fb.group({
      email: ['', [Validators.required, Validators.email]],
      first: ['', [Validators.required]],
      middle: '',
      last: ['', [Validators.required]],
      password: ['', [new PasswordStrengthValidator()]],
      password2: ['', [new MustMatchValidator()]],
    });
    this.setForm();
  }

  setForm() {
    this.showPassword = this.employee.email !== '';
    this.profileForm.controls["email"].setValue(this.employee.email);
    this.profileForm.controls["first"].setValue(this.employee.name.first);
    this.profileForm.controls["middle"].setValue(this.employee.name.middle);
    this.profileForm.controls["last"].setValue(this.employee.name.last);
    this.profileForm.controls["password"].setValue('');
    this.profileForm.controls["password2"].setValue('');
  }

  getPasswordError(): string {
    let answer: string = ''
    if (this.profileForm.get('password')?.hasError('required')) {
      answer = "Password is Required";
    }
    if (this.profileForm.get('password')?.hasError('passwordStrength')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Password doesn't meet minimum requirements";
    }
    return answer;
  }

  getVerifyError(): string {
    let answer: string = ''
    if (this.profileForm.get('password2')?.hasError('required')) {
      answer = "Password is Required";
    }
    if (this.profileForm.get('password2')?.hasError('matching')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Password doesn't match";
    }
    return answer;
  }

  setPassword() {
    if (this.profileForm.valid) {
      const user = this.authService.getUser();
      const id = (user && user.id) ? user.id : '';
      const passwd = this.profileForm.value.password;
      this.dialogService.showSpinner();
      this.authService.statusMessage = "Updating User Password";
      this.authService.changePassword(id, passwd)
        .subscribe({
          next: (resp) => {
            this.dialogService.closeSpinner();
            if (resp.headers.get('token') !== null) {
              this.authService.setToken(resp.headers.get('token') as string);
            }
            const data: Message | null = resp.body;
            if (data && data !== null) {
              this.formError = data.message;
              if (data.message.toLowerCase() === 'password changed') {
                this.profileForm.controls['password'].setValue(undefined);
                this.profileForm.controls['password2'].setValue(undefined);
              }
            }
            this.authService.statusMessage = "Update complete";
          },
          error: error => {
            this.dialogService.closeSpinner();
            this.authService.statusMessage = error.error.exception;
          }
        });
    }
  }

  updateUserField(field: string) {
    let value: string = '';
    const user = this.authService.getUser();
    switch(field.toLowerCase()) {
      case "email":
        value = this.profileForm.value.email;
        break;
      case "first":
        value = this.profileForm.value.first;
        break;
      case "middle":
        value = this.profileForm.value.middle;
        break;
      case "last":
        value = this.profileForm.value.last;
        break;
    }
    this.dialogService.showSpinner();
    this.authService.statusMessage = `Updating User's ${field.toUpperCase()}`;
    this.empService.updateEmployee(this.employee.id, field, value)
      .subscribe({
        next: (resp) => {
          this.dialogService.closeSpinner();
          if (resp.headers.get('token') !== null) {
            this.authService.setToken(resp.headers.get('token') as string);
          }
          const data: EmployeeResponse | null = resp.body;
          if (data && data !== null) {
            if (data.employee) {
              this.employee = data.employee;
              const emp = this.empService.getEmployee();
              if (emp && emp.id === data.employee.id) {
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
              }
            }
          }
          this.changed.emit(new Employee(this.employee));
          this.authService.statusMessage = "Update complete"; 
        },
        error: (err) => {
          this.dialogService.closeSpinner();
          this.authService.statusMessage = err.error.exception;
        }
      });
  }
}
