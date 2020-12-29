import { TestBed } from '@angular/core/testing';

import { DatasetSelectorService } from './dataset-selector.service';

describe('DatasetSelectorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DatasetSelectorService = TestBed.get(DatasetSelectorService);
    expect(service).toBeTruthy();
  });
});
