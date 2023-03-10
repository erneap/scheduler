import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteNewWorkcenterDialogComponent } from './site-new-workcenter-dialog.component';

describe('SiteNewWorkcenterDialogComponent', () => {
  let component: SiteNewWorkcenterDialogComponent;
  let fixture: ComponentFixture<SiteNewWorkcenterDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SiteNewWorkcenterDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteNewWorkcenterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
