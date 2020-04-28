import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteAvailabilityTableComponent } from './site-availability-table.component';

describe('SiteAvailabilityTableComponent', () => {
  let component: SiteAvailabilityTableComponent;
  let fixture: ComponentFixture<SiteAvailabilityTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SiteAvailabilityTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SiteAvailabilityTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
