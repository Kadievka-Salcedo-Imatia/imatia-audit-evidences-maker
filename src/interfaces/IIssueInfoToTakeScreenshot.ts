import { PageTypeEnum } from '../enums/PageTypeEnum';
export default interface IIssueInfoToTakeScreenshot {
    link: string;
    pageType: PageTypeEnum | string;
}
