import {GameManager} from './game-manager';
//declare var module: any;

/*
* Singleton object. Since GameManager doesn't need multiple instances we can use it as singleton object.
*/
GameManager.globalBootstrap();

export const loop = function() {
    GameManager.loop();
}
