import { TestBed } from '@angular/core/testing';

import { RasterRequestorService } from './raster-requestor.service';

describe('RasterRequestorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RasterRequestorService = TestBed.get(RasterRequestorService);
    expect(service).toBeTruthy();
  });
});
