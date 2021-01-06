import { TestBed } from '@angular/core/testing';

import { CustomColorSchemeService } from './custom-color-scheme.service';

describe('CustomColorSchemeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CustomColorSchemeService = TestBed.get(CustomColorSchemeService);
    expect(service).toBeTruthy();
  });
});
