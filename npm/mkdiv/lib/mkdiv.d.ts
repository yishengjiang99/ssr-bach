export interface Attr {
    [key: string]: string | EventListener;
}
export declare function mkdiv(type: keyof HTMLElementTagNameMap, attr?: Attr, children?: string | string[] | HTMLElement | HTMLElement[]): HTMLElement;
