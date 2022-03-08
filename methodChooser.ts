// Broadcast Channel
import MethodBroadcastChannel from './methods/MethodBroadcastChannel';
//  Service Worker
import MethodServiceWorker from './methods/MethodServiceWorker';
// IndexedDB + Web Worker
import MethodIndexedDB from './methods/MethodIndexedDB';
// Localstorage
import MethodLocalStorage from './methods/MethodLocalStorage';

export const chooseMethod = (): any => {
    if (MethodBroadcastChannel.canBeUsed()) {
        return MethodBroadcastChannel;
    } else if (MethodServiceWorker.canBeUsed()) {
        return MethodServiceWorker;
    } else if (MethodIndexedDB.canBeUsed()) {
        return MethodIndexedDB;
    } else if (MethodLocalStorage.canBeUsed()) {
        return MethodLocalStorage;
    }

    return null;
};
