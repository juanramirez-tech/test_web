import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminCourtsApi } from '../../../../core/api/admin-courts.api';
import { Court, SlotMinutes } from '../../../../core/api/api.models';
import { DialogFocus } from '../../../../core/a11y/dialog-focus';
import { AdminIcon } from '../../ui/admin-icon';
import {
  apiMessage,
  clockInput,
  courtFormError,
  emptyCourtForm,
  toCourtWrite,
} from '../../admin-view';

@Component({
  selector: 'app-court-form-dialog',
  imports: [ReactiveFormsModule, AdminIcon, DialogFocus],
  templateUrl: './court-form.html',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class CourtFormDialog implements OnInit {
  private readonly api = inject(AdminCourtsApi);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly court = input<Court | null>(null);
  readonly saved = output<Court>();
  readonly closed = output<void>();

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    description: ['', Validators.maxLength(512)],
    slot_minutes: this.fb.nonNullable.control<SlotMinutes>(60),
    price_per_hour: [0, [Validators.required, Validators.min(0)]],
    opens_at: ['08:00', Validators.required],
    closes_at: ['22:00', Validators.required],
    timezone: ['America/Bogota', [Validators.required, Validators.maxLength(64)]],
    status: this.fb.nonNullable.control<'active' | 'inactive'>('active'),
  });

  ngOnInit(): void {
    const court = this.court();
    if (court) {
      this.patch(court);
      return;
    }
    this.form.reset(emptyCourtForm());
  }

  protected get isCreate(): boolean {
    return this.court() === null;
  }

  protected close(): void {
    if (this.saving()) {
      return;
    }
    this.closed.emit();
  }

  save(): void {
    this.error.set(null);
    const value = this.form.getRawValue();
    const parsed = {
      ...value,
      price_per_hour: Number(value.price_per_hour),
    };
    const invalid = courtFormError(parsed);
    if (invalid) {
      this.error.set(invalid);
      return;
    }

    const body = toCourtWrite(parsed);
    const current = this.court();
    this.saving.set(true);
    const request = current ? this.api.replace(current.id, body) : this.api.create(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (court) => {
        this.saving.set(false);
        this.saved.emit(court);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(apiMessage(error, 'No se pudo guardar la cancha.'));
      },
    });
  }

  private patch(court: Court): void {
    this.form.patchValue({
      name: court.name,
      description: court.description ?? '',
      slot_minutes: court.slot_minutes,
      price_per_hour: Number(court.price_per_hour),
      opens_at: clockInput(court.opens_at),
      closes_at: clockInput(court.closes_at),
      timezone: court.timezone,
      status: court.status,
    });
  }
}
