import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
  computed,
  effect,
  signal,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuOption, clamp } from '../foundation/mobile.js';
import { NeuButtonComponent } from '../button/button.js';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';
import { NEU_EDIT, NEU_CLOSE } from '../foundation/icons.js';
import {
  isoDate,
  todayISO,
  monthCells,
  shiftMonth,
} from '../foundation/calendar.js';

/** App-owned calendar entry. date uses the local calendar date YYYY-MM-DD. */
export interface NeuCalendarEvent extends NeuOption {
  readonly date: string;
}

@Component({
  selector: 'neu-calendar',
  imports: [View, Text, Pressable, NeuButtonComponent, NeuIconButtonComponent],
  template: `<view class="stack"
    ><view class="row"
      ><pressable
        class="calendar-navigation"
        accessibilityRole="button"
        [accessibilityLabel]="backLabel()"
        [disabled]="disabled() || !canShift(-1)"
        (press)="shift(-1)"
        ><text class="title">‹</text></pressable
      >
      <view class="row grow calendar-heading">
        <pressable
          accessibilityRole="button"
          [disabled]="disabled()"
          [accessibilityState]="{ expanded: view() === 'months' }"
          (press)="showMonths()"
          class="calendar-heading-action"
        >
          <text class="title">{{ monthLabel() }}</text>
        </pressable>
        <pressable
          accessibilityRole="button"
          [disabled]="disabled()"
          [accessibilityState]="{ expanded: view() === 'years' }"
          (press)="showYears()"
          class="calendar-heading-action"
        >
          <text class="title">{{ year() }}</text>
        </pressable>
      </view>
      <pressable
        class="calendar-navigation"
        accessibilityRole="button"
        [accessibilityLabel]="forwardLabel()"
        [disabled]="disabled() || !canShift(1)"
        (press)="shift(1)"
        ><text class="title">›</text></pressable
      ></view
    >
    @if (view() === 'years') {
      <text class="muted"
        >{{ years()[0] }} – {{ years()[years().length - 1] }}</text
      >
      <view class="calendar-grid" [accessibilityLabel]="label()">
        @for (option of years(); track $index) {
          <pressable
            class="calendar-period"
            [class.selected]="option === year()"
            accessibilityRole="button"
            [accessibilityLabel]="'' + option"
            [accessibilityState]="{
              selected: option === year(),
              disabled: !yearAvailable(option),
            }"
            [disabled]="!yearAvailable(option)"
            (press)="chooseYear(option)"
          >
            <text [class]="option === year() ? 'selected-text' : 'label'">{{
              option
            }}</text>
          </pressable>
        }
      </view>
    } @else if (view() === 'months') {
      <view class="calendar-grid" [accessibilityLabel]="label()">
        @for (option of months(); track $index) {
          <pressable
            class="calendar-period"
            [class.selected]="option.value === month()"
            accessibilityRole="button"
            [accessibilityLabel]="option.label"
            [accessibilityState]="{
              selected: option.value === month(),
              disabled: !monthAvailable(option.value),
            }"
            [disabled]="!monthAvailable(option.value)"
            (press)="chooseMonth(option.value)"
          >
            <text
              [class]="option.value === month() ? 'selected-text' : 'label'"
              >{{ option.label }}</text
            >
          </pressable>
        }
      </view>
    } @else {
      <view class="calendar-grid" [accessibilityLabel]="label()">
        @for (day of weekdays(); track $index) {
          <view class="calendar-day"
            ><text class="muted">{{ day }}</text></view
          >
        }
        @for (cell of cells(); track cell.date) {
          <pressable
            class="calendar-day"

            accessibilityRole="button"
            [accessibilityLabel]="cell.date"
            [accessibilityHint]="
              eventsByDate().has(cell.date) ? hasEventsLabel() : undefined
            "
            [accessibilityState]="{
              selected: value() === cell.date,
              disabled: unavailable(cell.date),
            }"
            [disabled]="unavailable(cell.date)"
            (press)="choose(cell.date)"
            ><view class="calendar-date-value" [class.selected]="value() === cell.date"><text
              [class]="
                value() === cell.date
                  ? 'selected-text'
                  : cell.current
                    ? 'label'
                    : 'muted'
              "
              >{{ cell.day }}</text></view>
            @if (eventsByDate().has(cell.date)) {
              <view
                class="calendar-event-dot"

                [accessible]="false"
                pointerEvents="none"
              />
            }
          </pressable>
        }
      </view>
    }
    @if (showAgenda() && agendaDate()) {
      <view class="stack calendar-agenda">
        <text class="label" accessibilityRole="header">{{
          agendaLabel()
        }}</text>
        <text class="muted">{{ agendaDate() }}</text>
        @if (editable()) {
          <neu-button
            [label]="addEventLabel()"
            size="sm"
            variant="outline"
            [disabled]="unavailable(value())"
            (pressed)="requestCreate()"
          />
        }
        @for (event of selectedEvents(); track event.id) {
          <view class="stack calendar-event">
            <view class="row calendar-event-heading">
              <text class="label grow calendar-event-title">{{ event.label }}</text>
              @if (editable()) {
                <view class="row calendar-event-actions">
                  <neu-icon-button
                    [label]="editEventLabel() + ' ' + event.label"
                    [svg]="editIcon"
                    variant="text"
                    [disabled]="unavailable(value()) || !!event.disabled"
                    (pressed)="requestEdit(event)"
                  />
                  <neu-icon-button
                    [label]="deleteEventLabel() + ' ' + event.label"
                    [svg]="deleteIcon"
                    variant="text"
                    tone="danger"
                    [disabled]="unavailable(value()) || !!event.disabled"
                    (pressed)="requestDelete(event)"
                  />
                </view>
              }
            </view>
            @if (event.description) {
              <text class="muted">{{ event.description }}</text>
            }
          </view>
        } @empty {
          <text class="muted">{{ emptyAgendaLabel() }}</text>
        }
      </view>
    }
  </view>`,
  styleUrls: ['../foundation/mobile.css', './calendar.css'],
})
export class NeuCalendarComponent {
  protected readonly editIcon = NEU_EDIT;
  protected readonly deleteIcon = NEU_CLOSE;
  readonly label = input('Calendar');
  readonly value = model('');
  readonly month = model(todayISO().slice(0, 7));
  readonly locale = input('en');
  readonly firstDay = input(1);
  readonly min = input('');
  readonly max = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly previousLabel = input('Previous month');
  readonly nextLabel = input('Next month');
  readonly previousYearLabel = input('Previous year');
  readonly nextYearLabel = input('Next year');
  readonly previousYearsLabel = input('Previous 12 years');
  readonly nextYearsLabel = input('Next 12 years');
  readonly events = input<readonly NeuCalendarEvent[]>([]);
  readonly showAgenda = input(true, { transform: booleanAttribute });
  readonly editable = input(false, { transform: booleanAttribute });
  readonly agendaLabel = input('Agenda');
  readonly emptyAgendaLabel = input('No events on this day');
  readonly hasEventsLabel = input('Day with events');
  readonly addEventLabel = input('Add event');
  readonly editEventLabel = input('Edit');
  readonly deleteEventLabel = input('Delete');
  readonly eventCreateRequested = output<string>();
  readonly eventEditRequested = output<NeuCalendarEvent>();
  readonly eventDeleteRequested = output<NeuCalendarEvent>();
  readonly touch = output<void>();
  protected readonly view = signal<'days' | 'months' | 'years'>('days');
  private readonly yearStart = signal(0);
  protected readonly year = computed(() =>
    (isoDate(this.month() + '-01') ?? isoDate(todayISO())!).getUTCFullYear(),
  );
  protected readonly years = computed(() =>
    Array.from(
      { length: Math.min(12, 10000 - this.yearStart()) },
      (_, i) => this.yearStart() + i,
    ),
  );
  protected readonly months = computed(() =>
    Array.from({ length: 12 }, (_, i) => {
      const value = `${String(this.year()).padStart(4, '0')}-${String(i + 1).padStart(2, '0')}`;
      return { value, label: this.formatMonth(value) };
    }),
  );
  protected readonly monthLabel = computed(() =>
    this.formatMonth(this.month()),
  );
  protected readonly backLabel = computed(() =>
    this.view() === 'days'
      ? this.previousLabel()
      : this.view() === 'months'
        ? this.previousYearLabel()
        : this.previousYearsLabel(),
  );
  protected readonly forwardLabel = computed(() =>
    this.view() === 'days'
      ? this.nextLabel()
      : this.view() === 'months'
        ? this.nextYearLabel()
        : this.nextYearsLabel(),
  );
  protected readonly cells = computed(() =>
    monthCells(this.month(), Math.floor(clamp(this.firstDay(), 0, 6))),
  );
  protected readonly weekdays = computed(() => {
    const first = Math.floor(clamp(this.firstDay(), 0, 6));
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.UTC(2020, 5, 7 + ((first + i) % 7)));
      try {
        return new Intl.DateTimeFormat(this.locale(), {
          weekday: 'short',
          timeZone: 'UTC',
        }).format(date);
      } catch {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
          (first + i) % 7
        ];
      }
    });
  });
  private formatMonth(month: string): string {
    const d = isoDate(month + '-01');
    if (!d) return month;
    try {
      return new Intl.DateTimeFormat(this.locale(), {
        month: 'long',
        timeZone: 'UTC',
      }).format(d);
    } catch {
      return month;
    }
  }
  protected readonly eventsByDate = computed(() => {
    const index = new Map<string, NeuCalendarEvent[]>();
    for (const event of this.events()) {
      if (!isoDate(event.date)) continue;
      const entries = index.get(event.date) ?? [];
      entries.push(event);
      index.set(event.date, entries);
    }
    return index;
  });
  protected readonly selectedEvents = computed(
    () => this.eventsByDate().get(this.value()) ?? [],
  );
  protected readonly agendaDate = computed(() => {
    const date = isoDate(this.value());
    if (!date) return '';
    try {
      return new Intl.DateTimeFormat(this.locale(), {
        dateStyle: 'full',
        timeZone: 'UTC',
      }).format(date);
    } catch {
      return this.value();
    }
  });
  protected requestCreate(): void {
    if (this.editable() && !this.unavailable(this.value()))
      this.eventCreateRequested.emit(this.value());
  }
  protected requestEdit(event: NeuCalendarEvent): void {
    if (this.canManage(event)) this.eventEditRequested.emit(event);
  }
  protected requestDelete(event: NeuCalendarEvent): void {
    if (this.canManage(event)) this.eventDeleteRequested.emit(event);
  }
  private canManage(event: NeuCalendarEvent): boolean {
    return (
      this.editable() &&
      !event.disabled &&
      !this.unavailable(this.value()) &&
      this.selectedEvents().includes(event)
    );
  }
  constructor() {
    effect(() => {
      const value = this.value();
      if (isoDate(value)) this.month.set(value.slice(0, 7));
    });
  }
  protected unavailable(date: string): boolean {
    return (
      this.disabled() ||
      this.readonly() ||
      !isoDate(date) ||
      (!!isoDate(this.min()) && date < this.min()) ||
      (!!isoDate(this.max()) && date > this.max())
    );
  }
  protected canShift(delta: number): boolean {
    if (this.view() === 'years') {
      const start = this.yearStart() + delta * 12;
      return (
        start >= 1 &&
        start <= 9999 &&
        (!isoDate(this.min()) ||
          start + 11 >= Number(this.min().slice(0, 4))) &&
        (!isoDate(this.max()) || start <= Number(this.max().slice(0, 4)))
      );
    }
    if (this.view() === 'months')
      return this.yearAvailable(this.year() + delta);
    const month = shiftMonth(this.month(), delta);
    return (
      !!isoDate(month + '-01') &&
      !(isoDate(this.min()) && month < this.min().slice(0, 7)) &&
      !(isoDate(this.max()) && month > this.max().slice(0, 7))
    );
  }
  protected shift(delta: number): void {
    if (this.disabled() || !this.canShift(delta)) return;
    if (this.view() === 'years')
      this.yearStart.update((year) => year + delta * 12);
    else if (this.view() === 'months') this.chooseYear(this.year() + delta);
    else this.month.update((x) => shiftMonth(x, delta));
  }
  protected showMonths(): void {
    if (!this.disabled())
      this.view.update((view) => (view === 'months' ? 'days' : 'months'));
  }
  protected showYears(): void {
    if (this.disabled()) return;
    this.yearStart.set(Math.max(1, Math.floor(this.year() / 12) * 12));
    this.view.update((view) => (view === 'years' ? 'days' : 'years'));
  }
  protected monthAvailable(month: string): boolean {
    return (
      !this.disabled() &&
      !!isoDate(month + '-01') &&
      (!isoDate(this.min()) || month >= this.min().slice(0, 7)) &&
      (!isoDate(this.max()) || month <= this.max().slice(0, 7))
    );
  }
  protected yearAvailable(year: number): boolean {
    return (
      !this.disabled() &&
      year >= 1 &&
      year <= 9999 &&
      (!isoDate(this.min()) || year >= Number(this.min().slice(0, 4))) &&
      (!isoDate(this.max()) || year <= Number(this.max().slice(0, 4)))
    );
  }
  protected chooseMonth(month: string): void {
    if (!this.monthAvailable(month)) return;
    this.month.set(month);
    this.view.set('days');
  }
  protected chooseYear(year: number): void {
    if (!this.yearAvailable(year)) return;
    let month = `${String(year).padStart(4, '0')}-${this.month().slice(5, 7)}`;
    if (isoDate(this.min()) && month < this.min().slice(0, 7))
      month = this.min().slice(0, 7);
    if (isoDate(this.max()) && month > this.max().slice(0, 7))
      month = this.max().slice(0, 7);
    this.month.set(month);
    this.view.set('months');
  }
  protected choose(date: string): void {
    if (this.unavailable(date)) return;
    this.value.set(date);
    this.touch.emit();
  }
}
