import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, RowClickedEvent, ValueFormatterParams } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import { AdminBookingsApi } from '../../../../core/api/admin-bookings.api';
import { AdminBookingQuery, Booking, BookingStatus } from '../../../../core/api/api.models';
import { PageMeta } from '../../../../core/seo/page-meta';
import { formatCop } from '../../../public/reservation/datetime';
import { adminGridLocale, adminGridTheme } from '../../admin-grid';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUSES,
  BookingRow,
  apiMessage,
  toBookingRow,
} from '../../admin-view';
import { AdminIcon } from '../../ui/admin-icon';
import {
  BookingActionsCell,
  BookingGridContext,
  BookingGuestCell,
  BookingStatusCell,
} from './booking-grid-cells';
import { BookingDetailDialog } from './booking-detail';

const PAGE_SIZE = 100;

type ConfirmAction = {
  type: 'confirm' | 'cancel';
  row: BookingRow;
};

@Component({
  selector: 'app-booking-list',
  imports: [FormsModule, AgGridAngular, AdminIcon, BookingDetailDialog],
  templateUrl: './booking-list.html',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class BookingList implements BookingGridContext {
  private readonly bookingsApi = inject(AdminBookingsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statuses = BOOKING_STATUSES;
  protected readonly statusLabel = BOOKING_STATUS_LABEL;
  protected readonly theme = adminGridTheme;
  protected readonly localeText = adminGridLocale;

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  readonly bookings = signal<Booking[]>([]);
  readonly rows = signal<BookingRow[]>([]);
  readonly total = signal(0);
  readonly counts = signal<Record<BookingStatus, number>>({
    pending_payment: 0,
    paid: 0,
    confirmed: 0,
    cancelled: 0,
    expired: 0,
  });
  readonly pending = signal<ConfirmAction | null>(null);
  readonly busyId = signal<number | null>(null);
  readonly selected = signal<Booking | null>(null);

  status: BookingStatus | '' = '';
  date = '';
  quickFilter = '';

  readonly defaultColDef: ColDef<BookingRow> = {
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    flex: 1,
    minWidth: 120,
  };

  readonly columnDefs: ColDef<BookingRow>[] = [
    {
      field: 'guest',
      headerName: 'Invitado',
      filter: 'agTextColumnFilter',
      minWidth: 180,
      cellRenderer: BookingGuestCell,
    },
    {
      field: 'phone',
      headerName: 'Teléfono',
      filter: 'agTextColumnFilter',
      minWidth: 130,
      maxWidth: 150,
    },
    {
      field: 'statusLabel',
      headerName: 'Estado',
      filter: 'agTextColumnFilter',
      minWidth: 150,
      maxWidth: 170,
      cellRenderer: BookingStatusCell,
    },
    {
      field: 'court',
      headerName: 'Cancha',
      filter: 'agTextColumnFilter',
      minWidth: 150,
    },
    {
      field: 'playDate',
      headerName: 'Día',
      filter: 'agDateColumnFilter',
      minWidth: 130,
      maxWidth: 150,
      valueFormatter: (params) => params.data?.playDateLabel ?? '—',
    },
    {
      field: 'slot',
      headerName: 'Horario',
      filter: 'agTextColumnFilter',
      minWidth: 150,
    },
    {
      field: 'total',
      headerName: 'Total',
      filter: 'agNumberColumnFilter',
      minWidth: 110,
      maxWidth: 130,
      valueFormatter: (params: ValueFormatterParams<BookingRow, number>) =>
        params.value == null ? '' : formatCop(Number(params.value)),
    },
    {
      field: 'followUp',
      headerName: 'Seguimiento',
      filter: 'agTextColumnFilter',
      minWidth: 190,
    },
    {
      colId: 'actions',
      headerName: '',
      minWidth: 118,
      maxWidth: 118,
      sortable: false,
      filter: false,
      floatingFilter: false,
      resizable: false,
      cellRenderer: BookingActionsCell,
    },
  ];

  readonly gridOptions: GridOptions<BookingRow> = {
    animateRows: true,
    pagination: true,
    paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    suppressCellFocus: true,
    rowHeight: 52,
    headerHeight: 40,
    floatingFiltersHeight: 40,
    context: this,
    getRowId: (params) => String(params.data.id),
    onRowClicked: (event: RowClickedEvent<BookingRow>) => {
      const target = event.event?.target;
      if (target instanceof Element && target.closest('button')) {
        return;
      }
      if (event.data) {
        this.openDetail(event.data);
      }
    },
  };

  constructor() {
    inject(PageMeta).privatePage('Admin · Reservas');
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('reserva'));
      if (Number.isInteger(id) && id > 0) {
        if (this.selected()?.id !== id) {
          this.openById(id);
        }
        return;
      }
      if (!params.get('reserva')) {
        this.selected.set(null);
      }
    });
    this.loadCounts();
    this.load();
  }

  selectStatus(status: BookingStatus | ''): void {
    this.status = status;
    this.load();
  }

  protected allTotal(): number {
    return BOOKING_STATUSES.reduce((sum, status) => sum + this.counts()[status], 0);
  }

  applyFilters(): void {
    this.load();
  }

  askConfirm(row: BookingRow): void {
    this.pending.set({ type: 'confirm', row });
  }

  askCancel(row: BookingRow): void {
    this.pending.set({ type: 'cancel', row });
  }

  openDetail(row: BookingRow): void {
    const booking = this.bookings().find((item) => item.id === row.id);
    if (booking) {
      this.selected.set(booking);
    } else {
      this.openById(row.id);
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { reserva: row.id },
      queryParamsHandling: 'merge',
    });
  }

  closeDetail(): void {
    this.selected.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { reserva: null },
      queryParamsHandling: 'merge',
    });
  }

  onBookingSaved(booking: Booking): void {
    const previous = this.bookings().find((item) => item.id === booking.id);
    this.afterUpdate(booking, previous?.status ?? booking.status, booking.status);
  }

  onEscape(): void {
    if (this.pending()) {
      this.cancelPending();
      return;
    }
    if (this.selected()) {
      this.closeDetail();
    }
  }

  cancelPending(): void {
    this.pending.set(null);
  }

  confirmPending(): void {
    const action = this.pending();
    if (!action || this.busyId() === action.row.id) {
      return;
    }
    this.pending.set(null);
    if (action.type === 'confirm') {
      this.confirm(action.row);
      return;
    }
    this.cancel(action.row);
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: AdminBookingQuery = { limit: PAGE_SIZE, offset: 0 };
    if (this.status) {
      query.status = this.status;
    }
    if (this.date) {
      query.date = this.date;
    }

    this.bookingsApi.list(query).subscribe({
      next: (result) => {
        this.bookings.set(result.bookings);
        this.rows.set(result.bookings.map((booking) => toBookingRow(booking)));
        this.total.set(result.total);
        this.loading.set(false);
        const selectedId = this.selected()?.id;
        if (selectedId) {
          const fresh = result.bookings.find((item) => item.id === selectedId);
          if (fresh) {
            this.selected.set(fresh);
          }
        }
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(apiMessage(error, 'No se pudieron cargar las reservas.'));
      },
    });
  }

  private loadCounts(): void {
    forkJoin({
      pending_payment: this.bookingsApi.list({ status: 'pending_payment', limit: 1 }),
      paid: this.bookingsApi.list({ status: 'paid', limit: 1 }),
      confirmed: this.bookingsApi.list({ status: 'confirmed', limit: 1 }),
      cancelled: this.bookingsApi.list({ status: 'cancelled', limit: 1 }),
      expired: this.bookingsApi.list({ status: 'expired', limit: 1 }),
    }).subscribe({
      next: (result) => {
        this.counts.set({
          pending_payment: result.pending_payment.total,
          paid: result.paid.total,
          confirmed: result.confirmed.total,
          cancelled: result.cancelled.total,
          expired: result.expired.total,
        });
      },
    });
  }

  private confirm(row: BookingRow): void {
    this.busyId.set(row.id);
    this.error.set(null);
    this.bookingsApi.confirm(row.id).subscribe({
      next: (updated) => this.afterUpdate(updated, row.status, updated.status),
      error: (error: unknown) => {
        this.busyId.set(null);
        this.error.set(apiMessage(error, 'No se pudo confirmar la reserva.'));
      },
    });
  }

  private cancel(row: BookingRow): void {
    this.busyId.set(row.id);
    this.error.set(null);
    this.bookingsApi.cancel(row.id).subscribe({
      next: (updated) => this.afterUpdate(updated, row.status, updated.status),
      error: (error: unknown) => {
        this.busyId.set(null);
        this.error.set(apiMessage(error, 'No se pudo cancelar la reserva.'));
      },
    });
  }

  private afterUpdate(updated: Booking, from: BookingStatus, to: BookingStatus): void {
    const nextRow = toBookingRow(updated);
    this.bookings.set(this.bookings().map((item) => (item.id === updated.id ? updated : item)));
    this.rows.set(this.rows().map((item) => (item.id === updated.id ? nextRow : item)));
    if (from !== to) {
      this.counts.update((current) => ({
        ...current,
        [from]: Math.max(0, current[from] - 1),
        [to]: current[to] + 1,
      }));
    }
    if (this.selected()?.id === updated.id) {
      this.selected.set(updated);
    }
    this.busyId.set(null);
  }

  private openById(id: number): void {
    const local = this.bookings().find((item) => item.id === id);
    if (local) {
      this.selected.set(local);
      return;
    }
    this.bookingsApi
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (booking) => this.selected.set(booking),
        error: (error: unknown) => {
          this.error.set(apiMessage(error, 'No se pudo cargar la reserva.'));
        },
      });
  }
}
