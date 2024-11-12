export default class ControllerMockClass {
    public async controllerClassMethod() {
        return {
            data: 'data',
        };
    }

    public async controllerClassMethodDataNull(): Promise<void> {}
}
