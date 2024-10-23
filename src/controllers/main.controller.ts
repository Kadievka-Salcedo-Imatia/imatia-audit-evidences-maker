export default class MainController {
    public static instance: MainController;

    /**
     * Returns the single instance of MainController.
     * @returns MainController - Singleton instance
     */
    public static getInstance() {
        if (!this.instance) {
            this.instance = new MainController();
        }
        return this.instance;
    }

    /**
     *.
     * @returns Welcome message
     */
    public async sendWelcome(): Promise<string> {
        return "Welcome";
    }
}
