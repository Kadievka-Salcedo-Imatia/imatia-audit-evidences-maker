import MainController from '../../controllers/main.controller';

describe('MainController', () => {
    describe('getInstance method', () => {
        it('should return the same jira service instance', () => {
            const mainController: MainController = MainController.getInstance();
            const mainController2 = MainController.getInstance();
            expect(mainController).toBeInstanceOf(MainController);
            expect(mainController).toStrictEqual(mainController2);
        });
    });

    describe('sendWelcome method', () => {
        it('should return Welcome string response', async () => {
            const mainController: MainController = MainController.getInstance();
            const result = await mainController.sendWelcome();
            expect(result).toBe('Welcome');
        });
    });
});
