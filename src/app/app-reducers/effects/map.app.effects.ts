import { Injectable,Inject } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import { OverlaysActionTypes } from '@ansyn/overlays/actions/overlays.actions';
import { Overlay } from '@ansyn/overlays/models/overlay.model';
import { ImageryCommunicatorService } from '@ansyn/imagery';
import { LayersActionTypes, SelectLayerAction, UnselectLayerAction } from '@ansyn/menu-items/layers-manager/actions/layers.actions';
import { IAppState } from '../';
import { BaseSourceProvider } from '@ansyn/imagery';
import { Case, ICasesState, CasesService, UpdateCaseAction } from '@ansyn/menu-items/cases';
import { MapActionTypes, PositionChangedAction, StartMapShadowAction ,StopMapShadowAction ,CompositeMapShadowAction, ActiveMapChangedAction } from '@ansyn/map-facade';
import { isEmpty,cloneDeep } from 'lodash';
import { ToolsActionsTypes } from '@ansyn/menu-items/tools';
import '@ansyn/core/utils/clone-deep';
import 'rxjs/add/operator/withLatestFrom';
import '@ansyn/core/utils/clone-deep';
import { OverlaysService, DisplayOverlayAction } from "@ansyn/overlays";
import { IStatusBarState } from "@ansyn/status-bar/reducers/status-bar.reducer";
import { UpdateStatusFlagsAction, statusBarFlagsItems } from "@ansyn/status-bar";
import { LoadOverlaysAction } from '@ansyn/overlays/actions/overlays.actions';
import { BackToWorldAction, AddMapInstacneAction, SynchronizeMapsAction } from '@ansyn/map-facade/actions/map.actions';
import { OverlaysMarkupAction } from '@ansyn//overlays/actions/overlays.actions';
import { CasesActionTypes } from '@ansyn/menu-items/cases/actions/cases.actions';
import { calcGeoJSONExtent, isExtentContainedInPolygon } from '@ansyn/core/utils';
import { IOverlayState } from '@ansyn/overlays/reducers/overlays.reducer';
import { CenterMarkerPlugin } from '@ansyn/open-layer-center-marker-plugin';
import { Position, CaseMapState } from '@ansyn/core';

@Injectable()
export class MapAppEffects {

	@Effect()
	onMapSingleClick$: Observable<any> = this.actions$
		.ofType(MapActionTypes.MAP_SINGLE_CLICK)
		.withLatestFrom(this.store$.select('cases'), this.store$.select('status_bar') , (action:UpdateStatusFlagsAction,caseState:ICasesState ,statusBarState:IStatusBarState) => [action,caseState,statusBarState])
		.filter(([action,caseState,statusBarState]:[UpdateStatusFlagsAction,ICasesState ,IStatusBarState]): any => statusBarState.flags.get(statusBarFlagsItems.pinPointSearch))
		.mergeMap(([action,caseState,statusBarState]:[UpdateStatusFlagsAction,ICasesState ,IStatusBarState]) => {

			//create the region
			const region = this.overlaysService.getPolygonByPoint(action.payload.lonLat).geometry;

			//draw on all maps
			this.communicator.communicatorsAsArray().forEach( communicator => {
				if(statusBarState.flags.get(statusBarFlagsItems.pinPointIndicator)) {
					communicator.addPinPointIndicator(action.payload.lonLat);
				}
				//this is for the others communicators
				communicator.removeSingleClickEvent();
			});

			//draw the point on the map // all maps
			const selectedCase = {...caseState.selected_case, state: {...caseState.selected_case.state, region:region}};

			return [
				//disable the pinpoint search
				new UpdateStatusFlagsAction({key: statusBarFlagsItems.pinPointSearch, value: false}),
				//update case
				new UpdateCaseAction(selectedCase),
				//load overlays
				new LoadOverlaysAction({
					to: selectedCase.state.time.to,
					from: selectedCase.state.time.from,
					polygon: selectedCase.state.region,
					caseId: selectedCase.id
				})
			];
		});

	@Effect()
	onStartMapShadow$: Observable<StartMapShadowAction> = this.actions$
		.ofType(ToolsActionsTypes.START_MOUSE_SHADOW)
		.map(() => new StartMapShadowAction());

	@Effect()
	onEndMapShadow$: Observable<StopMapShadowAction> = this.actions$
		.ofType(ToolsActionsTypes.STOP_MOUSE_SHADOW)
		.map(() => new StopMapShadowAction());

