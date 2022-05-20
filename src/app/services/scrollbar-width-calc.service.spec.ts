import { TestBed } from '@angular/core/testing';

import { ScrollbarWidthCalcService } from './scrollbar-width-calc.service';

describe('ScrollbarWidthCalcService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ScrollbarWidthCalcService = TestBed.get(ScrollbarWidthCalcService);
    expect(service).toBeTruthy();
  });
});
