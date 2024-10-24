import IMonth from '../../../interfaces/IMonth';

function getFebruaryDays(year?: number): number {
    if (!year) return 28;

    const isLeapYear = (year: number) => {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    };

    return isLeapYear(year) ? 29 : 28;
}

const MONTHS = (year?: number): IMonth[] => [
    {
        displayName: 'Enero',
        days: 31,
    },
    {
        displayName: 'Febrero',
        days: getFebruaryDays(year),
    },
    {
        displayName: 'Marzo',
        days: 31,
    },
    {
        displayName: 'Abril',
        days: 30,
    },
    {
        displayName: 'Mayo',
        days: 31,
    },
    {
        displayName: 'Junio',
        days: 30,
    },
    {
        displayName: 'Julio',
        days: 31,
    },
    {
        displayName: 'Agosto',
        days: 31,
    },
    {
        displayName: 'Septiembre',
        days: 30,
    },
    {
        displayName: 'Octubre',
        days: 31,
    },
    {
        displayName: 'Noviembre',
        days: 30,
    },
    {
        displayName: 'Diciembre',
        days: 31,
    },
];

export { MONTHS, getFebruaryDays };
