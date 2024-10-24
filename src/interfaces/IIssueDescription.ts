import IComment from "./IComment";

export default interface IIssueDescription {
    issue: string;
    commentStory: IComment[];
}