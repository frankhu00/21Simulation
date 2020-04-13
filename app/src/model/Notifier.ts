class NotificationSystem {
    warn(msg: string) {
        console.warn(msg);
        return;
    }

    /**
     * This will console.error the error message and then throw the Error.
     * Since this throws, make sure to catch it when calling this
     * @param msg - Error message
     */
    error(msg: string) {
        console.error(msg);
        throw new Error(msg);
    }

    notify(msg: string) {
        // Silenced for now
        // console.log(msg)
        return;
    }
}

const Notifier = new NotificationSystem();

export { NotificationSystem };
export default Notifier;
