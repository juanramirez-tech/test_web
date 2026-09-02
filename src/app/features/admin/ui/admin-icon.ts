import { Component, input } from '@angular/core';

export type AdminIconName =
  | 'plus'
  | 'pencil'
  | 'trash'
  | 'power'
  | 'clock'
  | 'close'
  | 'court'
  | 'alert'
  | 'check'
  | 'eye'
  | 'search'
  | 'phone';

@Component({
  selector: 'app-admin-icon',
  template: `
    <svg
      class="size-[1em]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @switch (name()) {
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('pencil') {
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        }
        @case ('trash') {
          <path d="M4 7h16" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
          <path d="M10 11v6M14 11v6" />
        }
        @case ('power') {
          <path d="M12 3v9" />
          <path d="M7.5 6.5a7 7 0 1 0 9 0" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 1.5" />
        }
        @case ('close') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ('court') {
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M12 5v14M4 12h16" />
        }
        @case ('alert') {
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 4.2 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
        }
        @case ('check') {
          <path d="M5 12l5 5L20 7" />
        }
        @case ('eye') {
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        }
        @case ('phone') {
          <path
            d="M7 3h3l1.5 3.5-2 1.5a12 12 0 0 0 6 6l1.5-2L21 14v3a2 2 0 0 1-2 2A16 16 0 0 1 3 7a2 2 0 0 1 2-2Z"
          />
        }
      }
    </svg>
  `,
  host: {
    class: 'inline-flex shrink-0 items-center justify-center',
    'aria-hidden': 'true',
  },
})
export class AdminIcon {
  readonly name = input.required<AdminIconName>();
}