	@Effect({ dispatch: false })
	onDisplayOverlay$: Observable<void> = this.actions$
		.ofType(OverlaysActionTypes.DISPLAY_OVERLAY)
		.withLatestFrom(this.store$.select('overlays'), this.store$.select('cases'), (action: DisplayOverlayAction, overlaysState: IOverlayState, casesState: ICasesState) => {
			const overlay = overlaysState.overlays.get(action.payload.id);
			const map_id = action.payload.map_id ? action.payload.map_id : casesState.selected_case.state.maps.active_map_id;
			const active_map = casesState.selected_case.state.maps.data.find((map)=> map.id === map_id);
			return [overlay, map_id, active_map.data.position];
		})
		.map( ([overlay, map_id, position]:[Overlay, string, Position]) => {

			let extent;
			const isInside = isExtentContainedInPolygon(position.boundingBox, overlay.footprint);
			if(isInside) {
				extent = position.boundingBox;
			} else {
				extent = calcGeoJSONExtent(overlay.footprint);
			}

			const communicator = this.communicator.provide(map_id);
			const mapType = communicator.ActiveMap.mapType;
			const sourceLoader = this.baseSourceProviders.find((item) => {return (item.mapType===mapType && item.sourceType === overlay.sourceType)}); // assuming that there is one provider
			sourceLoader.createAsync(overlay).then((layer)=> {
				communicator.setLayer(layer, extent);
			});
		});

	@Effect({ dispatch: false })
	addVectorLayer$: Observable<void> = this.actions$
		.ofType(LayersActionTypes.SELECT_LAYER)
		.withLatestFrom(this.store$.select("cases"))
		.map(([action, state]: [SelectLayerAction, ICasesState]) => {
			return [action, state.selected_case.state.maps.active_map_id];
		})
		.map(([action, active_map_id]: [SelectLayerAction, string]) => {
			const imagery = this.communicator.provide(active_map_id);
			imagery.addVectorLayer(action.payload);
		}).share();

	@Effect({ dispatch: false })
	removeVectorLayer$: Observable<void> = this.actions$
		.ofType(LayersActionTypes.UNSELECT_LAYER)
		.withLatestFrom(this.store$.select('cases'))
		.map(([action, state]: [UnselectLayerAction, ICasesState])=> [action, state.selected_case.state.maps.active_map_id])
		.map(([action, active_map_id]: [UnselectLayerAction, string]) => {
			let imagery = this.communicator.provide(active_map_id);
			imagery.removeVectorLayer(action.payload);
		}).share();

	@Effect()
	positionChanged$: Observable<UpdateCaseAction> = this.actions$
		.ofType(MapActionTypes.POSITION_CHANGED)
		.withLatestFrom(this.store$.select('cases'))
		.filter(([action, state]: [PositionChangedAction, ICasesState]) => {
			const selected_map_index = state.selected_case.state.maps.data.findIndex((map) => map.id === action.payload.id);
			return !isEmpty(state.selected_case) && selected_map_index !== -1;
		})
		.cloneDeep()
		.map( ([action, state]: [PositionChangedAction, ICasesState]) => {
			const selected_case: Case = state.selected_case;
			const selected_map_index = selected_case.state.maps.data.findIndex((map) => map.id === action.payload.id);
			const selected_map = selected_case.state.maps.data[selected_map_index];
			selected_map.data.position = action.payload.position;
			selected_case.state.maps.data[selected_map_index] = selected_map;

			return new UpdateCaseAction(selected_case);
		});

	@Effect()
	onCommunicatorChange$: Observable<any> = this.actions$
		.ofType(MapActionTypes.ADD_MAP_INSTANCE,MapActionTypes.REMOVE_MAP_INSTACNE)
		.withLatestFrom(this.store$.select("cases"))
		.filter(([action, caseState]:[Action,ICasesState]) => {
			const communicatorsIds = action.payload.communicatorsIds;
			return communicatorsIds.length > 1 && communicatorsIds.length === caseState.selected_case.state.maps.data.length;
		})
		.map(() => new CompositeMapShadowAction());

	@Effect({dispatch:false})
	onAddCommunicatorShowPinPoint$: Observable<any> = this.actions$
		.ofType(MapActionTypes.ADD_MAP_INSTANCE)
		.withLatestFrom(this.store$.select("cases"), this.store$.select("status_bar"))
		.filter(([action, caseState, statusBarState]:[any, any, any]) => statusBarState.flags.get(statusBarFlagsItems.pinPointIndicator) || statusBarState.flags.get(statusBarFlagsItems.pinPointSearch))
		.map(([action, caseState, statusBarState]:[any, any, any]) => {
			const communicatorHandler = this.communicator.provide(action.payload.currentCommunicatorId);

			if(statusBarState.flags.get(statusBarFlagsItems.pinPointIndicator)) {
				const point = this.overlaysService.getPointByPolygon(caseState.selected_case.state.region);
				communicatorHandler.addPinPointIndicator(point.coordinates);
			}

			if(statusBarState.flags.get(statusBarFlagsItems.pinPointSearch)) {
				communicatorHandler.createMapSingleClickEvent();
			}

		} );

