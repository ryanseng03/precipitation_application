import { TestBed } from '@angular/core/testing';

import { GeotiffDataLoaderService } from './geotiff-data-loader.service';

describe('GeotiffDataLoaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GeotiffDataLoaderService = TestBed.get(GeotiffDataLoaderService);
    expect(service).toBeTruthy();
  });
});
