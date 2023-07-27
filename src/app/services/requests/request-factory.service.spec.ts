import { TestBed } from '@angular/core/testing';

import { RequestFactoryService } from './request-factory.service';

describe('RequestFactoryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RequestFactoryService = TestBed.get(RequestFactoryService);
    expect(service).toBeTruthy();
  });
});
