import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageRequest, NotificationAck, NotificationResponse } from '../models/web/internalWeb';
import { Observable } from 'rxjs';
import { CacheService } from './cache.service';
import { INotification, Notification } from '../models/employees/notification';
import { EmployeeService } from './employee.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService  extends CacheService {
  showAlerts: boolean = false;
  interval: any;

  constructor(
    protected httpClient: HttpClient,
    protected empService: EmployeeService,
    protected authService: AuthService
  ) 
  { 
    super();
    const msgs = this.getMessages();
    this.showAlerts = (msgs && msgs.length > 0);
  }

  setMessages(msgs: INotification[]) {
    this.setItem('current-alerts', msgs);
  }

  clearMessages() {
    this.removeItem('current-alerts');
    this.showAlerts = false;
    console.log("Stopping Alert Checks!");
    if (this.interval && this.interval !== null) {
      clearInterval(this.interval)
    }
  }

  getMessages(): Notification[] {
    let msgs: Notification[] = [];
    const ialerts = this.getItem<INotification[]>('current-alerts');
    if (ialerts) {
      ialerts.forEach(alert => {
        msgs.push(new Notification(alert));
      });
      msgs.sort((a,b) => a.compareTo(b));
    }
    return msgs;
  }

  startAlerts() {
    const minutes = 1;
    if (this.interval && this.interval !== null) {
      clearInterval(this.interval)
    }
    console.log('Starting Alerts');
    this.interval = setInterval(() => {
      console.log('Awaiting Interval');
      this.updateMessages()
    }, minutes * 60 * 1000);
  }

  updateMessages() {
    const iEmp = this.empService.getEmployee();
    if (iEmp && this.authService.isAuthenticated) {
      this.getEmployeeMessages(iEmp.id).subscribe({
        next: resp => {
          const data: NotificationResponse | null = resp.body;
          if (data && data !== null && data.messages) {
            this.setMessages(data.messages)
            this.showAlerts = data.messages.length > 0;
          }
        },
        error: err => {
          this.authService.statusMessage = "Error retrieving alerts: "
            + err.exception;
        }
      })
    }
  }

  createMessage(to: string, from: string, message: string): 
    Observable<HttpResponse<NotificationResponse>> {
    const url = '/scheduler/api/v1/messages';
    const data: MessageRequest = {
      to: to,
      from: from,
      message: message,
    };
    return this.httpClient.post<NotificationResponse>(url, data, {observe: 'response'});
  }

  getMessage(id: string): Observable<HttpResponse<NotificationResponse>> {
    const url = `/scheduler/api/v1/messages/message/${id}`;
    return this.httpClient.get<NotificationResponse>(url, {observe: 'response'});
  }

  getEmployeeMessages(id: string): Observable<HttpResponse<NotificationResponse>> {
    const url = `/scheduler/api/v1/messages/employee/${id}`;
    return this.httpClient.get<NotificationResponse>(url, {observe: 'response'});
  }

  acknowledgeMessages(ids: string[]): Observable<HttpResponse<NotificationResponse>> {
    const url = `/scheduler/api/v1/messages/acknowledge`;
    const data: NotificationAck = {
      messages: ids,
    }
    return this.httpClient.put<NotificationResponse>(url, data, {observe: 'response'});
  }
}
