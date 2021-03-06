import { layersConfig } from '@ansyn/menu-items/layers-manager';
import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { LayersManagerModule } from '../../layers-manager.module';
import { LayersManagerComponent } from './layers-manager.component';
import { StoreModule } from '@ngrx/store';
import { DataLayersService } from '../../services/data-layers.service';
import { LayersReducer } from '../../reducers/layers.reducer';
import { HttpClientModule } from '@angular/common/http';

describe('LayersManagerComponent', () => {
	let component: LayersManagerComponent;
	let fixture: ComponentFixture<LayersManagerComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				LayersManagerModule,
				HttpClientModule,
				StoreModule.provideStore({ layers: LayersReducer })
			],
			providers: [{ provide: layersConfig, useValue: { layersByCaseIdUrl: null } }]
		})
			.compileComponents();
	}));

	beforeEach(inject([DataLayersService], (_dataLayersService: DataLayersService) => {
		spyOn(_dataLayersService, 'getAllLayersInATree');
		fixture = TestBed.createComponent(LayersManagerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}));

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
