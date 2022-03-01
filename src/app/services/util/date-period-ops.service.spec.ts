import { TestBed } from '@angular/core/testing';

import { DatePeriodOpsService } from './date-period-ops.service';

describe('DatePeriodOpsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DatePeriodOpsService = TestBed.get(DatePeriodOpsService);
    expect(service).toBeTruthy();
  });
});
