import { creepPrototypes } from "./creepPrototypes";
import { roomPrototypes } from "./roomPrototypes";
import { sourcePrototypes } from "./sourcePrototypes";
import { spawnPrototypes } from "./spawnPrototypes";
import { containerPrototypes } from "./containerProrotypes";
import { resourcePrototypes } from "./resourcePrototype";

export function initPrototypes() {
    creepPrototypes();
    roomPrototypes();
    sourcePrototypes();
    spawnPrototypes();
    containerPrototypes();
    resourcePrototypes();
}
