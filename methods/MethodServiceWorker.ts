import MethodBasic from './MethodBasic';
import { timestamp } from '../util';

// Service Worker 首先是一个运行在后台的 Worker 线程，然后它会长期运行，充当一个服务，很适合那些不需要网页或用户互动的功能。它的最常见用途就是拦截和处理网络请求。
export default class MethodServiceWorker extends MethodBasic {
    constructor() {
        super();
    }

    // 类型
    static type = 'serviceWorker';

    // 是否可使用
    static canBeUsed(): boolean {
        return 'serviceWorker' in navigator;
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

        if (navigator.serviceWorker.controller === null) {
            navigator.serviceWorker.register('/broadcastChannel.sw.js?v=' + timestamp()).then((registration) => {
                console.log('SW registered');
            }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });

            navigator.serviceWorker.ready.then((registration) => {
                if (!!registration.waiting) {
                    this._channel = registration.waiting;
                } else if (!!registration.installing) {
                    this._channel = registration.installing
                } else {
                    this._channel = registration.active;
                }
              });
        } else {
            this._channel = navigator.serviceWorker.controller;
        }

        navigator.serviceWorker.addEventListener('message', this._listener);
    }

    // 关闭频道
    protected _closeChannel(): void {
        navigator.serviceWorker.removeEventListener('message', this._listener);

        // (this._channel as ServiceWorker).close();
    }

    /**
     * 发送消息
     * @param {IBTGBroadcastChannelMessage} data 数据
     */
    protected _postMessage(data: IBTGBroadcastChannelMessage): void {
        (this._channel as ServiceWorker).postMessage(data);
    }
}