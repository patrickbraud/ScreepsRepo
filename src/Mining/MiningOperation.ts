import { RoomMgr } from "Mgrs/RoomMgr";
import { Global } from "Global";

class MiningOperation {


    private _roomMgr: RoomMgr;
    private _source: Source;

    // Structure objects (container/link)
    private _containerPos: RoomPosition;

    // Prespawning details
    private _sourceTravelDistance: number;

    // Energy input details
    private _sourceWorkCount: number;
    public energyInput: number;

    // Mine status details
    private _miners: Creep[];
    private _mineCarts: Creep[];


    constructor(roomMgr: RoomMgr, source: Source) {
        this._roomMgr = roomMgr;
        this._source = source;

        this.loadMiningDetails();
    }

    loadMiningDetails() {
        this._containerPos = this._source.containerPos;

        this._sourceWorkCount = this._source.harvesterWorkCount;
        this.energyInput = this._sourceWorkCount >= 5 ? 10 : this._sourceWorkCount * 2;

        this._sourceTravelDistance = this._source.sourceSpawnRoad.length;

        this._miners = this._source.harvesters;
        this._mineCarts = this._source.transporters;
    }

    runMiningOperation() {

        this.checkMinerStatus();
        this.checkMineCartStatus();



    }

    checkMinerStatus() {



        // create Miner if our energy input is < 10
        if (this.energyInput < Global.SOURCE_GOAL_OWNED) {


        }
        // (Prespawn) create Miner if our current Miner will die soon
    }

    checkMineCartStatus() {
        // create transporter if there is enough energy to justify another cart
    }
}
