import { env } from "../config/env.js"

export const resolveMediaUrl = (value: string): string => {
    if(/^https?:\/\//i.test(value) || !env.R2_PUBLIC_URL){
        return value;
    }

    return `${env.R2_PUBLIC_URL.replace(/\/+$/, "")}/${value}`;
};

