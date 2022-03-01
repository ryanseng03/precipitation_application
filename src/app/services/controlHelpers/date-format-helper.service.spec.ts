import { TestBed } from '@angular/core/testing';

import { DateFormatHelperService } from './date-format-helper.service';

describe('DateFormatHelperService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DateFormatHelperService = TestBed.get(DateFormatHelperService);
    expect(service).toBeTruthy();
  });
});
