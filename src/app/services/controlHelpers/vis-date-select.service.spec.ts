import { TestBed } from '@angular/core/testing';

import { VisDateSelectService } from './vis-date-select.service';

describe('VisDateSelectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VisDateSelectService = TestBed.get(VisDateSelectService);
    expect(service).toBeTruthy();
  });
});
