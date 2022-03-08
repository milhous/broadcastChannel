import MethodBasic from './MethodBasic';
import blobURL from '../workers/indexedDB.worker';

// IndexedDB 是一种底层 API，用于在客户端存储大量的结构化数据（也包括文件/二进制大型对象（blobs））。
// 该 API 使用索引实现对数据的高性能搜索。
export default class MethodIndexedDB extends MethodBasic {
    // 消息ID
    private _messageId: number = 0;

    constructor() {
        super();
    }

    // 类型
    static type = 'indexedDB';

    // 是否可使用
    static canBeUsed(): boolean {
        return typeof window !== 'undefined' && typeof indexedDB !== 'undefined' && typeof Worker !== 'undefined';
    }

    // 创建频道
    protected _createChannel(): void {
        this._listener = (data: IBTGBroadcastChannelMessage): void => {
            if (typeof this._messagesCallback === 'function') {
                this._messagesCallback(data);
            }

            this._messagesDispatch(data);
        }

        this._channel = new Worker(blobURL);
        this._channel.onmessage = (message) => {
            const { cmd, data } = message.data;

            switch (cmd) {
                case 'init':

                    break;
                case 'write':

                    break;
                case 'read':
                    const useMessages: IBTGBroadcastChannelMessage[] = data.msg.filter((msg: IBTGBroadcastChannelMessage) => {
                        // 判断是否是自己的消息
                        if (msg.uuid === this._uuid) {
                            return false;
                        }

                        // 判断是否小于频道创建时间
                        if (msg.time < this._time) {
                            return false;
                        }

                        // 判断是否重复发送
                        if (this._messagesToken.has(msg.token)) {
                            return false;
                        }

                        return true;
                    })

                    for (let msg of useMessages) {
                        this._listener(msg);
                    }

                    break;
            }
        };
        this._channel.onerror = (error) => {
            console.log(error.filename, error.lineno, error.message);
        }

        this._channel.postMessage({
            cmd: 'init',
            data: {
                dbname: this._name,
                loop: this._options.loop,
                ttl: this._options.ttl
            }
        });
    }

    // 关闭频道
    protected _closeChannel(): void {
        (this._channel as Worker).postMessage({
            cmd: 'close'
        });
    }

    /**
     * 发送消息
     * @param {IBTGBroadcastChannelMessage} data 数据
     */
    protected _postMessage(data: IBTGBroadcastChannelMessage): void {
        (this._channel as Worker).postMessage({
            cmd: 'write',
            data: {
                msg: data
            }
        });
    }
}