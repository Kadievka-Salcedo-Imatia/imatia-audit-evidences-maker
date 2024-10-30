import IUserIssuesInput from './IUserIssuesInput';

export default interface ICreateTemplateInput extends IUserIssuesInput {
    rewrite_files?: boolean;
}
