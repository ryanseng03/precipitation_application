import { TestBed } from '@angular/core/testing';

import { ErrorPopupService } from './error-popup.service';

describe('ErrorPopupService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ErrorPopupService = TestBed.get(ErrorPopupService);
    expect(service).toBeTruthy();
  });
});
