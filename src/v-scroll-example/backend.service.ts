import { Injectable } from '@angular/core';
import { defer, delay, Observable, of } from 'rxjs';

@Injectable()
export class BackendService {
  public fetchApi<T = any>(pageNumber = 0, pageSize = 50): Observable<T[]> {
    return defer(() => this.getResults(pageNumber, pageSize)).pipe(delay(1000));
  }

  private getResults<T = any>(pageNumber, pageSize): Observable<T[]> {
    let result = [];
    for (let i = 0; i < pageSize; i++)
      result.push({
        id: `ID-${pageNumber}-${i}`,
        page: pageNumber,
        innerIndex: i,
      });
    return of(result);
  }
}
