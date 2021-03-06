import { FilterMetadata } from '../models/metadata/filter-metadata.interface';
import {
	FiltersActionTypes,
	InitializeFiltersAction,
	InitializeFiltersSuccessAction
} from '../actions/filters.actions';
import { IFiltersState } from '../reducer/filters.reducer';
import { FiltersService } from '../services/filters.service';
import { Filter } from '../models/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/share';
import { Injectable } from '@angular/core';
import { GenericTypeResolverService, InjectionResolverFilter } from '@ansyn/core';
import { Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import { SetBadgeAction } from '@ansyn/menu/actions/menu.actions';
import { EnumFilterMetadata } from '../models/metadata/enum-filter-metadata';

export const facetChangesActionType = [FiltersActionTypes.INITIALIZE_FILTERS_SUCCESS, FiltersActionTypes.UPDATE_FILTER_METADATA, FiltersActionTypes.RESET_FILTERS, FiltersActionTypes.TOGGLE_ONLY_FAVORITES];

@Injectable()
export class FiltersEffects {

	@Effect()
	initializeFilters$: Observable<InitializeFiltersSuccessAction> = this.actions$
		.ofType(FiltersActionTypes.INITIALIZE_FILTERS)
		.withLatestFrom(this.store$.select('filters'))
		.switchMap(([action, filtersState]: [InitializeFiltersAction, IFiltersState]) => {
			return this.filtersService.loadFilters().map((filters: Filter[]) => {
				const filterMetadatas: Map<Filter, FilterMetadata> = new Map<Filter, FilterMetadata>();
				const oldFiltersArray = filtersState.oldFilters ? Array.from(filtersState.oldFilters) : [];

				filters.forEach((filter: Filter) => {
					const metadata: FilterMetadata = this.initializeMetadata(filter, action.payload.facets);

					action.payload.overlays.forEach((overlay: any) => {
						metadata.accumulateData(overlay[filter.modelName]);
					});

					// Check if filters were previously deselected, and if so deselect them now
					if (oldFiltersArray) {
						const oldFilterArray = oldFiltersArray
							.find(([oldFilterKey, oldFilter]: [Filter, FilterMetadata]) => oldFilterKey.modelName === filter.modelName);


						if (oldFilterArray) {
							const [oldFilterKey, oldFilter] = oldFilterArray;
							const oldFilterFields = oldFilter.enumsFields;
							const filterFields = metadata.enumsFields;

							filterFields.forEach((value, key) => {
								let isChecked = true;
								if (oldFilterFields.has(key)) {
									const oldFilter = oldFilterFields.get(key);
									if (!oldFilter.isChecked) {
										isChecked = false;
									}
								}
								value.isChecked = isChecked;
							});
						}
					}

					// If show all is set, select all
					if (action.payload.showAll) {
						metadata.showAll();
					}

					filterMetadatas.set(filter, metadata);
				});

				return new InitializeFiltersSuccessAction(filterMetadatas);
			});
		}).share();

	@Effect()
	updateFiltersBadge$: Observable<any> = this.actions$
		.ofType(...facetChangesActionType)
		.withLatestFrom(this.store$
			.select<IFiltersState>('filters')
			.pluck <IFiltersState, Map<Filter, FilterMetadata>>('filters'))
		.map(([action, filters]) => filters)
		.map((filters: Map<Filter, FilterMetadata>) => {
			const enumFilterValues = Array.from(filters.values())
				.filter(value => value instanceof EnumFilterMetadata) as EnumFilterMetadata[];
			const badge = enumFilterValues.reduce((badgeNum: number, { enumsFields }) => {
				const someUnchecked = Array.from(enumsFields.values()).some(({ isChecked }) => !isChecked);
				return someUnchecked ? badgeNum + 1 : badgeNum;
			}, 0);
			return new SetBadgeAction({ key: 'Filters', badge });
		})
		.share();

	constructor(private actions$: Actions,
				private filtersService: FiltersService,
				private store$: Store<IFiltersState>,
				private genericTypeResolverService: GenericTypeResolverService) {
	}

	initializeMetadata(filter: Filter, facets: { filters: { fieldName: string, metadata: any }[] }): FilterMetadata {
		const resolveFilterFunction: InjectionResolverFilter = (function wrapperFunction() {
			const filterType = filter.type;

			return function resolverFilteringFunction(FilterMetadatas: FilterMetadata[]): FilterMetadata {
				return FilterMetadatas.find((item) => item.type === filterType);
			};
		})();

		const metaData: FilterMetadata =
			this.genericTypeResolverService.resolveMultiInjection(FilterMetadata, resolveFilterFunction, false);

		if (facets && !facets.filters) {
			facets.filters = [];
		}

		const currentFilterInit = facets.filters.find(field => {
			return field.fieldName === filter.modelName;
		});

		metaData.initializeFilter(currentFilterInit && currentFilterInit.metadata);

		return metaData;
	}
}

