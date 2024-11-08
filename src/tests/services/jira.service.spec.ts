import axios from 'axios';
import JiraService from '../../services/jira.service';
import IGetIssueFromJiraInput from '../../interfaces/IGetIssueFromJiraInput';
import { getUserIssueReqBodyMock, getUserIssueReqHeaderMock } from '../mocks/getUserIssueRequestMock';
import { jiraIssuesMock } from '../mocks/jiraIssuesMock';

jest.mock('axios');

describe('JiraService', () => {
    let jiraService: JiraService;

    describe('getInstance method', () => {
        it('should return the same jira service instance', () => {
            jiraService = JiraService.getInstance();
            const jiraService2 = JiraService.getInstance();
            expect(jiraService).toBeInstanceOf(JiraService);
            expect(jiraService).toStrictEqual(jiraService2);
        });
    });

    describe('getUserIssues method', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should map request body a return jira data with axios instance by default', async () => {
            (axios.create as jest.Mock).mockImplementation(() => ({
                get: (_url: string, _options?: any) => ({
                    data: jiraIssuesMock,
                }),
            }));

            const getIssueInput: IGetIssueFromJiraInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                startDate: '2024-11-01',
                endDate: '2024-11-31',
            };
            const result: Record<string, any> = await jiraService.getUserIssues(getIssueInput);

            expect(result).toEqual(jiraIssuesMock);
            expect(axios.create).toHaveBeenCalledWith({
                baseURL: 'https://jiracloud-example.com',
                timeout: 5000,
            });
        });

        it('should map request body a return jira data with axios custom instance', async () => {
            (axios.create as jest.Mock).mockImplementation(() => ({
                get: (_url: string, _options?: any) => ({
                    data: jiraIssuesMock,
                }),
            }));

            const getIssueInput: IGetIssueFromJiraInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                startDate: '2024-11-01',
                endDate: '2024-11-31',
                jira_base_url: getUserIssueReqBodyMock.jira_base_url,
                jira_url: getUserIssueReqBodyMock.jira_url,
                jql: getUserIssueReqBodyMock.jql,
            };
            const result: Record<string, any> = await jiraService.getUserIssues(getIssueInput);

            expect(result).toEqual(jiraIssuesMock);
            expect(axios.create).toHaveBeenCalledWith({
                baseURL: 'http://external-jira-base-url.com',
                timeout: 5000,
            });
        });

        it('should throw an error when fetching data fails', async () => {
            (axios.create as jest.Mock).mockImplementation(() => ({
                get: (_url: string, _options?: any) => {
                    throw new Error('error');
                },
            }));

            const getIssueInput: IGetIssueFromJiraInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                startDate: '2024-11-01',
                endDate: '2024-11-31',
            };

            await expect(jiraService.getUserIssues(getIssueInput)).rejects.toThrow();
        });
    });
});
