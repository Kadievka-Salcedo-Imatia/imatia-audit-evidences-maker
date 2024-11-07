import IDateTime from '../interfaces/IDateTime';

export function formatDateTime(input: string, separator: string = '/'): IDateTime {
    const date = new Date(input);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return {
        date: `${day}${separator}${month}${separator}${year}`,
        time: `${hours}:${minutes}`,
    };
}

export function getCurrentMonth(): number {
    const date = new Date();
    return date.getMonth() + 1;
}
