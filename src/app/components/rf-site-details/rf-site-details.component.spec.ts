import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RfSiteDetailsComponent } from './rf-site-details.component';

describe('RfSiteDetailsComponent', () => {
  let component: RfSiteDetailsComponent;
  let fixture: ComponentFixture<RfSiteDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RfSiteDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RfSiteDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
