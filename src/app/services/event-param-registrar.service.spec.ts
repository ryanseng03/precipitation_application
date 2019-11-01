import { TestBed } from '@angular/core/testing';

import { EventParamRegistrarService } from './event-param-registrar.service';

describe('EventParamRegistrarService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EventParamRegistrarService = TestBed.get(EventParamRegistrarService);
    expect(service).toBeTruthy();
  });
});
