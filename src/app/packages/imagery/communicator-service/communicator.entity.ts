import { EventEmitter } from '@angular/core';
import { ImageryComponentManager } from '../imagery-component/manager/imagery.component.manager';

import * as _ from 'lodash';
import { IMapPlugin } from '../model/imap-plugin';
import { Extent } from '../model/extent';
import { IMap } from '../model/imap';
import { MapPosition } from '../model/map-position';

/**
 * Created by AsafMasa on 27/04/2017.
 */

export class CommunicatorEntity {
	private _manager: ImageryComponentManager;
	private _managerSubscriptions;

	public positionChanged: EventEmitter<{id: string, position: MapPosition}>;
	public centerChanged: EventEmitter<GeoJSON.Point>;

	constructor(private _id: string) {
		this.centerChanged = new EventEmitter<GeoJSON.Point>();
		this.positionChanged = new EventEmitter<{id: string, position: MapPosition}>();
	}

	private registerToManagerEvents() {
		this._managerSubscriptions.push(this._manager.centerChanged.subscribe((center: GeoJSON.Point) => {
			this.centerChanged.emit(center);
		}));
		this._managerSubscriptions.push(this._manager.positionChanged.subscribe((position: MapPosition ) => {
			this.positionChanged.emit({id: this._id, position});
		}));
	}

	private unregisterToManagerEvents() {
		for (let i = 0; i < this._managerSubscriptions.length; i++) {
			this._managerSubscriptions[i].unsubscribe();
		}
		this._managerSubscriptions = [];
	}

	public dispose() {
		this.unregisterToManagerEvents();
	}

	//CommunicatorEntity methods begin

	public init(manager: ImageryComponentManager) {
		this._manager = manager;
		this._managerSubscriptions = [];
		this.registerToManagerEvents();
	}
	public setActiveMap(mapType: string) {
		this._manager.setActiveMap(mapType);
	}

	public getActiveMapObject(): IMap {
		return this._manager.getMapObject();
	}

	public getCenter(): GeoJSON.Point {
		return this._manager.getMapCenter();
	}
	public updateSize(): void {
		if (!this._manager) {
			console.warn(`'id ${this._id}', can't update size communicator manager is not set'`);
			return;
		}
		return this._manager.updateSize();
	}
	public addGeojsonLayer(data: GeoJSON.GeoJsonObject) {
		return this._manager.addGeojsonLayer(data);
	}
	public setBoundingView(boundingRectangle: GeoJSON.MultiPolygon) {
		this._manager.setBoundingView(boundingRectangle);
	}

	public setCenter(center: GeoJSON.Point, animation ?: boolean) {
		const animate = (_.isNil(animation)) ? true : animation;
		this._manager.setCenter(center, animate);
	}

	public setPosition(position: MapPosition) {
		this._manager.setPosition(position);
	}

	public getPlugin(pluginName: string): IMapPlugin {
		const existingPlugins = this._manager.getPlugins();
		let pluginResult: IMapPlugin = existingPlugins.find((plugin: IMapPlugin) => plugin.pluginType === pluginName);
		return pluginResult;
	}

	public setLayer(layer: any, extent?: Extent) {
		this._manager.setLayer(layer, extent);
	}

	public addLayer(layer: any) {
		this._manager.addLayer(layer);
	}

	public removeLayer(layer: any) {
		this._manager.removeLayer(layer);
	}

    public addVectorLayer(layer: any): void {
		this._manager.addVectorLayer(layer);
	}

	public removeVectorLayer(layer: any): void {
		this._manager.removeVectorLayer(layer);
	}

	//CommunicatorEntity methods end
}