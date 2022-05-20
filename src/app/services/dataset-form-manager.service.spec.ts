import { TestBed } from '@angular/core/testing';

import { DatasetFormManagerService } from './dataset-form-manager.service';

describe('DatasetFormManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DatasetFormManagerService = TestBed.get(DatasetFormManagerService);
    expect(service).toBeTruthy();
  });
});
