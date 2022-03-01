import { TestBed } from '@angular/core/testing';

import { StationFilteringService } from './station-filtering.service';

describe('StationFilteringService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StationFilteringService = TestBed.get(StationFilteringService);
    expect(service).toBeTruthy();
  });
});
