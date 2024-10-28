import getLogger from "./logger";

const log = getLogger('utils.dates');

export function formatDateTime(input: string) {
    const date = new Date(input);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return {
        date: `${day}/${month}/${year}`,
        time: `${hours}:${minutes}`,
    };
}

export function getCurrentMonth(): number {
    const date = new Date();
    return date.getMonth() + 1;
}

export function isInDateRange(updatedOn: string, startDate: string, endDate: string) {
    log.info('Start utils.dates@isInDateRange method with params: ', {updatedOn, startDate, endDate});

    const updatedDate = new Date(updatedOn);
    const start = new Date(startDate);
    const end = new Date(endDate);

    end.setHours(23, 59, 59, 999);

    const result: boolean = updatedDate >= start && updatedDate <= end;

    log.info('Finish utils.dates@isInDateRange updatedDate >= startDate && updatedDate <= endDate : ', result);

    return result;
}