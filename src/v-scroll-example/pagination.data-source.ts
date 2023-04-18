import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import { BackendService } from './backend.service';

export class PaginatedDataSource<T> extends DataSource<T> {
  private readonly backendService: BackendService = inject(BackendService);

  private _fetchedPages = new Set<number>();
  private readonly _dataStream = new BehaviorSubject<T[]>([]);

  private readonly loadingState = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingState
    .asObservable()
    .pipe(shareReplay());

  constructor(private pageSize = 100) {
    super();
  }

  connect(_: CollectionViewer): Observable<T[]> {
    console.log('connect');
    this.fetchPage(0);
    return this._dataStream;
  }

  loadMore(): void {
    const lastFetchedPage: number = [...this._fetchedPages.values()].sort(
      // required to sort a list of numbers
      (a, b) => a - b
    )[this._fetchedPages.size - 1];
    console.log('loadMore, next page is', lastFetchedPage + 1);
    this.fetchPage(lastFetchedPage + 1);
  }

  disconnect() {
    this._dataStream.complete();
    this.loadingState.complete();
  }

  private fetchPage(page: number) {
    console.log(
      'fetch Page',
      page,
      '; ',
      this._fetchedPages.has(page) ? 'is present' : 'will load',
      '; listing of all fetched pages',
      [...this._fetchedPages.values()]
    );
    if (this._fetchedPages.has(page)) {
      return;
    }
    this.loadingState.next(true);
    this._fetchedPages.add(page);
    this.backendService.fetchApi(page, this.pageSize).subscribe({
      next: (nextPageData) => {
        this._dataStream.next([
          ...this._dataStream.getValue(),
          ...nextPageData,
        ]);
      },
      complete: () => this.loadingState.next(false),
    });
  }
}
