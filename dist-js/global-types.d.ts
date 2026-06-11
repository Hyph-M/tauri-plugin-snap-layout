declare global {
    interface Window {
        snapLayout?: {
            attach: (id?: string) => void;
            detach: () => Promise<void>;
            changePadding: (options: {
                left?: number;
                right?: number;
                top?: number;
                bottom?: number;
                all?: number;
            }) => void;
            changeTarget: (id: string) => void;
            isAttached: () => boolean;
        };
    }
}
export {};
