import IUserIssue from "./IUserIssue";

export default interface IDataIssues {
    startAt: number,
    maxResults: number,
    total: number;
    issues: IUserIssue[],
    month: string,
    userDisplayName: string,
}