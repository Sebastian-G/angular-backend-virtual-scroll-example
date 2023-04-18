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
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  BehaviorSubject,
  firstValueFrom,
  of,
  take,
  withLatestFrom,
} from 'rxjs';
import { debounceTime, filter, map, tap, throttleTime } from 'rxjs/operators';
import { BackendService } from './backend.service';

@Component({
  selector: 'v-scroll-example',
  standalone: true,
  template: `
  <button (click)="click()">click to fetch initial data</button>
  <div class="container" >
      <cdk-virtual-scroll-viewport itemSize="4" class='example-viewport'>
        <ng-container *ngIf="searchResults$ | async as searchResults">
            <li *cdkVirtualFor="let item of searchResults; let i = index; trackBy: trackByIdx" class='example-item'>
              {{ item | json }}
            </li>
        </ng-container>
      </cdk-virtual-scroll-viewport>
      <!-- <pre>{{ searchResults$ | async | json}}</pre> -->
  </div>
  `,
  imports: [CommonModule, ScrollingModule],
  providers: [BackendService],
})
export class VScrollExampleComponent<T = any> implements OnInit, AfterViewInit {
  @ViewChild(CdkVirtualScrollViewport)
  private virtualScroll: CdkVirtualScrollViewport;

  private searchPageNumber: number;
  private searchResultSubject = new BehaviorSubject<T[]>([]);
  readonly searchResults$ = this.searchResultSubject.asObservable();
  pagesize = 50;

  constructor(
    private backendService: BackendService,
    private cd: ChangeDetectorRef
  ) {
    this.searchPageNumber = 0;
  }

  ngOnInit(): void {
    this.searchResultSubject
      .pipe(tap((it) => console.log('searchResults length', it.length)))
      .subscribe(() => {
        this.cd.detectChanges();
      });
  }

  ngAfterViewInit(): void {
    this.virtualScroll.scrolledIndexChange
      .pipe(
        debounceTime(100),
        map(() => this.virtualScroll.measureScrollOffset('bottom')),
        // scrolled to bottom
        filter((bottomOffset) => bottomOffset === 0),
        // only if not empty source
        filter(() => !!this.searchResultSubject.getValue()?.length)
      )
      .subscribe((bottomOffset) => {
        this.searchPageNumber++;
        this.nextSearchPage(this.searchPageNumber);
        console.log(
          'scrolledIndexChange -> bottomOffset:',
          bottomOffset,
          this.virtualScroll.getRenderedRange()
        );
      });

    // this.scrollDispatcher
    //   .scrolled()
    //   .pipe(
    //     filter(
    //       (event) =>
    //         this.virtualScroll.getRenderedRange().end ===
    //         this.virtualScroll.getDataLength()
    //     )
    //   )
    //   .subscribe((event) => {
    //     // console.log(
    //     //   'new result append; ',
    //     //   'next render range:',
    //     //   this.virtualScroll.getRenderedRange()
    //     // );
    //     // this.searchPageNumber++;
    //     // this.nextSearchPage(this.searchPageNumber);
    //   });
    //this.scrollDispatcher.register(this.scrollable);
    //this.scrollDispatcher.scrolled(1000)
    //    .subscribe((viewport: CdkVirtualScrollViewport) => {
    //        console.log('scroll triggered', viewport);
    //    });

    // this.virtualScroll.renderedRangeStream.subscribe((range) => {
    //   console.log('range', range);
    //   console.log('range2', this.virtualScroll.getRenderedRange());
    //   if (this.virtualScroll.getRenderedRange().end % 10 === 0) {
    //     this.nextSearchPage(++this.searchPageNumber);
    //   }
    // });
  }

  nextSearchPage(pageNumber: number): void {
    this.backendService
      .fetchApi<T>(pageNumber, this.pagesize)
      .pipe(
        tap((it) => console.log('nextpage results', it)),
        withLatestFrom(this.searchResults$),
        map(([newPages, oldLoadedPages]: [T[], T[]]) => [
          ...oldLoadedPages,
          ...newPages,
        ])
      )
      .subscribe((it) => this.searchResultSubject.next(it));
  }

  click(): void {
    this.searchPageNumber = 0;
    this.backendService
      .fetchApi(this.searchPageNumber, this.pagesize)
      .pipe(take(1))
      .subscribe(this.searchResultSubject);
  }

  trackByIdx(i: number) {
    return i;
  }
}
