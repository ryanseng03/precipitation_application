import { TestBed } from '@angular/core/testing';

import { UnitTransformerService } from './unit-transformer.service';

describe('UnitTransformerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UnitTransformerService = TestBed.get(UnitTransformerService);
    expect(service).toBeTruthy();
  });
});
