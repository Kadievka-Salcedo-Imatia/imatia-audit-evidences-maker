import IUserIssueComment from "./IUserIssueComment";

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
    creator: string;
    reporter: string;
    comment: IUserIssueComment;
}