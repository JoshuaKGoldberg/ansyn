import { Component, HostBinding, Inject, Input, OnInit } from '@angular/core';
import { IToolsState } from '../../reducers/tools.reducer';
import { Store } from '@ngrx/store';
import {
	GoToAction,
	GoToExpandAction,
	GoToInputChangeAction,
	PullActiveCenter,
	SetPinLocationModeAction
} from '../../actions/tools.actions';
import { Observable } from 'rxjs/Observable';
import { IToolsConfig, toolsConfig } from '../../models';
import { isEqual } from 'lodash';
import { convertByProjectionDatum, CoordinatesSystem } from '@ansyn/core/utils';
import 'rxjs/add/operator/pluck';
import { copyFromContent } from '@ansyn/core/utils/clipboard';

@Component({
	selector: 'ansyn-go-to',
	templateUrl: './go-to.component.html',
	styleUrls: ['./go-to.component.less']
})
export class GoToComponent implements OnInit {
	@Input() disabled: boolean;
	private _expand: boolean;
	public activeCenter: number[];
	public gotoExpand$: Observable<boolean> = this.store$.select<IToolsState>('tools')
		.pluck<IToolsState, boolean>('gotoExpand')
		.distinctUntilChanged();
	activeCenter$: Observable<number[]> = this.store$.select('tools')
		.pluck<any, any>('activeCenter')
		.distinctUntilChanged();

	activeCenterProjDatum: CoordinatesSystem = { datum: 'wgs84', projection: 'geo' };

	inputs = {
		from: [0, 0],
		to: []
	};

	pin_location_mode$: Observable<boolean> = this.store$.select('tools')
		.map((state: IToolsState) => state.flags.get('pin_location'))
		.distinctUntilChanged(isEqual);

	pin_location_mode: boolean;

	@HostBinding('class.expand')
	set expand(value) {
		this._expand = value;
	}

	get expand() {
		return this._expand;
	}

	get from(): CoordinatesSystem {
		return this.config.GoTo.from;
	}

	get to(): CoordinatesSystem {
		return this.config.GoTo.to;
	}

	ngOnInit(): void {
		this.activeCenter$.subscribe((_activeCenter) => {
			this.activeCenter = _activeCenter;
			this.inputs.from = convertByProjectionDatum(this.activeCenter, this.activeCenterProjDatum, this.from);
			this.inputs.to = convertByProjectionDatum(this.activeCenter, this.activeCenterProjDatum, this.to);
			this.dispatchInputUpdated(this.activeCenter, this.activeCenterProjDatum);
		});

		this.pin_location_mode$.subscribe((_pin_location_mode) => {
			this.pin_location_mode = _pin_location_mode;
		});

		this.gotoExpand$.subscribe((_gotoExpand) => {
			this.expand = _gotoExpand;
			if (this.expand) {
				this.store$.dispatch(new PullActiveCenter());
			}
		});
	}

	constructor(private store$: Store<IToolsState>, @Inject(toolsConfig) private config: IToolsConfig) {
	}

	submitGoTo(): void {
		const goToInput = convertByProjectionDatum(this.inputs.from, this.from, this.activeCenterProjDatum);
		this.store$.dispatch(new GoToAction(goToInput));
	}

	copyToClipBoard(value: string) {
		copyFromContent(value);
	}

	convert(coords, convertFrom: any, convertTo: any, inputKey: string) {
		this.inputs[inputKey] = convertByProjectionDatum(coords, convertFrom, convertTo);
		this.dispatchInputUpdated(coords, convertFrom);
	}

	togglePinLocation() {
		this.store$.dispatch(new SetPinLocationModeAction(!this.pin_location_mode));
	}

	close() {
		this.store$.dispatch(new GoToExpandAction(false));
	}

	private dispatchInputUpdated(coords: number[], convertFrom: CoordinatesSystem) {
		const toWgs84 = convertByProjectionDatum(coords, convertFrom, this.activeCenterProjDatum);
		this.store$.dispatch(new GoToInputChangeAction(toWgs84));
	}
}
