import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLaborCodesComponent } from './employee-labor-codes.component';

describe('EmployeeLaborCodesComponent', () => {
  let component: EmployeeLaborCodesComponent;
  let fixture: ComponentFixture<EmployeeLaborCodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmployeeLaborCodesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeLaborCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
