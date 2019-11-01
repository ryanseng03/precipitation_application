import { TestBed } from '@angular/core/testing';

import { DataRetreiverService } from './data-retreiver.service';

describe('DataRetreiverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DataRetreiverService = TestBed.get(DataRetreiverService);
    expect(service).toBeTruthy();
  });
});
