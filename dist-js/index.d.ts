export declare function changeTarget(newButtonId: string): void;
export declare function changePadding(options: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    all?: number;
}): void;
export declare function attach(newTargetId?: string): void;
export declare function detach(): Promise<void>;
export declare function isAttached(): boolean;
