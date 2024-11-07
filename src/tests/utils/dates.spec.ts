import IDateTime from '../../interfaces/IDateTime';
import { formatDateTime, getCurrentMonth } from '../../utils/dates';

describe('date utils Unit Tests', () => {
    describe('formatDateTime method', () => {
        it('should receive a date string UTC and return IDateTime implementation', () => {
            const result: IDateTime = formatDateTime('2024-10-25T12:33:46.000+00:00');
            expect(result).toHaveProperty('date', '25/10/2024');
            expect(result).toHaveProperty('time', '14:33');
        });

        it('should receive a date string UTC and a separator and return IDateTime implementation', () => {
            const result: IDateTime = formatDateTime('2024-10-25T12:33:46.000+00:00', '-');
            expect(result).toHaveProperty('date', '25-10-2024');
            expect(result).toHaveProperty('time', '14:33');
        });
    });

    describe('getCurrentMonth method', () => {
        it('should return the current month number', () => {
            const result: number = getCurrentMonth();
            const date = new Date();
            expect(result).toEqual(date.getMonth() + 1);
        });
    });
});
