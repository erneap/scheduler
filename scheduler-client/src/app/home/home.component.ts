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
import { EmployeeService } from '../services/employee.service';
import { SiteService } from '../services/site.service';
import { TeamService } from '../services/team.service';
import { MessageService } from '../services/message.service';
import { NotificationResponse } from '../models/web/internalWeb';

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
    protected employeeService: EmployeeService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    private httpClient: HttpClient,
    private formBuilder: FormBuilder,
    private router: Router,
    public dialog: MatDialog,
    private dialogService: DialogService,
    protected ipService: IpService,
    protected msgService: MessageService
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
      this.router.navigate(["/employee/schedule"])
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
    this.authService.loginError = "";
    
    this.authService.statusMessage = "User Login in Progress";
    this.httpClient.post<AuthenticationResponse>(
      '/scheduler/api/v1/user/login', data
    ).subscribe({
      next: (data) => {
        let team = "";
        let site = "";
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
        if (data.employee) {
          this.employeeService.setEmployee(data.employee);
          this.msgService.getEmployeeMessages(data.employee.id).subscribe({
            next: resp => {
              const data: NotificationResponse | null = resp.body;
              if (data && data !== null && data.messages) {
                this.msgService.setMessages(data.messages)
                this.msgService.showAlerts = data.messages.length > 0;
                this.router.navigateByUrl('/notifications')
              }
            },
            error: err => {
              this.authService.statusMessage = "Error retrieving alerts: "
                + err.exception;
            }
          });
        }
        if (data.site) {
          this.siteService.setSite(data.site);
          site = data.site.name;
        }
        if (data.team) {
          this.teamService.setTeam(data.team);
          team = data.team.name;
        }
        this.authService.setWebLabel(team, site);
        this.msgService.startAlerts();
        if (data.exception && data.exception !== '') {
          this.loginError = data.exception;
          this.authService.isAuthenticated = false;
        }
        if (this.authService.isAuthenticated) {
          this.router.navigate(['/employee/schedule']);
        }
        this.authService.statusMessage = "User Login Complete";
      },
      error: (err) => {
        this.dialogService.closeSpinner();
        this.loginError = err.error.exception
        this.authService.statusMessage = err.message;
        this.authService.isAuthenticated = false;
      }
    });
  }
}
