export default interface IRedmineGetIssuesInput {
    authorization: string;
    redmine_id?: string;
    status_id?: string;
    limit?: string;
    offset?: string;
}
