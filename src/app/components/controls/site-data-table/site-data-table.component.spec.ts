import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteDataTableComponent } from './site-data-table.component';

describe('SiteDataTableComponent', () => {
  let component: SiteDataTableComponent;
  let fixture: ComponentFixture<SiteDataTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SiteDataTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SiteDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
