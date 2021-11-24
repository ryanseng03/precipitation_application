import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafletLayerControlExtensionComponent } from './leaflet-layer-control-extension.component';

describe('LeafletLayerControlExtensionComponent', () => {
  let component: LeafletLayerControlExtensionComponent;
  let fixture: ComponentFixture<LeafletLayerControlExtensionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeafletLayerControlExtensionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeafletLayerControlExtensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
