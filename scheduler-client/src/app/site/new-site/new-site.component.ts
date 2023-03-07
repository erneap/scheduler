import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from 'src/app/models/employees/employee';
import { Site } from 'src/app/models/sites/site';
import { Company } from 'src/app/models/teams/company';
import { MustMatchValidator } from 'src/app/models/validators/must-match-validator.directive';
import { PasswordStrengthValidator } from 'src/app/models/validators/password-strength-validator.directive';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-new-site',
  templateUrl: './new-site.component.html',
  styleUrls: ['./new-site.component.scss']
})
export class NewSiteComponent {
  site: Site = new Site();
  employee: Employee = new Employee();
  companies: Company[];
  offsets: number[];
  siteForm: FormGroup;
  leadForm: FormGroup;
  schedulerForm: FormGroup;

  constructor(
    protected authService: AuthService,
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
    private fb: FormBuilder
  ) {
    this.siteForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern('^[a-z]*[0-9]*$')]],
      title: ['', [Validators.required]],
      mids: false,
      offset: 0.0,
    });
    this.leadForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      first: ['', [Validators.required]],
      middle: '',
      last: ['', [Validators.required]],
      password: ['', [Validators.required, new PasswordStrengthValidator()]],
      password2: ['', [Validators.required, new MustMatchValidator()]]
    });
    this.schedulerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      first: ['', [Validators.required]],
      middle: '',
      last: ['', [Validators.required]],
      password: ['', [Validators.required, new PasswordStrengthValidator()]],
      password2: ['', [Validators.required, new MustMatchValidator()]]
    });
    this.companies = [];
    const team = this.teamService.getTeam();
    if (team && team.companies) {
      team.companies.forEach(co => {
        this.companies.push(new Company(co))
      });
    }
    this.companies.sort((a,b) => a.compareTo(b));
    this.offsets = [];
    for (let i=-11.5; i <= 12.0; i += 0.5) {
      this.offsets.push(i);
    }
    this.offsets.sort((a,b) => a < b ? -1 : 1);
  }
  
  getPasswordError(): string {
    let answer: string = ''
    if (this.schedulerForm.get('password')?.hasError('required')) {
      answer = "Password is Required";
    }
    if (this.schedulerForm.get('password')?.hasError('passwordStrength')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Password doesn't meet minimum requirements";
    }
    return answer;
  }

  getVerifyError(): string {
    let answer: string = ''
    if (this.schedulerForm.get('password2')?.hasError('required')) {
      answer = "Password is Required";
    }
    if (this.schedulerForm.get('password2')?.hasError('matching')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Password doesn't match";
    }
    return answer;
  }
  
  getLeadPasswordError(): string {
    let answer: string = ''
    if (this.leadForm.get('password')?.hasError('required')) {
      answer = "Password is Required";
    }
    if (this.leadForm.get('password')?.hasError('passwordStrength')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Password doesn't meet minimum requirements";
    }
    return answer;
  }

  getLeadVerifyError(): string {
    let answer: string = ''
    if (this.leadForm.get('password2')?.hasError('required')) {
      answer = "Password is Required";
    }
    if (this.leadForm.get('password2')?.hasError('matching')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Password doesn't match";
    }
    return answer;
  }
}
