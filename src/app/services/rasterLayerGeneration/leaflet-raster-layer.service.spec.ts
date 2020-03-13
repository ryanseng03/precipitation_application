import { TestBed } from '@angular/core/testing';

import { LeafletRasterLayerService } from './leaflet-raster-layer.service';

describe('LeafletRasterLayerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LeafletRasterLayerService = TestBed.get(LeafletRasterLayerService);
    expect(service).toBeTruthy();
  });
});
