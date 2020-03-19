import { TestBed } from '@angular/core/testing';

import { ClassModificationService } from './class-modification.service';

describe('ClassModificationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ClassModificationService = TestBed.get(ClassModificationService);
    expect(service).toBeTruthy();
  });
});
