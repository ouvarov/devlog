const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })

const formatDateTime = (isoDate: string): string => DATE_TIME_FORMAT.format(new Date(isoDate))

export { formatDateTime }
