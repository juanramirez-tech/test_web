import { themeQuartz } from 'ag-grid-community';
import './ag-grid.setup';

export const adminGridTheme = themeQuartz.withParams({
  accentColor: '#0f3d2e',
  backgroundColor: '#ffffff',
  foregroundColor: '#14221c',
  borderColor: '#d9d3c7',
  headerBackgroundColor: '#f4f1ea',
  headerTextColor: '#5c6b63',
  fontFamily: 'inherit',
  borderRadius: 10,
  spacing: 8,
});

export const adminGridLocale = {
  filterOoo: 'Filtrar…',
  equals: 'Igual a',
  notEqual: 'Distinto de',
  contains: 'Contiene',
  notContains: 'No contiene',
  startsWith: 'Empieza por',
  endsWith: 'Termina en',
  blank: 'Vacío',
  notBlank: 'No vacío',
  lessThan: 'Menor que',
  greaterThan: 'Mayor que',
  inRange: 'Entre',
  searchOoo: 'Buscar…',
  noRowsToShow: 'No hay reservas',
  page: 'Página',
  more: 'Más',
  to: 'a',
  of: 'de',
  next: 'Siguiente',
  last: 'Última',
  first: 'Primera',
  previous: 'Anterior',
  pageSizeSelectorLabel: 'Filas',
  ariaPageSizeSelectorLabel: 'Tamaño de página',
};
