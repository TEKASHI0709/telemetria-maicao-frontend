import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevicesAdmin } from './devices-admin';

describe('DevicesAdmin', () => {
  let component: DevicesAdmin;
  let fixture: ComponentFixture<DevicesAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(DevicesAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
