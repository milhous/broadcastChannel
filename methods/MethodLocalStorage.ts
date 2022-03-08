import MethodBasic from './MethodBasic';

// 获取LocalStorage
const getLocalStorage = (): Storage => {
    let localStorage: Storage = null;

    if (typeof window === 'undefined') return null;

    try {
        localStorage = window.localStorage;
        localStorage = window['ie8-eventlistener/storage'] || window.localStorage;
    } catch (e) {
        // New versions of Firefox throw a Security exception
        // if cookies are disabled. See
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1028153
    }
    
    return localStorage;
}

// 只读的localStorage 属性允许你访问一个Document 源（origin）的对象 Storage；存储的数据将保存在浏览器会话中。
// localStorage 类似 sessionStorage，但其区别在于：存储在 localStorage 的数据可以长期保留；而当页面会话结束——也就是说，当页面被关闭时，存储在 sessionStorage 的数据会被清除 。
export default class MethodLocalStorage extends MethodBasic {
    constructor() {
        super();
    }

    // 类型
    static type = 'localstorage';

    // 是否可使用
    static canBeUsed(): boolean {
        const ls = getLocalStorage();

        if (!ls) return false;

        try {
            const key = '__broadcastchannel_check';
            ls.setItem(key, 'works');
            ls.removeItem(key);
        } catch (e) {
            // Safari 10 in private mode will not allow write access to local
            // storage and fail with a QuotaExceededError. See
            // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API#Private_Browsing_Incognito_modes
            return false;
        }

        return true;
    }

    // 创建频道
    protected _createChannel(): void {
        this._listener = (evt: StorageEvent): void => {
            if (evt.key === this._name) {
                const data: IBTGBroadcastChannelMessage = JSON.parse(evt.newValue);

                // 判断是否是自己的消息
                if (data.uuid === this._uuid) {
                    return;
                }

                // 判断是否小于频道创建时间
                if (data.time < this._time) {
                    return;
                }

                if (typeof this._messagesCallback === 'function') {
                    this._messagesCallback(data);
                }

                this._messagesDispatch(data);
            }
        }

        this._channel = getLocalStorage();

        window.addEventListener('storage', this._listener);
    }

    // 关闭频道
    protected _closeChannel(): void {
        window.removeEventListener('storage', this._listener);
    }

    /**
     * 发送消息
     * @param {IBTGBroadcastChannelMessage} data 数据
     */
    protected _postMessage(data: IBTGBroadcastChannelMessage): void {
        const value = JSON.stringify(data);
        (this._channel as Storage).setItem(this._name, value);

        /**
         * StorageEvent does not fire the 'storage' event
         * in the window that changes the state of the local storage.
         * So we fire it manually
         */
        const evt: Event = document.createEvent('Event');
        evt.initEvent('storage', true, true);
        evt['key'] = this._name;
        evt['newValue'] = value;
        window.dispatchEvent(evt);
    }
}