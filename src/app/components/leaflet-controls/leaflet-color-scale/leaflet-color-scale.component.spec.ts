import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafletColorScaleComponent } from './leaflet-color-scale.component';

describe('LeafletColorScaleComponent', () => {
  let component: LeafletColorScaleComponent;
  let fixture: ComponentFixture<LeafletColorScaleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeafletColorScaleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeafletColorScaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
