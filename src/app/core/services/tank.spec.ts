import { TestBed } from '@angular/core/testing';

import { Tank } from './tank';

describe('Tank', () => {
  let service: Tank;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tank);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
