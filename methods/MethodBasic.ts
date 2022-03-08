import { uuid, timestamp, randomToken } from '../util';

abstract class MethodBasic {
    // 前缀关键词
    readonly KEY_PREFIX: string = '@BTGBroadcastChannel-';

    // 频道名称
    protected _name: string = '';
    // 频道uuid
    protected _uuid: string = null;
    // 频道创建时间
    protected _time: number = null;
    // 是否关闭
    protected _closed: boolean = false;
    // 频道
    protected _channel: BroadcastChannel | ServiceWorker | Worker | Storage = null;
    // 配置信息
    protected _options: IBTGBroadcastChannelOptions = null;
    // 监听事件
    protected _listener: (data: MessageEvent | IBTGBroadcastChannelMessage | StorageEvent) => void = null;
    // 子监听事件
    protected _sublistenersMap: Map<string, IBTGBroadcastChannelSet> = new Map();
    // 消息回调
    protected _messagesCallback: IBTGBroadcastChannelCallback = null;
    // 消息token，防止重复触发
    protected _messagesToken: Set<string> = new Set();

    constructor() { }

    /**
     * 初始化
     * @param {string} name 频道名称
     * @param {IBTGBroadcastChannelOptions} options 配置信息
     */
    public init(name: string, options: IBTGBroadcastChannelOptions): void {
        this._name = this.KEY_PREFIX + name;
        this._options = options;
        this._uuid = uuid();
        this._time = timestamp();

        this._createChannel();
    }

    /**
     * 发送消息
     * @param {IMessage} msg 消息
     */
    public postMessage(msg: IBTGBroadcastChannelMessage): void {
        if (this._closed) {
            return;
        }

        msg.uuid = this._uuid;
        msg.token = randomToken();
        msg.time = timestamp();

        this._postMessage(msg);
    };

    /**
     * 监听消息
     * @param {IMessageCallback} fn 回调
     */
    public onMessage(fn: IBTGBroadcastChannelCallback): void {
        if (typeof fn !== 'function') {
            return;
        }

        this._messagesCallback = fn;
    }

    // 关闭
    public close(): void {
        if (this._closed) {
            return;
        }

        this._closeChannel();

        this._channel = null;
        this._closed = true;
        this._messagesCallback = null;
        this._listener = null;

        for (let sublisteners of this._sublistenersMap.values()) {
            sublisteners.clear();
        }

        this._sublistenersMap.clear();

        this._messagesToken.clear();
    };

    /**
     * 新增监听
     * @param {string} type 类型
     * @param {IMessageCallback} handler 事件
     */
    public addEventListener(type: string, handler: IBTGBroadcastChannelCallback): void {
        if (typeof handler !== 'function') {
            return;
        }

        if (!this._sublistenersMap.has(type)) {
            this._sublistenersMap.set(type, new Set());
        }

        const sublisteners: IBTGBroadcastChannelSet = this._sublistenersMap.get(type);

        sublisteners.add(handler);
    }

    /**
     * 新增监听 
     * @param {string} type 类型
     * @param {IMessageCallback} handler 事件
     */
    public removeEventListener(type: string, handler: IBTGBroadcastChannelCallback): void {
        if (typeof handler !== 'function' || !this._sublistenersMap.has(type)) {
            return;
        }

        const sublisteners: IBTGBroadcastChannelSet = this._sublistenersMap.get(type);

        for (let listener of sublisteners) {
            if (listener === handler) {
                sublisteners.delete(listener);

                break;
            }
        }
    }

    // 创建频道
    protected abstract _createChannel(): void;

    // 关闭频道
    protected abstract _closeChannel(): void;

    /**
     * 发送消息
     * @param {IBTGBroadcastChannelMessage} data 数据
     */
    protected abstract _postMessage(data: IBTGBroadcastChannelMessage): void;

    /**
     * 分发消息
     * @param {IBTGBroadcastChannelMessage} data 数据
     */
    protected _messagesDispatch(data: IBTGBroadcastChannelMessage): void {
        const { type, token } = data;

        if (this._sublistenersMap.size === 0) {
            return;
        }

        if (this._sublistenersMap.has(type) && !this._messagesToken.has(token)) {
            const sublisteners: IBTGBroadcastChannelSet = this._sublistenersMap.get(type);

            for (let listener of sublisteners) {
                if (typeof listener === 'function') {
                    listener(data);
                }
            }

            this._messagesToken.add(token);
        }
    }
}

export default MethodBasic;