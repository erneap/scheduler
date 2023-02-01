import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../models/users/user';
import { AuthenticationResponse } from '../models/web/employeeWeb';
import { AuthService } from '../services/auth.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PasswordExpireDialogComponent } from './password-expire-dialog/password-expire-dialog.component';
import { WaitDialogComponent } from './wait-dialog/wait-dialog.component';
import { DialogService } from '../services/dialog-service.service';
import { IpService } from '../services/ip-service.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  loginForm: FormGroup;
  loginError: string = '';
  matDialogRef?: MatDialogRef<WaitDialogComponent> = undefined
  ipAddress: string = "";

  constructor(
    public authService: AuthService,
    private httpClient: HttpClient,
    private formBuilder: FormBuilder,
    private router: Router,
    public dialog: MatDialog,
    private dialogService: DialogService,
    protected ipService: IpService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(30),
      ]],
    });
    if (this.authService.getUser()) {
      this.authService.isAuthenticated = true;
      this.router.navigate(["/missions"])
    }
  }

  ngOnInit() {
    this.buildLoginForm();
    this.getIP();
  }

  getIP() {
    this.ipService.getIPAddress().subscribe((res:any) => {
      this.ipAddress=res.ip;
    });
  }

  buildLoginForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(30),
      ]],
    });
  }

  login() {
    this.authService.clearToken();
    let data = { emailAddress: this.loginForm.value.email,
      password: this.loginForm.value.password };
    this.dialogService.showSpinner();
    this.httpClient.post<AuthenticationResponse>(
      '/scheduler/api/v1/user/login', data
    ).subscribe({
      next: (data) => {
        this.dialogService.closeSpinner();
        this.authService.isAuthenticated = true;
        if (data.user) {
          const user = new User(data.user);
          this.authService.setUser(user);
          const expiresIn = Math.floor((user.passwordExpires.getTime() - (new Date).getTime())/(24 * 3600000));
          if (expiresIn <= 10) {
            const dialogRef = this.dialog.open(PasswordExpireDialogComponent, {
              width: '250px',
              data: { days: expiresIn },
            });
          }
        }
        if (data.token) {
          this.authService.setToken(data.token);
        }
        if (data.exception && data.exception !== '') {
          this.loginError = data.exception;
          this.authService.isAuthenticated = false;
        }
        if (this.authService.isAuthenticated) {
          this.router.navigate(['/missions']);
        }
      },
      error: (err) => {
        this.dialogService.closeSpinner();
        this.loginError = err.error.exception
        this.authService.isAuthenticated = false;
      }
    });
  }
}
