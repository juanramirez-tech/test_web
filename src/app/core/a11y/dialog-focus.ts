import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

@Directive({
  selector: '[appDialogFocus]',
})
export class DialogFocus implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previous: HTMLElement | null = null;

  ngAfterViewInit(): void {
    const active = document.activeElement;
    this.previous = active instanceof HTMLElement ? active : null;
    queueMicrotask(() => this.focusInitial());
  }

  ngOnDestroy(): void {
    this.previous?.focus();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }
    const nodes = this.focusable();
    if (nodes.length === 0) {
      event.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !this.host.nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && (active === last || !this.host.nativeElement.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusInitial(): void {
    const root = this.host.nativeElement;
    const preferred = root.querySelector<HTMLElement>('[data-autofocus]');
    (preferred ?? this.focusable()[0])?.focus();
  }

  private focusable(): HTMLElement[] {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (node) => !node.hasAttribute('disabled') && node.getAttribute('aria-hidden') !== 'true',
    );
  }
}
