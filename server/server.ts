import {initvRP} from "./lib/vRP/server";

(() => {
    if ( getFramework() === 'vRP') {
        initvRP();
    }
})();


function getFramework<T>() {
    if ( GetResourceState('vrp') === 'started' ) {
        return 'vRP'
    }
}
