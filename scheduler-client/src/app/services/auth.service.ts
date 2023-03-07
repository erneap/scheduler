import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { IUser, User } from '../models/users/user';
import { AuthenticationResponse, ChangePasswordRequest, Message, UpdateRequest }
  from '../models/web/employeeWeb';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends CacheService {
  loginError: string = '';
  isAuthenticated = false;
  lastPage = '';
  isScheduler = false;
  isLeader = false;
  isAdmin = false;
  isCompanyLead = false;
  schedulerLabel = "Scheduler";
  section: string = 'employee';
  statusMessage: string = '';

  authStatus = new BehaviorSubject<IAuthStatus>( 
    this.getItem('authStatus') || defaultAuthStatus);

  private readonly authProvider: (email: string, password: string)
    => Observable<AuthenticationResponse>;

  constructor(
    public httpClient: HttpClient,
    private router: Router
  ) {
    super();
    this.authStatus.subscribe(authStatus => this.setItem('authStatus', 
      authStatus));
    this.authProvider = this.apiAuthProvider;
  }

  private apiAuthProvider(email: string, password: string)
    : Observable<AuthenticationResponse> {
    return this.httpClient.post<AuthenticationResponse>(
      '/scheduler/api/v1/user/logon', 
      { email: email, password: password });
  }

  logout() {
    this.clearToken();
    this.isAuthenticated = false;
    this.setWebLabel("", "");
    this.router.navigate(["/home"]);
  }

  public hasRole(role: string): boolean {
    const user = this.getUser();
    if (user) {
      return user.isInGroup("scheduler", role);
    } else {
      return false;
    }
  }

  public isInRoles(roles: string[]): boolean {
    let answer = false;
    const user = this.getUser();
    if (user) {
      roles.forEach(role => {
        if (user.isInGroup("scheduler", role)) {
          answer = true;
        }
      });
    }
    return answer;
  }

  isTokenExpired(): Boolean {
    const authStatus = this.getDecodedToken();
    return (Math.floor((new Date()).getTime() / 1000)) >= authStatus.exp;
  }

  getDecodedToken(): IAuthStatus {
    const token = this.getItem<string>('jwt');
    if (token) {
      return jwt_decode(token);
    } else {
      return defaultAuthStatus;
    }
  }

  getExpiredDate(): Date {
    return new Date(this.getDecodedToken().exp * 1000);
  }

  getUser(): User | undefined {
    if (!this.isTokenExpired()) {
      const iUser = this.getItem<IUser>('current-user');
      if (iUser) {
        const user = new User(iUser);
        this.isScheduler = user.isInGroup("scheduler", "scheduler");
        this.isLeader = user.isInGroup("scheduler", "sitelead");
        this.isAdmin = user.isInGroup("scheduler", "admin");
        this.isCompanyLead = user.isInGroup("scheduler", "companylead");
        this.isAuthenticated = true;
        return user;
      }
    } else {
      this.clearToken()
    }
    return undefined;
  }

  setUser(iUser: IUser) {
    const user = new User(iUser);
    this.isScheduler = user.isInGroup("scheduler", "scheduler");
    this.isLeader = user.isInGroup("scheduler", "leader");
    this.isAdmin = user.isInGroup("scheduler", "admin");
    this.isCompanyLead = user.isInGroup("scheduler", "companylead");
    this.setItem('current-user', user);
  }
  
  getToken(): string {
    var token: string = this.getItem('jwt') || ''
    if (token !== '') { 
      this.isAuthenticated = true
    }
    return token
  }

  setToken(jwt: string) {
    this.setItem('jwt', jwt);
  }

  clearToken() {
    this.removeItem('jwt');
    this.removeItem('current-user');
    this.removeItem('current-employee');
    this.removeItem('current-site');
    this.removeItem('current-team');
  }

  setWebLabel(team: string, site: string) {
    if (team === "" && site === "") {
      this.schedulerLabel = "Scheduler";
    } else if (site === "") {
      this.schedulerLabel = `${team.toUpperCase()} Scheduler`;
    } else {
      this.schedulerLabel = `${team.toUpperCase()} - ${site.toUpperCase()} Scheduler`;
    }
  }

  changeUser(id: string, field: string, value: string): 
    Observable<HttpResponse<AuthenticationResponse>> {
    const url = '/scheduler/api/v1/user/changes';
    const data: UpdateRequest = {
      id: id,
      field: field,
      value: value,
    };
    return this.httpClient.put<AuthenticationResponse>(url, data, 
      { observe: 'response'});
  }

  changePassword(id: string, passwd: string): Observable<HttpResponse<Message>> {
    const url = '/scheduler/api/v1/user/password';
    const data: ChangePasswordRequest = {
      id: id,
      password: passwd,
    }
    return this.httpClient.put<Message>(url, data, { observe: 'response'});
  }
}

export interface IAuthStatus {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const defaultAuthStatus = { userId: '', email: '', iat: 0, exp: 0 }
