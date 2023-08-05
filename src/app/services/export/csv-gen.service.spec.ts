import { TestBed } from '@angular/core/testing';

import { CsvGenService } from './csv-gen.service';

describe('CsvGenService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CsvGenService = TestBed.get(CsvGenService);
    expect(service).toBeTruthy();
  });
});
