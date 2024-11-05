import { PageTypeEnum } from './../enums/PageTypeEnum';
export default interface IIssueDescription {
    title: string;
    summary: string;
    link: string;
    pageType: PageTypeEnum;
    closed: string;
    project: string;
}
