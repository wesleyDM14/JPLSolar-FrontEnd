import { useEffect, useState } from 'react';

/** Atrasa a propagação de um valor (busca digitada) para não disparar uma requisição por tecla. */
export function useDebouncedValue(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
