import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PagedResult } from '../../core/models/paged-result';
import { AtividadeEconomicaService } from './atividadeeconomica.service';
import { AtividadeEconomica } from './atividadeeconomica.model';

@Component({
  selector: 'app-atividadeeconomica-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="list-page">
      <div class="list-header">
        <h2>Atividade Econômica</h2>
        <div class="filter-row">
          <label>Filtro:</label>
          <input type="text" [(ngModel)]="filterText" (keyup.enter)="applyFilter()" />
          <button type="button" class="btn-filtrar" (click)="applyFilter()">Filtrar</button>
        </div>
        <div class="top-actions">
          <app-pagination
            [page]="page" [totalPages]="totalPages" [totalCount]="totalCount"
            [hasPreviousPage]="paged?.hasPreviousPage ?? false" [hasNextPage]="paged?.hasNextPage ?? false"
            (novo)="goNovo()" [showPagination]="false" [showNovo]="true" [alignRight]="true" />
        </div>
      </div>
      <div class="table-scroll-wrapper">
        <div class="table-container">
          <table *ngIf="paged?.items?.length; else empty">
            <thead><tr><th>Código</th><th>Descrição</th></tr></thead>
            <tbody>
              <tr *ngFor="let item of paged?.items" (click)="goEdit(item)" class="row-click">
                <td>{{ item.codigoTipoAtividadeEconomica }}</td><td>{{ item.descricao }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #empty><p *ngIf="!loading" class="empty">Nenhum registro encontrado.</p></ng-template>
        </div>
      </div>
      <div class="list-footer">
        <app-pagination
          [page]="page" [totalPages]="totalPages" [totalCount]="totalCount"
          [hasPreviousPage]="paged?.hasPreviousPage ?? false" [hasNextPage]="paged?.hasNextPage ?? false"
          (pageChange)="loadPage($event)" [showPagination]="true" [showNovo]="false" [alignRight]="true" />
      </div>
    </div>
  `
})
export class AtividadeEconomicaListComponent implements OnInit {
  paged: PagedResult<AtividadeEconomica> | null = null;
  loading = false;
  page = 1;
  pageSize = 20;
  filterText = '';
  get totalCount(): number { return this.paged?.totalCount ?? 0; }
  get totalPages(): number { return this.paged?.totalPages ?? 0; }

  constructor(private service: AtividadeEconomicaService, private router: Router) {}

  ngOnInit(): void { this.loadPage(1); }

  applyFilter(): void { this.page = 1; this.loadPage(1); }

  loadPage(p: number): void {
    this.page = p;
    this.loading = true;
    const f = this.filterText.trim().length >= 3 ? this.filterText.trim() : undefined;
    this.service.getPaged(this.page, this.pageSize, f).subscribe({
      next: (r) => { this.paged = r; this.loading = false; },
      error: () => {
        this.paged = { items: [], totalCount: 0, page: 1, pageSize: this.pageSize, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
        this.loading = false;
      }
    });
  }

  goNovo(): void { this.router.navigate(['/atividadeeconomica', 'novo']); }
  goEdit(item: AtividadeEconomica): void {
    this.router.navigate(['/atividadeeconomica', item.codigoTipoAtividadeEconomica]);
  }
}
