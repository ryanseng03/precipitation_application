import { TestBed } from '@angular/core/testing';

import { InternalPointsService } from './internal-points.service';

describe('InternalPointsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InternalPointsService = TestBed.get(InternalPointsService);
    expect(service).toBeTruthy();
  });
});
