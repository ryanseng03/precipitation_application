import { TestBed } from '@angular/core/testing';

import { SiteValueFetcherService } from './site-value-fetcher.service';

describe('SiteValueFetcherService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SiteValueFetcherService = TestBed.get(SiteValueFetcherService);
    expect(service).toBeTruthy();
  });
});
