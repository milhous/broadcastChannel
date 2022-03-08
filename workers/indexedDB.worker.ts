interface IBTGBroadcastChannelWorkerMsg {
    cmd: string;
    data: IBTGBroadcastChannelWorkerData;
}

interface IBTGBroadcastChannelWorkerData {
    [key: string]: any;
}

// Web Worker
const script = () => {
    // 数据库
    let _db: IDBDatabase = null;
    // 数据库名称
    let _dbname: string = null;
    // 轮询时间
    let _loop: number = 0;
    // 存活时间
    let _ttl: number = 0;
    // 对象仓库名称
    const _storename: string = 'messages';
    // 消息ID
    let _messageId: number = 0;
    // 消息类型
    const _messageType: string[] = [];

    /**
     * 获取对象仓库
     * @param {string} mode 用于隔离事务作用域内的object store中数据访问的模式
     * @return {IDBObjectStore} objectStore 对象仓库
     */
    const getObjectStore = (mode: IDBTransactionMode = 'readonly'): IDBObjectStore => {
        const transaction: IDBTransaction = (_db as IDBDatabase).transaction([_storename], mode);
        const objectStore: IDBObjectStore = transaction.objectStore(_storename);

        return objectStore;
    };

    /**
     * 查询消息类型
     * @param {string} type 类型
     * @return {boolean}  
     */
    const indexOfMessageType = (type: string): boolean => {
        let result: boolean = false;

        for (let i = 0, len = _messageType.length; i < len; i++) {
            if (type === _messageType[i]) {
                result = true;

                break;
            }
        }

        if (!result) {
            _messageType.push(type);
        }

        return result;
    };

    /**
     * 筛选消息
     * @param {Array<IBTGBroadcastChannelMessage>} originalMessages 原始消息
     * @param {Array<IBTGBroadcastChannelMessage>} messages 消息
     */
    const filterMessages = (originalMessages: IBTGBroadcastChannelMessage[]): IBTGBroadcastChannelMessage[] => {
        let messages: IBTGBroadcastChannelMessage[] = [];
        let useMessages: IBTGBroadcastChannelMessage[] = [];

        for (let i = 0, len = originalMessages.length; i < len; i++) {
            const msg: IBTGBroadcastChannelMessage = originalMessages[i];

            if (!!msg) {
                messages.push(msg);

                if (msg.id > _messageId) {
                    _messageId = msg.id;
                }
            }
        }

        //.sort((msgA, msgB) => msgA.time - msgB.time);

        // 消息类型去重
        if (messages.length) {
            _messageType.length = 0;

            for (let i = 0, len = messages.length; i < len; i++) {
                const msg: IBTGBroadcastChannelMessage = messages[i];
                const { type } = msg;

                if (!indexOfMessageType(type)) {
                    useMessages.push(msg);
                }
            }
        }

        return useMessages;
    };

    /**
     * 生成 min ~ max 随机数
     * @param {number} min 最小值 
     * @param {number} max 最大值 
     */
    const randomInt = (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    /**
     * 创建
     * @param {string} dbname DB名称
     * @param {number} loop 循环时间
     * @param {number} ttl 存活时间
     * @param {function} cb 回调函数
     */
    const create = (dbname: string, loop: number, ttl: number, cb: (res: boolean) => void): void => {
        _dbname = dbname;
        _loop = loop;
        _ttl = ttl;

        const DBOpenRequest: IDBOpenDBRequest = indexedDB.open(dbname);

        DBOpenRequest.onupgradeneeded = (evt: IDBVersionChangeEvent): void => {
            const db: IDBDatabase = (evt.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(_storename)) {
                const objectStore: IDBObjectStore = db.createObjectStore(_storename, {
                    keyPath: 'id',
                    autoIncrement: true
                });

                objectStore.createIndex('id', 'id', {
                    unique: true
                });
                objectStore.createIndex('time', 'time');
            }
        };

        DBOpenRequest.onerror = (evt: Event) => {
            // console.log('indexedDB 创建失败');

            cb(false);
        };

        DBOpenRequest.onsuccess = () => {
            _db = DBOpenRequest.result as IDBDatabase;

            // console.log('indexedDB 创建成功');

            cb(true);
        };
    };

    /**
     * 发送消息
     * @param {IBTGBroadcastChannelMessage} data 数据
     */
    const write = (data: IBTGBroadcastChannelMessage, cb: (res: boolean) => void): void => {
        const objectStore: IDBObjectStore = getObjectStore('readwrite');
        const request: IDBRequest = objectStore.add(data);

        request.onsuccess = (evt) => {
            cb(true);

            // console.log('indexedDB 数据写入成功');
        };

        request.onerror = (evt) => {
            cb(false);

            // console.log('indexedDB 数据写入成功');
        }
    };

    /**
     * 读取消息
     * @param {function} cb 回调函数
     */
    const read = (cb: (res: IBTGBroadcastChannelMessage[]) => void): void => {
        const objectStore: IDBObjectStore = getObjectStore();
        const keyRangeValue = IDBKeyRange.lowerBound(_messageId, true);
        const messages: IBTGBroadcastChannelMessage[] = [];

        objectStore.openCursor(keyRangeValue).onsuccess = (evt) => {
            const cursor = (evt.target as IDBRequest).result;

            if (cursor) {
                messages.push(cursor.value);
                cursor.continue();
            } else {
                cb(filterMessages(messages));
            }
        };

        if (randomInt(0, 10) === 0) {
            clear();
        }
    };

    // 清理过时消息
    const clear = (): void => {
        const now: number = new Date().getTime();
        const time: number = now - _ttl;
        const objectStore: IDBObjectStore = getObjectStore('readwrite');
        const keyRangeValue = IDBKeyRange.upperBound(time, true);
        const request: IDBRequest = objectStore.index('time').openCursor(keyRangeValue);

        request.onsuccess = (evt) => {
            const cursor = (evt.target as IDBRequest).result;

            if (cursor) {
                objectStore.delete(cursor.primaryKey);
                cursor.continue();
            } else {
                //console.log('indexedDB 清理成功');
            }
        };

        request.onerror = (evt: Event) => {
            //console.log('indexedDB 清理失败');
        };
    }

    /**
     * 发送
     * @param {string} cmd 命令
     * @param {IBTGBroadcastChannelWorkerData} data 数据
     */
    const post = (cmd: string, data: IBTGBroadcastChannelWorkerData): void => {
        postMessage({
            cmd,
            data
        });
    };

    // 循环查询
    const readLoop = (): void => {
        read((res: IBTGBroadcastChannelMessage[]) => {
            if (res.length) {
                post('read', { state: true, msg: res });
            }

            self.setTimeout(function () {
                readLoop();
            }, _loop);
        });
    }

    onmessage = (message) => {
        const { cmd, data } = message.data as IBTGBroadcastChannelWorkerMsg;
        let msg: IBTGBroadcastChannelWorkerData = {};

        switch (cmd) {
            case 'init':
                create(data.dbname, data.loop, data.ttl, (res: boolean) => {
                    msg.state = res;

                    post(cmd, msg);

                    readLoop();
                });

                break;
            case 'write':
                write(data.msg, (res: boolean) => {
                    msg.state = res;

                    post(cmd, msg);
                });

                break;
            case 'close':
                _db.close();

                self.close();

                break;
        }
    };
};

const blob: Blob = new Blob([`(${script.toString()})()`], { type: 'application/octet-binary' });
const blobURL: string = URL.createObjectURL(blob);

export default blobURL;