import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagination-row" [class.align-right]="alignRight">
      <span class="page-info" *ngIf="showPagination">Página: {{ page }}/{{ totalPages }}</span>
      <div class="pagination-container">
        <div class="pagination" *ngIf="showPagination && totalPages > 0">
          <button type="button" (click)="goFirst()" [disabled]="!hasPreviousPage" title="Primeira">
            <img src="/first_page.svg" alt="Primeira" width="24" height="24" />
          </button>
          <button type="button" (click)="goPrevious()" [disabled]="!hasPreviousPage" title="Anterior">
            <img src="/backward_page.svg" alt="Anterior" width="24" height="24" />
          </button>
          <input type="number" [(ngModel)]="pageInput" (change)="onPageInputChange()" [min]="1" [max]="totalPages" [disabled]="totalCount === 0" />
          <button type="button" (click)="goNext()" [disabled]="!hasNextPage" title="Próxima">
            <img src="/forward_page.svg" alt="Próxima" width="24" height="24" />
          </button>
          <button type="button" (click)="goLast()" [disabled]="!hasNextPage" title="Última">
            <img src="/last_page.svg" alt="Última" width="24" height="24" />
          </button>
        </div>
        <button type="button" class="btn-novo" *ngIf="showNovo" (click)="novo.emit()" title="Novo">Novo</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .pagination-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; width: 100%; }
    .pagination-row.align-right { justify-content: space-between; }
    .page-info { font-size: 14px; color: #333; }
    .pagination-container { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .pagination { display: flex; align-items: center; gap: 8px; }
    .pagination button { padding: 6px; border: 1px solid #ddd; background: #fff; border-radius: 4px; cursor: pointer; }
    .pagination button:disabled, .pagination input:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination input { padding: 6px 12px; width: 50px; text-align: center; }
    .btn-novo { padding: 8px 16px; background: var(--app-accent, #0e7490); color: #fff; border: none; border-radius: 6px; cursor: pointer; }
  `]
})
export class PaginationComponent implements OnChanges {
  @Input() page = 1;
  @Input() totalPages = 0;
  @Input() totalCount = 0;
  @Input() hasPreviousPage = false;
  @Input() hasNextPage = false;
  @Input() showPagination = true;
  @Input() showNovo = true;
  @Input() alignRight = false;
  @Output() pageChange = new EventEmitter<number>();
  @Output() novo = new EventEmitter<void>();
  pageInput = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['page']) this.pageInput = this.page;
  }

  goFirst(): void { if (this.hasPreviousPage) this.pageChange.emit(1); }
  goPrevious(): void { if (this.hasPreviousPage) this.pageChange.emit(this.page - 1); }
  goNext(): void { if (this.hasNextPage) this.pageChange.emit(this.page + 1); }
  goLast(): void { if (this.hasNextPage) this.pageChange.emit(this.totalPages); }

  onPageInputChange(): void {
    const p = Math.max(1, Math.min(this.totalPages, Math.floor(Number(this.pageInput)) || 1));
    this.pageInput = p;
    this.pageChange.emit(p);
  }
}
