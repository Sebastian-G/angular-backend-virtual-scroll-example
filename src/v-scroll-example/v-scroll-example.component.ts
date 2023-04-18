import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { takeUntil } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { BackendService } from './backend.service';
import { PaginatedDataSource } from './pagination.data-source';

const PAGE_SIZE = 5;

@Component({
  selector: 'v-scroll-example',
  standalone: true,
  template: `
  <h1>Lazy loaded infinite scroll (POC)</h1>
        <div class="container">
            <cdk-virtual-scroll-viewport itemSize="50" class='example-viewport'>
                <div *cdkVirtualFor="let item of ds" class='example-item'>
                    <div class="page">{{item.page}}</div>
                    <pre>{{item.id}}</pre>
                </div>
                <div *ngIf="ds.loading$ | async" class='example-item loading'>loading...</div>
            </cdk-virtual-scroll-viewport>
        </div>
        <p>Max number of items per page <b>{{pageSize}}</b></p>
    `,
  imports: [CommonModule, ScrollingModule],
  providers: [BackendService],
})
export class VScrollExampleComponent<T extends { id: string; page: any } = any>
  implements AfterViewInit
{
  @ViewChild(CdkVirtualScrollViewport)
  private virtualScroll: CdkVirtualScrollViewport;

  readonly pageSize = PAGE_SIZE;
  readonly ds = new PaginatedDataSource<T>(PAGE_SIZE);

  ngAfterViewInit(): void {
    this.virtualScroll.scrolledIndexChange
      .pipe(
        // try to relax but take last
        debounceTime(100),
        // scrolled to bottom
        filter(() => this.virtualScroll.measureScrollOffset('bottom') === 0)
        // TODO: handle cancel subscription on destroy
        //  takeUntil(onDestroy$)
      )
      .subscribe(() => this.ds.loadMore());
  }
}
