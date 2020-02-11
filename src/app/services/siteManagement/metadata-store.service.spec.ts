import { TestBed } from '@angular/core/testing';

import { MetadataStoreService } from './metadata-store.service';

describe('MetadataStoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MetadataStoreService = TestBed.get(MetadataStoreService);
    expect(service).toBeTruthy();
  });
});
