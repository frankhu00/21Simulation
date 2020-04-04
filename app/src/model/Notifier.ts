class NotificationSystem {

    warn(msg: string) {
        console.warn(msg)
        return
    }

    error(msg: string) {
        // console.error(msg)
        //throw error
        return
    }

    notify(msg: string) {
        // Silenced for now
        // console.log(msg)
        return
    }

}

const Notifier = new NotificationSystem()

export { NotificationSystem }
export default Notifier
