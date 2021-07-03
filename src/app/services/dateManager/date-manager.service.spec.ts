import { TestBed } from '@angular/core/testing';

import { DateManagerService } from './date-manager.service';

describe('DateManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DateManagerService = TestBed.get(DateManagerService);
    expect(service).toBeTruthy();
  });
});
