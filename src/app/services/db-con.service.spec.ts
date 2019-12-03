import { TestBed } from '@angular/core/testing';

import { DbConService } from './db-con.service';

describe('DbConService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DbConService = TestBed.get(DbConService);
    expect(service).toBeTruthy();
  });
});
