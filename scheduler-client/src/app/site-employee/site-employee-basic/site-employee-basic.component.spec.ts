import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEmployeeBasicComponent } from './site-employee-basic.component';

describe('SiteEmployeeBasicComponent', () => {
  let component: SiteEmployeeBasicComponent;
  let fixture: ComponentFixture<SiteEmployeeBasicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SiteEmployeeBasicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteEmployeeBasicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
