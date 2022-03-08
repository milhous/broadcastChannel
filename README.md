<h1 align="center">BTGBroadcastChannel</h1>
<p align="center">
  <strong>仅支持同源的不同浏览器窗口，Tab页，frame或者 iframe 下的不同文档之间相互通信</strong>
  <br/>
  <span>+ 对于不兼容的环境采用降级策略，支持的浏览器最低达IE11，不支持Opera Mini</span><br />
</p>

---

web 领域可以实现的技术方案主要是类似于以下两种原理：

- 获取句柄，定向通讯
- 共享内存，结合轮询或者事件通知来完成业务逻辑

对于同源页面，常见的通讯方式：

- **广播模式**：Broadcast Channel / Service Worker / LocalStorage
- **共享存储模式**：Shared Worker / IndexedDB / cookie
- **口口相传模式**：window.open + window.opener
- **基于服务端**：Websocket / Comet / SSE 等

对于非同源页面，则可以通过嵌入同源 iframe 作为“桥”，由于 iframe 与父页面间可以通过指定 origin 来忽略同源限制，将非同源页面通信转换为同源页面通信。

---

## 如何使用 BTGBroadcastChannel

```js
import { BTGBroadcastChannel } from "@libs/broadcastChannel";
```

#### 在应用中创建频道 && 发送消息

消息数据格式类似 Redux Action，由 type（消息类型）和 payload（消息数据）组成。在监听事件根据 type 进行数据分发。

```js
import { BTGBroadcastChannel } from "@libs/broadcastChannel";

const channel = new BTGBroadcastChannel("channelTest");
channel.postMessage({
  type: "test",
  payload: { txt: "Hello, world!" },
});
```

#### 在另外一个应用中创建相同名称频道 & 接收消息

```js
import { BTGBroadcastChannel } from "@libs/broadcastChannel";

const channel = new BroadcastChannel("channelTest");

channel.onMessage((msg) => {
  console.log(msg);
});

// > { type: "test", payload: { txt: "Hello, world!" } }
```

#### 新增 & 移除 消息监听

```js
import { BTGBroadcastChannel } from "@libs/broadcastChannel";

const channel = new BroadcastChannel("channelTest");
const handler = (msg) => console.log(msg);

// add ite
channel.addEventListener("test", handler);

// remove it
channel.removeEventListener("test", handler);
```

#### 关闭频道

```js
channel.close();
```

#### 设置配置

**ttl** - 消息存活时间（Time To Live），默认 30 s，仅在 IndexedDB 方式中有效。

**loop** - 轮询间隔时间，默认 150 ms，仅在 IndexedDB 方式中有效。

**throttle** - 发送节流时间，默认 200 ms，在该时间内，同类型的消息会被最新的覆盖。

```js
const options = {
  ttl: 1000 * 30,
  loop: 150,
  throttle: 200,
};
const channel = new BroadcastChannel("test", options);
```

## 通讯方式:

对于不兼容的环境采用降级策略，自动选择合适的方式（ BroadCast Channel -> Service Worker -> IndexedDB -> LocalStorage ），确保各应用之间通讯畅通。

| Method                | Used in                                                                     | Description                                                                                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BroadCast Channel** | [Modern Browsers](https://caniuse.com/?search=BroadCast%20Channel)          | 创建一个用于广播的通信频道。当所有页面都监听同一频道的消息时，其中某一个页面通过它发送的消息就会被其他所有页面收到。                                                                                          |
| **Service Worker**    | [Browsers with ServiceWorker](https://caniuse.com/?search=Service%20Worker) | 是一个可以长期运行在后台的 Worker，能够实现与页面的双向通信。多页面的 Service Worker 可以共享，将 Service Worker 作为消息的处理中心即可实现广播效果。                                                         |
| **IndexedDB**         | [Browsers with WebWorkers](https://caniuse.com/?search=IndexedDB)           | 消息发送方将消息存至 IndexedDB 中，接收方（例如所有页面）则通过轮询去获取最新的信息。                                                                                                                         |
| **LocalStorage**      | [Older Browsers](https://caniuse.com/?search=LocalStorage)                  | 当 LocalStorage 变化时，会触发 storage 事件。利用这个特性，可以在发送消息时，把消息写入到某个 LocalStorage 中，然后在各个页面内，通过监听 storage 事件即可收到通知。Safari 隐身模式下无法设置 LocalStorage 值 |

## 注意事项

- 自己发的消息不会被自己监听。
- 建议应用使用 onMessage 监听，组件使用 addEventListener 监听。
- 及时关闭频道，节约系统资源。

## 延伸知识

渐进式网络应用程序(progressive web application - PWA)，是一种可以提供类似于 native app(原生应用程序) 体验的 web app(网络应用程序)。

PWA 可以用来做很多事。其中最重要的是，在**离线(offline)**时应用程序能够继续运行功能。这是通过使用名为 Service Workers 的 web 技术来实现的。

## 参考：

- [pubkey/broadcast-channel](https://github.com/pubkey/broadcast-channel)

- [面试官：前端跨页面通信，你知道哪些方法？](https://juejin.cn/post/6844903811232825357)

- [利用 Storage Event 实现页面间通信](https://juejin.cn/post/6844903641782943757)

- [浏览器数据库 IndexedDB 入门教程](https://www.ruanyifeng.com/blog/2018/07/indexeddb.html)

- [HTML5 indexedDB 前端本地存储数据库实例教程](https://www.zhangxinxu.com/wordpress/2017/07/html5-indexeddb-js-example/)

- [如何与 Service Worker 通信](https://segmentfault.com/a/1190000022240909)

- [service worker 实现离线缓存](https://www.infoq.cn/article/gevzkkhue8bki9pfvpxe)

- [Workbox](https://developers.google.com/web/tools/workbox)

- [PWA 之 workbox 学习](https://segmentfault.com/a/1190000019281388)

- [CRA 如何集成 Workbox 进行离线缓存](https://zhuanlan.zhihu.com/p/279327194)

- [React 如何通过 Webpack 优雅的接入 serviceWorker 的成熟方案 workBox && Google Analytics](https://juejin.cn/post/6844903845995216909)

- [GoogleChrome/samples](https://github.com/GoogleChrome/samples/tree/gh-pages/service-worker)

- [BroadcastChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/BroadcastChannel)

- [ServiceWorkers](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API/Using_Service_Workers)

- [IndexedDB](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API)

- [LocalStorage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage)

- [SharedWorker](https://developer.mozilla.org/zh-CN/docs/Web/API/SharedWorker)

- [使用 Service Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API/Using_Service_Workers)
