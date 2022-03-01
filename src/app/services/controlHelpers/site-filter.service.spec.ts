import { TestBed } from '@angular/core/testing';

import { SiteFilterService } from './site-filter.service';

describe('SiteFilterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SiteFilterService = TestBed.get(SiteFilterService);
    expect(service).toBeTruthy();
  });
});
