import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IUser, User } from 'src/app/models/users/user';
import { MustMatchValidator } from 'src/app/models/validators/must-match-validator.directive';
import { PasswordStrengthValidator } from 'src/app/models/validators/password-strength-validator.directive';
import { UpdateRequest } from 'src/app/models/web/employeeWeb';

@Component({
  selector: 'app-user-actions-profile',
  templateUrl: './user-actions-profile.component.html',
  styleUrls: ['./user-actions-profile.component.scss']
})
export class UserActionsProfileComponent {
  private _user: User = new User();
  @Input()
  public set user(iUser: IUser) {
    this._user = new User(iUser);
    this.setForm();
  }
  get user(): User {
    return this._user;
  }
  @Output() changed = new EventEmitter<User>();
  
  profileForm: FormGroup;
  formError: string = '';

  constructor(
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      first: '', 
      middle: '',
      last: '',
      password: ['', [Validators.required, new PasswordStrengthValidator()]],
      password2: ['', [Validators.required, new MustMatchValidator()]],
      employee: true,
      scheduler: false,
      company: false,
      siteleader: false,
      teamleader: false,
      admin: false,
    });
  }

  setForm() {
    if (this.user.id === '') {
      this.profileForm.controls["email"].setValue('');
      this.profileForm.controls["first"].setValue('');
      this.profileForm.controls["middle"].setValue('');
      this.profileForm.controls["last"].setValue('');
      this.profileForm.controls["password"].setValue('');
      this.profileForm.controls["password2"].setValue('');
      this.profileForm.controls["employee"].setValue(true);
      this.profileForm.controls["scheduler"].setValue(false);
      this.profileForm.controls["company"].setValue(false);
      this.profileForm.controls["siteleader"].setValue(false);
      this.profileForm.controls["teamleader"].setValue(false);
      this.profileForm.controls["admin"].setValue(false);
    } else {
      this.profileForm.controls["email"].setValue(this.user.emailAddress);
      this.profileForm.controls["first"].setValue(this.user.firstName);
      this.profileForm.controls["middle"].setValue(this.user.middleName);
      this.profileForm.controls["last"].setValue(this.user.lastName);
      this.profileForm.controls["password"].setValue('');
      this.profileForm.controls["password2"].setValue('');
      this.profileForm.controls["employee"]
        .setValue(this.user.isInGroup('scheduler', 'employee'));
      this.profileForm.controls["scheduler"]
        .setValue(this.user.isInGroup('scheduler', 'scheduler'));
      this.profileForm.controls["company"]
        .setValue(this.user.isInGroup('scheduler', 'company'));
      this.profileForm.controls["siteleader"]
        .setValue(this.user.isInGroup('scheduler', 'siteleader'));
      this.profileForm.controls["teamleader"]
        .setValue(this.user.isInGroup('scheduler', 'teamleader'));
      this.profileForm.controls["admin"]
        .setValue(this.user.isInGroup('scheduler', 'admin'));
    }
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

  onChange(field: string) {
    
  }

  onAdd() {
    if (this.profileForm.valid) {
      this.user.emailAddress = this.profileForm.value.email;
      this.user.firstName = this.profileForm.value.first;
      this.user.middleName = this.profileForm.value.middle;
      this.user.lastName = this.profileForm.value.last;
      this.user.workgroups = [];
      if (this.profileForm.value.employee) {
        this.user.workgroups.push("scheduler-employee");
      }
      if (this.profileForm.value.scheduler) {
        this.user.workgroups.push("scheduler-scheduler");
      }
      if (this.profileForm.value.company) {
        this.user.workgroups.push("scheduler-company");
      }
      if (this.profileForm.value.siteleader) {
        this.user.workgroups.push("scheduler-siteleader");
      }
      if (this.profileForm.value.teamleader) {
        this.user.workgroups.push("scheduler-teamleader");
      }
      if (this.profileForm.value.admin) {
        this.user.workgroups.push("scheduler-admin");
      }
    }
  }
}
