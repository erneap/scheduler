import { Injectable } from '@angular/core';
import { Employee, IEmployee } from '../models/employees/employee';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService extends CacheService {

  constructor() 
  { 
    super();
  }

  getEmployee(): Employee | undefined {
    const iEmp = this.getItem<IEmployee>("current-employee");
    if (iEmp) {
      return new Employee(iEmp);
    }
    return undefined;
  }

  setEmployee(iEmp: IEmployee): void {
    const emp = new Employee(iEmp);
    this.setItem('current-employee', emp);
  }
}
