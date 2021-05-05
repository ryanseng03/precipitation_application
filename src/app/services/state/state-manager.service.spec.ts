import { TestBed } from '@angular/core/testing';

import { StateManagerService } from './state-manager.service';

describe('StateManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StateManagerService = TestBed.get(StateManagerService);
    expect(service).toBeTruthy();
  });
});
