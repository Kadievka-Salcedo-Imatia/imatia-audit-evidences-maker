import { getPagesNumber } from '../../utils/pagination';

describe('pagination utils Unit Tests', () => {
    describe('getPagesNumber method', () => {
        it('should return the number of pages depending of the total and the limit', () => {
            const result: number = getPagesNumber(1201, 100);
            expect(result).toBe(13);
        });
    });
});
