import { MatDateFormats } from '@angular/material/core';

/** Exibição dd/mm/aaaa nos campos Material (locale pt-BR). */
export const CAMPO_DATA_FORMATS: MatDateFormats = {
  parse: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' }
  },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' }
  }
};
