import { Injectable } from '@angular/core';
import { defer, Observable, of } from 'rxjs';

@Injectable()
export class BackendService {
  public fetchApi<T = any>(pageNumber = 0, pageSize = 50): Observable<T[]> {
    return defer(() => this.getResults(pageNumber, pageSize));
  }

  private getResults<T = any>(pageNumber, pageSize): Observable<T[]> {
    let result = [];
    for (let i = 0; i < pageSize; i++)
      result.push(`i=${i + 1}; page=${pageNumber}; pageSize=${pageSize}`);
    return of(result);
  }
}
