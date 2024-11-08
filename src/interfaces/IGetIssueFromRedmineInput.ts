export default interface IGetIssueFromRedmineInput {
    authorization: string;
    status_id?: string;
    limit?: number;
    offset?: number;
}
