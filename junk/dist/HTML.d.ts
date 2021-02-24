export declare type HTML = {
    header: string;
    beforeMain: string;
    afterMain: string;
    end: string;
    css: string;
};
export declare const hotreloadOrPreload: (url?: string) => HTML;
