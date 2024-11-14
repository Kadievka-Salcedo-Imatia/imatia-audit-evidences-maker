export default interface IGetIssueFromRedmineInput {
    header: {
        getCredentials: string[];
        authorization: string;
    };
    status_id?: string;
    limit?: number;
    offset?: number;
}
