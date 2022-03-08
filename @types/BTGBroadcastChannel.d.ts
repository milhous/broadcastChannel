declare module "worker-loader!*" {
    class WebpackWorker extends Worker {
        constructor();
    }

    export default WebpackWorker;
}

/**
 * 声明 - 配置
 * @param {number} ttl 消息存活时间（Time To Live）
 * @param {number} loop 轮询间隔时间
 * @param {number} throttle 发送节流时间
 */
declare interface IBTGBroadcastChannelOptions {
    ttl: number;
    loop: number;
    throttle: number;
}

/**
 * 声明 - 消息
 * @param {string} type 类型
 * @param {IMessagePayload} payload 数据
 * @param {string} uuid uuid用来判断是否是自己消息源
 * @param {string} token token用来判断是否重复发送消息
 * @param {string} time 消息时间
 * @param {number} id 消息ID
 */
declare interface IBTGBroadcastChannelMessage {
    type: string;
    payload: IBTGBroadcastChannelPayload;
    uuid: string;
    token: string;
    time: number;
    id?: number;
}

// 声明 - 消息数据· 
declare interface IBTGBroadcastChannelPayload {
    [key: string]: any;
}

/**
 * 声明 - 消息回调
 */
declare type IBTGBroadcastChannelCallback = (msg: IBTGBroadcastChannelMessage) => void;

/**
 * 声明 - 消息监听集合
 */
declare type IBTGBroadcastChannelMap = Map<string, IBTGBroadcastChannelSet>;

declare type IBTGBroadcastChannelSet = Set<IBTGBroadcastChannelCallback>;

