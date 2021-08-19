import {GameManager} from './GameManager';
//import { GlobalValues } from 'Globals/GlobalValues';
import { initPrototypes } from './Prototypes/initPrototypes';
//declare var module: any;

/*
* Singleton object. Since GameManager doesn't need multiple instances we can use it as singleton object.
*/
//GameManager.SetGlobals();

// This doesn't look really nice, but Screeps' system expects this method in main.js to run the application.
// If we have this line, we can make sure that globals bootstrap and game loop work.
// http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture

initPrototypes();

module.exports.loop = function() {

    console.log('------------------------------------------')
    //GlobalValues.loadGlobals();
    GameManager.Start();
};
