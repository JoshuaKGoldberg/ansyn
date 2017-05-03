import { Action } from '@ngrx/store';
import { Case } from '../models/case.model';

export const CasesActionTypes = {
  LOAD_CASES: 'LOAD_CASES',
  LOAD_CASES_SUCCESS: 'LOAD_CASES_SUCCESS',

  ADD_CASE: 'ADD_CASE',
  ADD_CASE_SUCEESS: 'ADD_CASE_SUCEESS',

  DELETE_CASE: 'DELETE_CASE',
  DELETE_CASE_SUCCESS: 'DELETE_CASE_SUCCESS',

  UPDATE_CASE: 'UPDATE_CASE',
  UPDATE_CASE_SUCCESS: 'UPDATE_CASE_SUCCESS',

  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',

  SELECT_CASE: 'SELECT_CASE'
};

export type CasesActions = any;

export class LoadCasesAction implements Action{
  type = CasesActionTypes.LOAD_CASES;
  constructor(public payload?: Case[]){}
}
export class LoadCasesSuccessAction implements Action{
  type = CasesActionTypes.LOAD_CASES_SUCCESS;
  constructor(public payload: Case[]){}
}

export class AddCaseAction implements Action{
  type = CasesActionTypes.ADD_CASE;
  constructor(public payload: Case){}
}

export class AddCaseSuccessAction implements Action{
  type = CasesActionTypes.ADD_CASE_SUCEESS;
  constructor(public payload: Case){}
}

export class UpdateCaseAction implements Action{
  type = CasesActionTypes.UPDATE_CASE;
  constructor(public payload: Case){}
}
export class UpdateCaseSuccessAction implements Action{
  type = CasesActionTypes.UPDATE_CASE_SUCCESS;
  constructor(public payload: Case){}
}

export class DeleteCaseAction implements Action{
  type = CasesActionTypes.DELETE_CASE;
  constructor(public payload?: Case){}
}

export class DeleteCaseSuccessAction implements Action{
  type = CasesActionTypes.DELETE_CASE_SUCCESS;
  constructor(public payload?: any){}
}

export class OpenModalAction implements Action{
  type = CasesActionTypes.OPEN_MODAL;
  constructor(public payload: {component: any, case_id?: string}){}
}
export class CloseModalAction implements Action{
  type = CasesActionTypes.CLOSE_MODAL;
  constructor(public payload?: any){}
}
export class SelectCaseAction implements Action{
  type = CasesActionTypes.SELECT_CASE;
  constructor(public payload: string){}
}
