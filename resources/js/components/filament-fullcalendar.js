import { Calendar } from '@fullcalendar/core'
import locales from '@fullcalendar/core/locales-all'
import momentJalaali from 'moment-jalaali'

// Configure moment-jalaali to use Jalaali calendar
momentJalaali.loadPersian({ usePersianDigits: false })

export default function fullcalendar({
    locale,
    plugins,
    schedulerLicenseKey,
    timeZone,
    config,
    editable,
    selectable,
    eventClassNames,
    eventContent,
    eventDidMount,
    eventWillUnmount,
}) {
    return {
        /** @type Calendar */
        calendar: null,

        init() {
            // Prepare calendar configuration
            const calendarConfig = {
                plugins: plugins.map((plugin) => availablePlugins[plugin]),
                locale,
                ...(schedulerLicenseKey && { schedulerLicenseKey }),
                timeZone,
                editable,
                selectable,
                locales,
            }

            // Configure Jalali calendar system for Persian locales
            if (locale === 'fa' || locale === 'fa-AF') {
                console.log('[FullCalendar] Configuring Jalali calendar for locale:', locale);
                
                // Override title format to show Jalali date
                calendarConfig.titleFormat = function(date) {
                    const m = momentJalaali(date.date.marker)
                    return m.format('jMMMM jYYYY')
                }
                
                // Configure fixed week count
                calendarConfig.fixedWeekCount = false
                calendarConfig.showNonCurrentDates = false
                
                // Set initial view if not specified
                if (!config.initialView) {
                    calendarConfig.initialView = 'jalaliMonth'
                }
                
                // Create a custom Jalali month view
                calendarConfig.views = {
                    jalaliMonth: {
                        type: 'dayGrid',
                        duration: { days: 1 }, // Will be overridden by visibleRange
                        buttonText: 'ماه',
                        fixedWeekCount: false,
                        visibleRange: function(currentDate) {
                            console.log('[FullCalendar] jalaliMonth visibleRange called with:', currentDate);
                            const m = momentJalaali(currentDate)
                            const start = m.clone().startOf('jMonth')
                            const end = m.clone().endOf('jMonth').add(1, 'day')
                            
                            console.log('[FullCalendar] Jalali month range:', {
                                start: start.format('YYYY-MM-DD'),
                                startJalali: start.format('jYYYY-jMM-jDD'),
                                end: end.format('YYYY-MM-DD'),
                                endJalali: end.format('jYYYY-jMM-jDD'),
                                currentDate: momentJalaali(currentDate).format('jYYYY-jMM-jDD')
                            });
                            
                            return {
                                start: start.toDate(),
                                end: end.toDate()
                            }
                        }
                    },
                    // Alias dayGridMonth to jalaliMonth for compatibility
                    dayGridMonth: {
                        type: 'jalaliMonth'
                    }
                }
            }

            this.calendar = new Calendar(this.$el, {
                ...calendarConfig,
                ...config, // Apply user config AFTER our Jalali config so they can still override if needed
                eventClassNames,
                eventContent,
                eventDidMount,
                eventWillUnmount,
                events: (info, successCallback, failureCallback) => {
                    this.$wire
                        .fetchEvents({
                            start: info.startStr,
                            end: info.endStr,
                            timezone: info.timeZone,
                        })
                        .then(successCallback)
                        .catch(failureCallback)
                },
                eventClick: ({ event, jsEvent }) => {
                    jsEvent.preventDefault()

                    if (event.url) {
                        const isNotPlainLeftClick = (e) =>
                            e.which > 1 ||
                            e.altKey ||
                            e.ctrlKey ||
                            e.metaKey ||
                            e.shiftKey
                        return window.open(
                            event.url,
                            event.extendedProps.shouldOpenUrlInNewTab ||
                                isNotPlainLeftClick(jsEvent)
                                ? '_blank'
                                : '_self',
                        )
                    }

                    this.$wire.onEventClick(event)
                },
                eventDrop: async ({
                    event,
                    oldEvent,
                    relatedEvents,
                    delta,
                    oldResource,
                    newResource,
                    revert,
                }) => {
                    const shouldRevert = await this.$wire.onEventDrop(
                        event,
                        oldEvent,
                        relatedEvents,
                        delta,
                        oldResource,
                        newResource,
                    )

                    if (typeof shouldRevert === 'boolean' && shouldRevert) {
                        revert()
                    }
                },
                eventResize: async ({
                    event,
                    oldEvent,
                    relatedEvents,
                    startDelta,
                    endDelta,
                    revert,
                }) => {
                    const shouldRevert = await this.$wire.onEventResize(
                        event,
                        oldEvent,
                        relatedEvents,
                        startDelta,
                        endDelta,
                    )

                    if (typeof shouldRevert === 'boolean' && shouldRevert) {
                        revert()
                    }
                },
                dateClick: ({ dateStr, allDay, view, resource }) => {
                    if (!selectable) return
                    this.$wire.onDateSelect(
                        dateStr,
                        null,
                        allDay,
                        view,
                        resource,
                    )
                },
                select: ({ startStr, endStr, allDay, view, resource }) => {
                    if (!selectable) return
                    this.$wire.onDateSelect(
                        startStr,
                        endStr,
                        allDay,
                        view,
                        resource,
                    )
                },
            })

            this.calendar.render()

            window.addEventListener('filament-fullcalendar--refresh', () =>
                this.calendar.refetchEvents(),
            )

            window.addEventListener('filament-fullcalendar--prev', () =>
                this.calendar.prev(),
            )

            window.addEventListener('filament-fullcalendar--next', () =>
                this.calendar.next(),
            )

            window.addEventListener('filament-fullcalendar--today', () =>
                this.calendar.today(),
            )

            window.addEventListener('filament-fullcalendar--view', (event) =>
                this.calendar.changeView(event.detail.view),
            )

            window.addEventListener('filament-fullcalendar--goto', (event) =>
                this.calendar.gotoDate(event.detail.date),
            )
        },
    }
}

import interaction from '@fullcalendar/interaction'
import dayGrid from '@fullcalendar/daygrid'
import timeGrid from '@fullcalendar/timegrid'
import list from '@fullcalendar/list'
import multiMonth from '@fullcalendar/multimonth'
import scrollGrid from '@fullcalendar/scrollgrid'
import timeline from '@fullcalendar/timeline'
import adaptive from '@fullcalendar/adaptive'
import resource from '@fullcalendar/resource'
import resourceDayGrid from '@fullcalendar/resource-daygrid'
import resourceTimeline from '@fullcalendar/resource-timeline'
import resourceTimeGrid from '@fullcalendar/resource-timegrid'
import rrule from '@fullcalendar/rrule'
import moment from '@fullcalendar/moment'
import momentTimezone from '@fullcalendar/moment-timezone'

const availablePlugins = {
    interaction,
    dayGrid,
    timeGrid,
    list,
    multiMonth,
    scrollGrid,
    timeline,
    adaptive,
    resource,
    resourceDayGrid,
    resourceTimeline,
    resourceTimeGrid,
    rrule,
    moment,
    momentTimezone,
}
