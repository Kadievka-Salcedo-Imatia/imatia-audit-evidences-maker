export default interface IUserIssue {
    id: string;
    key: string;
    type: string;
    created: string;
    updated: string;
    assignee: string;
    status: string;
    description: string;
    summary: string;
    project: string;
    projectTypeKey: string;
    self: string;
    creator: string;
    reporter: string;
}
