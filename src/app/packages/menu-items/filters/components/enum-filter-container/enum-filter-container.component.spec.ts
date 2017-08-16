import { EnumFilterMetadata } from './../../models/metadata/enum-filter-metadata';
import { StoreModule } from '@ngrx/store';
import { FiltersReducer } from '../../reducer/filters.reducer';
import { FiltersModule } from './../../filters.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { filtersConfig } from '../../services/filters.service';
import { EnumFilterContainerComponent } from './enum-filter-container.component';

describe('EnumFilterContainerComponent', () => {
  let component: EnumFilterContainerComponent;
  let fixture: ComponentFixture<EnumFilterContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FiltersModule, StoreModule.provideStore({ filters: FiltersReducer })],
			providers: [
				{ provide: filtersConfig, useValue: null }
			]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnumFilterContainerComponent);
    component = fixture.componentInstance;
    component.metadata = new EnumFilterMetadata();
    
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
