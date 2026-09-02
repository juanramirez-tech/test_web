import { Component } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { BookingStatus } from '../../../../core/api/api.models';
import { BookingRow } from '../../admin-view';
import { AdminIcon } from '../../ui/admin-icon';

export type BookingGridContext = {
  askConfirm(row: BookingRow): void;
  askCancel(row: BookingRow): void;
  openDetail(row: BookingRow): void;
};

@Component({
  selector: 'app-booking-guest-cell',
  template: `
    @if (row) {
      <div class="leading-tight">
        <p class="font-medium">{{ row.guest }}</p>
        <p class="mt-0.5 text-xs text-muted">{{ row.email }}</p>
      </div>
    }
  `,
})
export class BookingGuestCell implements ICellRendererAngularComp {
  protected row: BookingRow | undefined;

  agInit(params: ICellRendererParams<BookingRow>): void {
    this.row = params.data;
  }

  refresh(params: ICellRendererParams<BookingRow>): boolean {
    this.row = params.data;
    return true;
  }
}

@Component({
  selector: 'app-booking-status-cell',
  template: `
    @if (row) {
      <span
        class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
        [class]="chipClass(row.status)"
      >
        {{ row.statusLabel }}
      </span>
    }
  `,
})
export class BookingStatusCell implements ICellRendererAngularComp {
  protected row: BookingRow | undefined;

  agInit(params: ICellRendererParams<BookingRow>): void {
    this.row = params.data;
  }

  refresh(params: ICellRendererParams<BookingRow>): boolean {
    this.row = params.data;
    return true;
  }

  protected chipClass(status: BookingStatus): string {
    switch (status) {
      case 'pending_payment':
        return 'bg-amber-100 text-amber-950';
      case 'paid':
        return 'bg-lime/60 text-pitch';
      case 'confirmed':
        return 'bg-turf/15 text-turf';
      case 'cancelled':
        return 'bg-sand text-muted';
      case 'expired':
        return 'bg-red-50 text-red-800';
      default:
        return 'bg-sand text-muted';
    }
  }
}

@Component({
  selector: 'app-booking-actions-cell',
  imports: [AdminIcon],
  template: `
    @if (row) {
      <div class="flex items-center justify-end gap-1">
        @if (row.canConfirm) {
          <button
            type="button"
            class="rounded-lg p-1.5 text-pitch hover:bg-lime/50"
            title="Confirmar"
            aria-label="Confirmar"
            (click)="confirm(); $event.stopPropagation()"
          >
            <app-admin-icon name="check" class="text-base" />
          </button>
        }
        @if (row.canCancel) {
          <button
            type="button"
            class="rounded-lg p-1.5 text-red-800 hover:bg-red-50"
            title="Cancelar"
            aria-label="Cancelar"
            (click)="cancel(); $event.stopPropagation()"
          >
            <app-admin-icon name="close" class="text-base" />
          </button>
        }
        <button
          type="button"
          class="rounded-lg p-1.5 text-muted hover:bg-sand hover:text-pitch"
          title="Ver detalle"
          aria-label="Ver detalle"
          (click)="open(); $event.stopPropagation()"
        >
          <app-admin-icon name="eye" class="text-base" />
        </button>
      </div>
    }
  `,
})
export class BookingActionsCell implements ICellRendererAngularComp {
  protected row: BookingRow | undefined;
  private params!: ICellRendererParams<BookingRow, unknown, BookingGridContext>;

  agInit(params: ICellRendererParams<BookingRow, unknown, BookingGridContext>): void {
    this.params = params;
    this.row = params.data;
  }

  refresh(params: ICellRendererParams<BookingRow, unknown, BookingGridContext>): boolean {
    this.params = params;
    this.row = params.data;
    return true;
  }

  protected confirm(): void {
    if (this.row) {
      this.params.context.askConfirm(this.row);
    }
  }

  protected cancel(): void {
    if (this.row) {
      this.params.context.askCancel(this.row);
    }
  }

  protected open(): void {
    if (this.row) {
      this.params.context.openDetail(this.row);
    }
  }
}
