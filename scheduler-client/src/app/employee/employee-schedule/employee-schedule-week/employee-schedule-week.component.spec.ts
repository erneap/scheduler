import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeScheduleWeekComponent } from './employee-schedule-week.component';

describe('EmployeeScheduleWeekComponent', () => {
  let component: EmployeeScheduleWeekComponent;
  let fixture: ComponentFixture<EmployeeScheduleWeekComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmployeeScheduleWeekComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeScheduleWeekComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
