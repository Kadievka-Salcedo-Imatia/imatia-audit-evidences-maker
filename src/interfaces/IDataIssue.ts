import IUserIssue from "./IUserIssue";

export default interface IDataIssue {
    startAt: number,
    maxResults: number,
    total: number;
    issues: IUserIssue[],
    month: string,
    project: string,
    userDisplayName: string,
}