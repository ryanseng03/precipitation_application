import { TestBed } from '@angular/core/testing';

import { ExportManagerService } from './export-manager.service';

describe('ExportManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ExportManagerService = TestBed.get(ExportManagerService);
    expect(service).toBeTruthy();
  });
});
