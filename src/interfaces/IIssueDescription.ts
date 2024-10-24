import IComment from "./IComment";

export default interface IIssueDescription {
    title: string;
    summary: string;
    link: string;
    commentStory: IComment[];
}