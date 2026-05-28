declare module 'next/navigation' {
  export function redirect(path: string): never;
  export function useRouter(): {
    push(path: string): void;
    replace(path: string): void;
    back(): void;
    refresh(): void;
  };
  export function usePathname(): string;
  export function useParams<T extends Record<string, string> = Record<string, string>>(): T;
  export function useSearchParams(): {
    get(key: string): string | null;
  };
}

declare module 'next/link' {
  import type { AnchorHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react';
  const Link: (props: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & { children?: ReactNode; href: string }) => JSX.Element;
  export default Link;
}

declare module 'next/cache' {
  export function revalidatePath(path: string): void;
}
