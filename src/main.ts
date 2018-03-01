import {GameManager} from './GameManager';
//declare var module: any;

/*
* Singleton object. Since GameManager doesn't need multiple instances we can use it as singleton object.
*/
GameManager.SetValues();

export const loop = function() {
    GameManager.Start();
}
