import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import {
  CdkVirtualScrollViewport,
  ScrollDispatcher,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  BehaviorSubject,
  firstValueFrom,
  Observable,
  of,
  ReplaySubject,
  shareReplay,
  startWith,
  Subject,
  Subscription,
  take,
  withLatestFrom,
} from 'rxjs';
import {
  debounceTime,
  filter,
  map,
  pairwise,
  scan,
  tap,
  throttleTime,
} from 'rxjs/operators';
import { BackendService } from './backend.service';

@Component({
  selector: 'v-scroll-example',
  standalone: true,
  template: `
  <div class="container" >
      <cdk-virtual-scroll-viewport itemSize="50" class='example-viewport'>
            <div *cdkVirtualFor="let item of ds" class='example-item'>
              <div>{{item.page}}</div>
              <div>{{item.id}}</div>
            </div>
            <div *ngIf="ds.loading$ | async" class='example-item loading'>loading...</div>
      </cdk-virtual-scroll-viewport>
      <!-- <pre>{{ searchResults$ | async | json}}</pre> -->
  </div>
  `,
  imports: [CommonModule, ScrollingModule],
  providers: [BackendService],
})
export class VScrollExampleComponent<T extends { id: string } = any>
  implements AfterViewInit
{
  @ViewChild(CdkVirtualScrollViewport)
  private virtualScroll: CdkVirtualScrollViewport;

  readonly pagesize = 5;
  readonly ds = new PaginatedDataSource<T>(this.pagesize);

  constructor(
    private cd: ChangeDetectorRef // private backendService: BackendService
  ) {}

  ngAfterViewInit(): void {
    this.virtualScroll.scrolledIndexChange
      .pipe(
        debounceTime(100),
        // scrolled to bottom
        filter(() => this.virtualScroll.measureScrollOffset('bottom') === 0)
      )
      .subscribe(() => this.ds.loadMore());
  }
}

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

  connect(collectionViewer: CollectionViewer): Observable<T[]> {
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

  private _getPageForIndex(index: number): number {
    return Math.floor(index / this.pageSize);
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
