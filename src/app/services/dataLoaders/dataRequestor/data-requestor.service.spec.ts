import { TestBed } from '@angular/core/testing';

import { DataRequestorService } from './data-requestor.service';

describe('DataRequestorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DataRequestorService = TestBed.get(DataRequestorService);
    expect(service).toBeTruthy();
  });
});
