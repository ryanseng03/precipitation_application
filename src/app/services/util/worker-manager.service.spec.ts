import { TestBed } from '@angular/core/testing';

import { WorkerManagerService } from './worker-manager.service';

describe('WorkerManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WorkerManagerService = TestBed.get(WorkerManagerService);
    expect(service).toBeTruthy();
  });
});
