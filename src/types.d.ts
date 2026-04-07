type HTMLAttributes<T extends EventTarget> = import('preact/compat').HTMLAttributes<T>;

declare const Fragment: import('preact').FunctionComponent<Record<string, never>>;

declare function h(
  type: string,
  props:
    | (import('preact/src/jsx').JSXInternal.HTMLAttributes &
        import('preact/src/jsx').JSXInternal.SVGAttributes &
        Record<string, any>)
    | null,
  ...children: import('preact').ComponentChildren[]
): import('preact').VNode<any>;
declare function h<P>(
  type: import('preact').ComponentType<P>,
  props: (import('preact').Attributes & P) | null,
  ...children: import('preact').ComponentChildren[]
): import('preact').VNode<any>;
