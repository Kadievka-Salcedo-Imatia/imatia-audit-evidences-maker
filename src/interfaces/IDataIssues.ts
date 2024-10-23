import IUserIssue from "./IUserIssue";

export default interface IComment {
    startAt: number,
    maxResults: number,
    total: number;
    issues: IUserIssue[]
}