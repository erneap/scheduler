import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserActionsProfileComponent } from './user-actions-profile.component';

describe('UserActionsProfileComponent', () => {
  let component: UserActionsProfileComponent;
  let fixture: ComponentFixture<UserActionsProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserActionsProfileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserActionsProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
