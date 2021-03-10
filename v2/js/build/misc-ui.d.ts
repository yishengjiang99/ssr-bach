export declare const cdiv: (tag: string, attributes?: {
    [k: string]: string;
}, children?: string | HTMLElement | HTMLElement[]) => HTMLElement;
export declare const startBtn: (clickStart: any) => HTMLButtonElement;
export declare const $: {
    <K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K];
    <K_1 extends keyof SVGElementTagNameMap>(selectors: K_1): SVGElementTagNameMap[K_1];
    <E extends Element = Element>(selectors: string): E;
};
export declare const stdoutPanel: (parentDiv: any) => {
    stdout: (str: string) => void;
    std: any;
    printrx: (str: any, n?: number) => void;
    printlink: (href: any, name: any) => void;
};
export declare function logtime(stdout: any): (str: string) => boolean;
export declare const printrx: (str: any, n?: number) => void, stdout: (str: string) => void;
