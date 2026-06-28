import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ComboboxOption {
  value: number | string;
  label: string;
}

/** RT-Gerais 07 — combobox digitável com filtro e paginação (>15 itens). */
@Component({
  selector: 'app-combobox-customizada',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cb-wrap" [class.cb-wrap--disabled]="disabled">
      <input
        type="text"
        class="cb-input"
        [(ngModel)]="search"
        (focus)="open = true; onSearch()"
        (input)="onSearch()"
        [placeholder]="placeholder"
        [disabled]="disabled"
        autocomplete="off" />
      <button type="button" class="cb-clear" *ngIf="value != null && !disabled" (click)="clear()" tabindex="-1">×</button>
      <div class="cb-panel" *ngIf="open && !disabled">
        <div class="cb-option" *ngFor="let o of visibleOptions" (mousedown)="select(o)">{{ o.label }}</div>
        <div class="cb-empty" *ngIf="!visibleOptions.length">Nenhum registro</div>
        <div class="cb-pager" *ngIf="totalPages > 1">
          <button type="button" (mousedown)="$event.preventDefault(); prev()" [disabled]="page <= 1">‹</button>
          <span>{{ page }}/{{ totalPages }}</span>
          <button type="button" (mousedown)="$event.preventDefault(); next()" [disabled]="page >= totalPages">›</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cb-wrap { position: relative; width: 100%; }
    .cb-input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
    .cb-clear { position: absolute; right: 8px; top: 8px; border: none; background: transparent; cursor: pointer; font-size: 18px; }
    .cb-panel {
      position: absolute; z-index: 50; left: 0; right: 0; max-height: 220px; overflow: auto;
      background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 8px 24px rgba(15,23,42,.12);
    }
    .cb-option { padding: 8px 12px; cursor: pointer; }
    .cb-option:hover { background: #e0f2fe; }
    .cb-empty { padding: 12px; color: #64748b; }
    .cb-pager { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 6px; border-top: 1px solid #e2e8f0; }
    .cb-wrap--disabled .cb-input { background: #f1f5f9; }
  `]
})
export class ComboboxCustomizadaComponent implements OnChanges {
  @Input() options: ComboboxOption[] = [];
  @Input() value: number | string | null | undefined = null;
  @Input() disabled = false;
  @Input() placeholder = 'Digite para filtrar...';
  @Input() pageSize = 15;
  @Output() valueChange = new EventEmitter<number | string | null>();

  search = '';
  open = false;
  page = 1;
  filtered: ComboboxOption[] = [];

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get visibleOptions(): ComboboxOption[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['value']) this.syncSearchFromValue();
    if (changes['options']) this.onSearch();
  }

  onSearch(): void {
    const q = this.search.trim().toLowerCase();
    this.filtered = !q
      ? [...this.options]
      : this.options.filter(o => o.label.toLowerCase().includes(q));
    this.page = 1;
  }

  select(o: ComboboxOption): void {
    this.value = o.value;
    this.search = o.label;
    this.valueChange.emit(o.value);
    this.open = false;
  }

  clear(): void {
    this.value = null;
    this.search = '';
    this.valueChange.emit(null);
  }

  prev(): void { if (this.page > 1) this.page--; }
  next(): void { if (this.page < this.totalPages) this.page++; }

  private syncSearchFromValue(): void {
    if (this.value == null) { this.search = ''; return; }
    const found = this.options.find(o => o.value === this.value);
    this.search = found?.label ?? String(this.value);
  }
}
