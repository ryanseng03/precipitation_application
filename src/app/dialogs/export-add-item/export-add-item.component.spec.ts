import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportAddItemComponent } from './export-add-item.component';

describe('ExportAddItemComponent', () => {
  let component: ExportAddItemComponent;
  let fixture: ComponentFixture<ExportAddItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExportAddItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportAddItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
