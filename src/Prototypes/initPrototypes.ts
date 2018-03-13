import { creepPrototypes } from "./creepPrototypes";
import { roomPrototypes } from "./roomPrototypes";
import { sourcePrototypes } from "./sourcePrototypes";
import { spawnPrototypes } from "./spawnPrototypes";

export function initPrototypes() {
    creepPrototypes();
    roomPrototypes();
    sourcePrototypes();
    spawnPrototypes();
}
