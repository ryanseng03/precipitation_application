import { TestBed } from '@angular/core/testing';

import { MetadataPrettifierService } from './metadata-prettifier.service';

describe('MetadataPrettifierService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MetadataPrettifierService = TestBed.get(MetadataPrettifierService);
    expect(service).toBeTruthy();
  });
});