	@Effect({dispatch:false})
	onAddCommunicatorInitPluggin$: Observable<any> = this.actions$
		.ofType(MapActionTypes.ADD_MAP_INSTANCE)
		.map((action: AddMapInstacneAction)=> {
			// Init CenterMarkerPlugin
			const communicatorHandler = this.communicator.provide(action.payload.currentCommunicatorId);
			const centerMarkerPluggin = communicatorHandler.getPlugin(CenterMarkerPlugin.s_pluginType);
			if (centerMarkerPluggin) {
				centerMarkerPluggin.init(communicatorHandler);
			}
		});

	@Effect({dispatch:false})
	onSelectCaseByIdAddPinPointIndicatore$: Observable<any> = this.actions$
		.ofType(CasesActionTypes.SELECT_CASE_BY_ID)
		.withLatestFrom(this.store$.select("cases"),this.store$.select("status_bar"))
		.filter(([action,caseState,statusBarState]:[any,any,any]) => statusBarState.flags.get(statusBarFlagsItems.pinPointIndicator))
		.map(([action,caseState,statusBarState]:[any,any,any]) => {
			const point = this.overlaysService.getPointByPolygon(caseState.selected_case.state.region);
			this.communicator.communicatorsAsArray().forEach(c => {
				c.addPinPointIndicator(point.coordinates);
			});
		});

	@Effect()
	onActiveMapChanges$: Observable<Action> = this.actions$
		.ofType(MapActionTypes.ACTIVE_MAP_CHANGED)
		.withLatestFrom(this.store$.select("cases"))
		.filter(([action, caseState]:[ActiveMapChangedAction,ICasesState]): any =>
			caseState.selected_case.state.maps.active_map_id !== action.payload
		)
		.mergeMap(([action,caseState]:[ActiveMapChangedAction,ICasesState]) => {
			const updatedCase = cloneDeep(caseState.selected_case);
			updatedCase.state.maps.active_map_id = action.payload;

			return [
				new UpdateCaseAction(updatedCase),
				new OverlaysMarkupAction(this.casesService.getOverlaysMarkup(updatedCase))
			];

		});

	@Effect({dispatch:false})
	onSynchronizeAppMaps$: Observable<any> = this.actions$
		.ofType(MapActionTypes.SYNCHRONIZE_MAPS)
		.withLatestFrom(this.store$.select("cases"), (action: SynchronizeMapsAction, casesState: ICasesState) => {
			return [casesState];
		})
		.map(([casesState]: [ICasesState]) => {
			const active_map = casesState.selected_case.state.maps.data.find((map)=> map.id === casesState.selected_case.state.maps.active_map_id);
			casesState.selected_case.state.maps.data.forEach((mapItem: CaseMapState)=> {
				if (active_map.id !== mapItem.id) {
					const comm = this.communicator.provide(mapItem.id);
					comm.setPosition(active_map.data.position);
				}
			});
		});

	@Effect()
	backToWorldView$: Observable<any> = this.actions$
		.ofType(MapActionTypes.BACK_TO_WORLD)
		.withLatestFrom(this.store$.select("cases"), (action: BackToWorldAction, casesState: ICasesState) => {
			const mapId = action.payload.mapId ? action.payload.mapId : casesState.selected_case.state.maps.active_map_id;
			return [action, casesState, mapId];
		})
		.mergeMap(([action, caseState, mapId]:[BackToWorldAction, ICasesState, string]) => {
			const active_map = caseState.selected_case.state.maps.data.find((map)=> map.id === mapId);
			const comm = this.communicator.provide(mapId);
			comm.loadInitialMapSource(active_map.data.position.boundingBox);

			const updatedCase = cloneDeep(caseState.selected_case);
			updatedCase.state.maps.data.forEach(
				(map) => {
					if(map.id === mapId){
						map.data.overlay = null;
					}
				});
			return [
				new UpdateCaseAction(updatedCase),
				new OverlaysMarkupAction(this.casesService.getOverlaysMarkup(updatedCase))
			];
		});

	constructor(
		private actions$: Actions,
		private casesService: CasesService,
		private store$: Store<IAppState>,
		private communicator: ImageryCommunicatorService,
		@Inject(BaseSourceProvider) private baseSourceProviders: BaseSourceProvider[],
		private overlaysService: OverlaysService
	) { }
}
