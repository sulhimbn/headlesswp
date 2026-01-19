export interface MemoProps<P> {
  prevProps: P;
  nextProps: P;
}

export function createArePropsEqual<P>(
  propKeys: (keyof P)[]
): (prevProps: P, nextProps: P) => boolean {
  return (prevProps, nextProps) => {
    return propKeys.every(key => prevProps[key] === nextProps[key]);
  };
}

export function createDeepPropsEqual<P>(
  propKeys: (keyof P)[]
): (prevProps: P, nextProps: P) => boolean {
  return (prevProps, nextProps) => {
    return propKeys.every(key =>
      JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key])
    );
  };
}
