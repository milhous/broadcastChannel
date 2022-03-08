import MethodBasic from './MethodBasic';

// 原生Broadcast Channel API 可以实现同源下浏览器不同窗口，Tab页，frame或者 iframe 下的 浏览器上下文 (通常是同一个网站下不同的页面)之间的简单通讯。
export default class MethodBroadcastChannel extends MethodBasic {
    constructor() {
        super();
    }

    // 类型
    static type = 'broadcastChannel';

    // 是否可使用
    static canBeUsed(): boolean {
        return typeof window !== 'undefined' && typeof BroadcastChannel === 'function';
    }

    // 创建频道
    protected _createChannel(): void {
        this._listener = (evt: MessageEvent<any>) => {
            const data: IBTGBroadcastChannelMessage = evt.data;

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
        };

        this._channel = new BroadcastChannel(this._name);
        this._channel.onmessage = this._listener;
        this._channel.onmessageerror = (err) => {
            console.log(err);
        };
    }

    // 关闭频道
    protected _closeChannel(): void {
        (this._channel as BroadcastChannel).close();
    }

    /**
     * 发送消息
     * @param {IBTGBroadcastChannelMessage} data 数据
     */
    protected _postMessage(data: IBTGBroadcastChannelMessage): void {
        (this._channel as BroadcastChannel).postMessage(data);
    }
}