import { TestBed } from '@angular/core/testing';

import { ParameterStoreService } from './parameter-store.service';

describe('ParameterStoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ParameterStoreService = TestBed.get(ParameterStoreService);
    expect(service).toBeTruthy();
  });
});
