import axios from 'axios';
import RedmineService from '../../services/redmine.service';
import IGetIssueFromRedmineInput from '../../interfaces/IGetIssueFromRedmineInput';
import { redmineIssuesMock } from '../mocks/redmineIssuesMock';
import { getUserIssueReqHeaderMock } from '../mocks/getUserIssueRequestMock';

jest.mock('axios');

describe('RedmineService', () => {
    let redmineService: RedmineService;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getInstance method', () => {
        it('should return the same redmine service instance', () => {
            redmineService = RedmineService.getInstance();
            const redmineService2 = RedmineService.getInstance();
            expect(redmineService).toBeInstanceOf(RedmineService);
            expect(redmineService).toStrictEqual(redmineService2);
        });
    });

    describe('getUserIssues method', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should map request body a return jira data with axios instance by default', async () => {
            (axios.create as jest.Mock).mockImplementation(() => ({
                get: (_url: string, _options?: any) => ({
                    data: redmineIssuesMock,
                }),
            }));

            const getIssueInput: IGetIssueFromRedmineInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
            };
            const result: Record<string, any> = await redmineService.getUserIssues(getIssueInput);

            expect(result).toEqual(redmineIssuesMock);
            expect(axios.create).toHaveBeenCalledWith({
                baseURL: 'https://redmine-examle.com',
                timeout: 5000,
            });
        });

        it('should throw an error when fetching data fails', async () => {
            (axios.create as jest.Mock).mockImplementation(() => ({
                get: (_url: string, _options?: any) => {
                    throw new Error('error');
                },
            }));

            const getIssueInput: IGetIssueFromRedmineInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
            };

            await expect(redmineService.getUserIssues(getIssueInput)).rejects.toThrow();
        });
    });
});
