import { TestBed } from '@angular/core/testing';

import { Impersonation } from './impersonation';

describe('Impersonation', () => {
  let service: Impersonation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Impersonation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
