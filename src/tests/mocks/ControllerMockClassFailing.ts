export default class ControllerMockClassFailing {
    public async methodThrowsWeirdError() {
        throw new Error();
    }
}
