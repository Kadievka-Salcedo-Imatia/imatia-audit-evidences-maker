import IHeader from '../../interfaces/IHeader';

export const getUserIssueReqBodyMock = {
    jira_username: 'jhon.doe',
    redmine_id: 9999,
    year: 2024,
    month: 11,
    rewrite_files: true,
    jira_base_url: 'http://external-jira-base-url.com',
    jira_url: '/other-jira-url',
    jql: 'other-jql',
};

export const getUserIssueDetailReqBodyMock = {
    jira_username: 'jhon.doe',
    redmine_id: 9999,
    issue_id: '44224',
};

export const getUserIssueReqHeaderMock: IHeader = {
    header: {
        getCredentials: ['jhon.doe', '1234809832474091'],
        authorization: 'basic user@password',
    },
};
