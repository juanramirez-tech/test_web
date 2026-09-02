import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminCourtsApi } from '../../../../core/api/admin-courts.api';
import { Court } from '../../../../core/api/api.models';
import { DialogFocus } from '../../../../core/a11y/dialog-focus';
import { PageMeta } from '../../../../core/seo/page-meta';
import { formatCop } from '../../../public/reservation/datetime';
import { apiMessage, courtStatusLabel, nextCourtStatus } from '../../admin-view';
import { AdminIcon } from '../../ui/admin-icon';
import { CourtFormDialog } from './court-form';

type LoadState = 'loading' | 'ready' | 'empty' | 'down';

type ConfirmAction = {
  type: 'toggle' | 'delete';
  court: Court;
};

@Component({
  selector: 'app-court-list',
  imports: [AdminIcon, CourtFormDialog, DialogFocus],
  templateUrl: './court-list.html',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class CourtList {
  private readonly api = inject(AdminCourtsApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly money = formatCop;
  readonly statusLabel = courtStatusLabel;

  readonly state = signal<LoadState>('loading');
  readonly error = signal<string | null>(null);
  readonly courts = signal<Court[]>([]);
  readonly busyId = signal<number | null>(null);
  readonly editorOpen = signal(false);
  readonly editing = signal<Court | null>(null);
  readonly pending = signal<ConfirmAction | null>(null);

  constructor() {
    inject(PageMeta).privatePage('Admin · Canchas');
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.error.set(null);
    this.api.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (courts) => {
        this.courts.set(courts);
        this.state.set(courts.length ? 'ready' : 'empty');
      },
      error: (error: unknown) => {
        this.state.set('down');
        this.error.set(apiMessage(error, 'No se pudieron cargar las canchas.'));
      },
    });
  }

  openCreate(): void {
    this.pending.set(null);
    this.editing.set(null);
    this.editorOpen.set(true);
  }

  openEdit(court: Court): void {
    this.pending.set(null);
    this.editing.set(court);
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    this.editorOpen.set(false);
    this.editing.set(null);
  }

  onSaved(court: Court): void {
    const next = this.upsert(court);
    this.courts.set(next);
    this.state.set(next.length ? 'ready' : 'empty');
    this.closeEditor();
  }

  askToggle(court: Court): void {
    this.pending.set({ type: 'toggle', court });
  }

  askDelete(court: Court): void {
    this.pending.set({ type: 'delete', court });
  }

  cancelPending(): void {
    this.pending.set(null);
  }

  confirmPending(): void {
    const action = this.pending();
    if (!action || this.busyId() === action.court.id) {
      return;
    }
    this.pending.set(null);
    if (action.type === 'toggle') {
      this.toggleStatus(action.court);
      return;
    }
    this.remove(action.court);
  }

  onEscape(): void {
    if (this.pending()) {
      this.cancelPending();
    }
  }

  private toggleStatus(court: Court): void {
    const next = nextCourtStatus(court.status);
    this.busyId.set(court.id);
    this.error.set(null);
    this.api.update(court.id, { status: next }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.courts.set(this.courts().map((item) => (item.id === updated.id ? updated : item)));
        this.busyId.set(null);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.error.set(apiMessage(error, 'No se pudo cambiar el estado.'));
      },
    });
  }

  private remove(court: Court): void {
    this.busyId.set(court.id);
    this.error.set(null);
    this.api.remove(court.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const next = this.courts().filter((item) => item.id !== court.id);
        this.courts.set(next);
        this.state.set(next.length ? 'ready' : 'empty');
        this.busyId.set(null);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.error.set(apiMessage(error, 'No se pudo eliminar la cancha.'));
      },
    });
  }

  private upsert(court: Court): Court[] {
    const current = this.courts();
    const exists = current.some((item) => item.id === court.id);
    const next = exists
      ? current.map((item) => (item.id === court.id ? court : item))
      : [...current, court];
    return next.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
