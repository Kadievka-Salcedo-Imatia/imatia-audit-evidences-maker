export default class ControllerMockClass {
    public async controllerClassMethod() {
        return {
            data: 'data',
        };
    }

    public async downloadControllerMethod() {
        return {
            path: 'pathMock',
        };
    }

    public async downloadControllerMethodFails() {
        return new Error('Controller download method failed');
    }

    public async controllerClassMethodDataNull(): Promise<void> {}
}
