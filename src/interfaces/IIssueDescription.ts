import { PageTypeEnum } from './../enums/PageTypeEnum';
export default interface IIssueDescription {
    title: string;
    summary: string;
    link: string;
    pageType: PageTypeEnum | string;
    closed: string;
    project: string;
}
