import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from "@angular/http";
import { Observable } from "rxjs";
import "rxjs/add/operator/map";
import { Case } from '../models/case.model';

@Injectable()
export class CasesService {
  base_url = 'http://localhost:9001/api/v1/cases';
  LIMIT:number = 15;

  constructor(private http: Http) {}

  loadCases(last_id: string = '-1'): Observable<any> {
    return this.http.get(`${this.base_url}/pagination/${last_id}?limit=${this.LIMIT}`).map(res => res.json())
  }

  createCase(selected_case:Case): Observable<Case> {
    let url:string = `${this.base_url}`;
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let body:string = JSON.stringify(selected_case);
    let options = new RequestOptions({ headers});
    return this.http.post(url, body, options).map(res => res.json());
  }

  updateCase(selected_case: Case): Observable<Case> {
    let url:string = `${this.base_url}`;
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let body:string = JSON.stringify(selected_case);
    let options = new RequestOptions({ headers});
    return this.http.put (url, body, options).map(res => res.json());;
  }

  removeCase(selected_case_id:string): Observable<any>  {
    let url:string = `${this.base_url}/${selected_case_id}`;
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers});
    return this.http.delete(url, options).map(res => res.json());;
  }

}