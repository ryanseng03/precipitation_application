import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavTilesComponent } from './nav-tiles.component';

describe('NavTilesComponent', () => {
  let component: NavTilesComponent;
  let fixture: ComponentFixture<NavTilesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavTilesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavTilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
