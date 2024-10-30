export function getPagesNumber(totalCount: number, limit: number): number {
    return Math.ceil(totalCount / limit);
}
