import { creepPrototypes } from "./creepPrototypes";
import { roomPrototypes } from "./roomPrototypes";
import { sourcePrototypes } from "./sourcePrototypes";
import { spawnPrototypes } from "./spawnPrototypes";
import { controllerPrototypes } from "./controllerPrototypes";
import { containerPrototypes } from "./containerProrotypes";
import { resourcePrototypes } from "./resourcePrototype";

export function initPrototypes() {
    creepPrototypes();
    roomPrototypes();
    sourcePrototypes();
    spawnPrototypes();
    controllerPrototypes();
    containerPrototypes();
    resourcePrototypes();
}
