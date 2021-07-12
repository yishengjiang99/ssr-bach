declare type LogDivProps = {
    container?: HTMLElement;
    containerID?: string;
};
export declare function logdiv({ container, containerID }?: LogDivProps): {
    stderr: (str: string) => string;
    stdout: (log: string) => void;
};
export {};
