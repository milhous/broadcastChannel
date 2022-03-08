import { CacheFirst } from 'workbox-strategies';
import { NetworkFirst } from 'workbox-strategies';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';

// Your other import statements go here
precacheAndRoute((self as any).__WB_MANIFEST);

const initialize = (service: ServiceWorkerGlobalScope): void => {
    // 通过 workbox 配置，指定根路径 / 下的资源是 NetworkFirst 的，意味着这部分资源都是网络优先，有新的资源文件会先请求网络，
    // 而 / static / 路径下，因为 CRA 打包出来都使用了 revving（文件带hash，确保新文件不会被缓存），所以设置为 Cache 优先。
    // registerRoute('/', new NetworkFirst());

    // registerRoute(
    //     '/static/',
    //     new CacheFirst({
    //         cacheName: 'static-cache',
    //         matchOptions: {
    //         ignoreVary: true
    //         }
    //     })
    // );

    service.addEventListener('message', evt => {
        if (!evt.data ) {
            return;
        }

        if (evt.data.type === 'SKIP_WAITING') {
            service.skipWaiting();
        } else {
            service.clients.matchAll().then(function(clients) {
                clients.forEach(function(client) {
                client.postMessage(evt.data);
                });
            });
        }
    });

    // 跳过等待期
    service.addEventListener('install', evt => evt.waitUntil(service.skipWaiting()));

    // 一旦激活就开始控制任何现有客户机
    service.addEventListener('activate', evt => evt.waitUntil(service.clients.claim()));
}

initialize(self as any)