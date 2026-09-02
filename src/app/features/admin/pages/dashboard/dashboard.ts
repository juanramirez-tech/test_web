import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, RowClickedEvent } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import { AdminBookingsApi } from '../../../../core/api/admin-bookings.api';
import { AdminCourtsApi } from '../../../../core/api/admin-courts.api';
import { Booking, BookingStatus } from '../../../../core/api/api.models';
import { PageMeta } from '../../../../core/seo/page-meta';
import { formatCop } from '../../../public/reservation/datetime';
import { adminGridLocale, adminGridTheme } from '../../admin-grid';
import { BOOKING_STATUS_LABEL, apiMessage, formatAdminDateTime } from '../../admin-view';

type LoadState = 'loading' | 'ready' | 'down';

export type RecentBookingRow = {
  id: number;
  guest: string;
  email: string;
  status: string;
  total: number;
  created: Date;
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule, AgGridAngular],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly courtsApi = inject(AdminCourtsApi);
  private readonly bookingsApi = inject(AdminBookingsApi);
  private readonly router = inject(Router);

  readonly money = formatCop;
  readonly when = formatAdminDateTime;
  readonly statusLabel = BOOKING_STATUS_LABEL;

  readonly state = signal<LoadState>('loading');
  readonly error = signal<string | null>(null);
  readonly courtTotal = signal(0);
  readonly courtsActive = signal(0);
  readonly courtsInactive = signal(0);
  readonly bookingCounts = signal<Record<BookingStatus, number>>({
    pending_payment: 0,
    paid: 0,
    confirmed: 0,
    cancelled: 0,
    expired: 0,
  });
  readonly recent = signal<Booking[]>([]);
  readonly rows = signal<RecentBookingRow[]>([]);
  quickFilter = '';

  readonly theme = adminGridTheme;
  readonly localeText = adminGridLocale;

  readonly defaultColDef: ColDef<RecentBookingRow> = {
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    flex: 1,
    minWidth: 140,
  };

  readonly columnDefs: ColDef<RecentBookingRow>[] = [
    {
      field: 'guest',
      headerName: 'Invitado',
      filter: 'agTextColumnFilter',
      minWidth: 160,
    },
    {
      field: 'email',
      headerName: 'Correo',
      filter: 'agTextColumnFilter',
      minWidth: 180,
    },
    {
      field: 'status',
      headerName: 'Estado',
      filter: 'agTextColumnFilter',
      maxWidth: 180,
    },
    {
      field: 'total',
      headerName: 'Total',
      filter: 'agNumberColumnFilter',
      maxWidth: 140,
      valueFormatter: (params) => (params.value == null ? '' : formatCop(Number(params.value))),
    },
    {
      field: 'created',
      headerName: 'Creada',
      filter: 'agDateColumnFilter',
      minWidth: 170,
      valueFormatter: (params) =>
        params.value instanceof Date ? formatAdminDateTime(params.value.toISOString()) : '',
    },
  ];

  readonly gridOptions: GridOptions<RecentBookingRow> = {
    animateRows: true,
    pagination: true,
    paginationPageSize: 8,
    paginationPageSizeSelector: [8, 20, 50],
    suppressCellFocus: true,
    rowHeight: 44,
    headerHeight: 40,
    floatingFiltersHeight: 40,
    getRowId: (params) => String(params.data.id),
    onRowClicked: (event: RowClickedEvent<RecentBookingRow>) => {
      const id = event.data?.id;
      if (id) {
        void this.router.navigate(['/admin/bookings'], { queryParams: { reserva: id } });
      }
    },
  };

  constructor() {
    inject(PageMeta).privatePage('Admin · Panel');
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.error.set(null);

    forkJoin({
      courts: this.courtsApi.list(),
      recent: this.bookingsApi.list({ limit: 50 }),
      pending_payment: this.bookingsApi.list({ status: 'pending_payment', limit: 1 }),
      paid: this.bookingsApi.list({ status: 'paid', limit: 1 }),
      confirmed: this.bookingsApi.list({ status: 'confirmed', limit: 1 }),
      cancelled: this.bookingsApi.list({ status: 'cancelled', limit: 1 }),
      expired: this.bookingsApi.list({ status: 'expired', limit: 1 }),
    }).subscribe({
      next: (result) => {
        this.courtTotal.set(result.courts.length);
        this.courtsActive.set(result.courts.filter((court) => court.status === 'active').length);
        this.courtsInactive.set(result.courts.filter((court) => court.status === 'inactive').length);
        this.bookingCounts.set({
          pending_payment: result.pending_payment.total,
          paid: result.paid.total,
          confirmed: result.confirmed.total,
          cancelled: result.cancelled.total,
          expired: result.expired.total,
        });
        this.recent.set(result.recent.bookings);
        this.rows.set(result.recent.bookings.map((booking) => this.toRow(booking)));
        this.state.set('ready');
      },
      error: (error: unknown) => {
        this.state.set('down');
        this.error.set(apiMessage(error, 'No se pudo cargar el panel.'));
      },
    });
  }

  private toRow(booking: Booking): RecentBookingRow {
    return {
      id: booking.id,
      guest: booking.guest_name,
      email: booking.guest_email,
      status: BOOKING_STATUS_LABEL[booking.status],
      total: Number(booking.total_amount),
      created: new Date(booking.createdAt),
    };
  }
}
