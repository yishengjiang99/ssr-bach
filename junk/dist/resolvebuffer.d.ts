/// <reference types="node" />
import { BufferIndex } from "./ssr-remote-control.types";
export declare function load(filename?: string): any[];
export declare function findIndex(presetId: any, midi: any, velocity: any): BufferIndex;
export declare function memcopy({ offset, endloop, pitchratio, looplength }: BufferIndex, output: Buffer, n: number): Buffer;
export declare function resolvebuffer(presetId: any, midi: any, velocity: any, seconds: any): Buffer;
