import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { IAppState } from '../app.reducers.module';
import { Observable } from 'rxjs';
import { ActionTypes } from '@ansyn/timeline/actions/timeline.actions';
import { CasesService } from '@ansyn/menu-items/cases';
import { ICasesState } from '@ansyn/menu-items/cases';
import { Case } from '@ansyn/menu-items/cases';
import { UpdateCaseSuccessAction } from '@ansyn/menu-items/cases';

@Injectable()
export class CasesAppEffects{

	constructor(private actions$: Actions, private store$: Store<IAppState>, private casesService: CasesService) {}

	@Effect()
	selectOverlay$: Observable<Action> = this.actions$
		.ofType(ActionTypes.SELECT_OVERLAY)
		.withLatestFrom(this.store$.select('cases'))
		.switchMap( ([action, state]: [{payload: any}, ICasesState]) => {
			let selected_case: Case = state.cases.find((case_value) =>  case_value.id == state.selected_case_id);
			selected_case.state.selected_overlay_id = action.payload;
			return this.casesService.updateCase(selected_case).map((updated_case) => {
				return new UpdateCaseSuccessAction(updated_case);
			});
		});


}