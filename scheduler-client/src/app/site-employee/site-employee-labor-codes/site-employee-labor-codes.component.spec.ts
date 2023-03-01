import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteEmployeeLaborCodesComponent } from './site-employee-labor-codes.component';

describe('SiteEmployeeLaborCodesComponent', () => {
  let component: SiteEmployeeLaborCodesComponent;
  let fixture: ComponentFixture<SiteEmployeeLaborCodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SiteEmployeeLaborCodesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteEmployeeLaborCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
