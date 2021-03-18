import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportInterfaceComponent } from './export-interface.component';

describe('ExportInterfaceComponent', () => {
  let component: ExportInterfaceComponent;
  let fixture: ComponentFixture<ExportInterfaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExportInterfaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
