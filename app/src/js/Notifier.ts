class NotificationSystem {

    warn(msg: string) {
        console.warn(msg)
        return
    }

    error(msg: string) {
        console.error(msg)
        return
    }

    notify(msg: string) {
        console.log(msg)
        return
    }

}

const Notifier = new NotificationSystem()

export { NotificationSystem }
export default Notifier
