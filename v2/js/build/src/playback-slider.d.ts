export declare const UISlider: ({ parent, worker, cmd, attribute, label, defaultValue, min, max, step, }: {
    parent?: string;
    worker: any;
    cmd?: string;
    attribute: any;
    label?: string;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
}) => HTMLInputElement;
export declare const postSeek: (val: any) => Promise<void>;
export declare function slider(container: any, options: any): HTMLInputElement;
