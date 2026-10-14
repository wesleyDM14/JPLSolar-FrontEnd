import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Dados cadastrais mudam pouco; evita refetch a cada foco de janela.
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                const status = error?.response?.status;
                // Erros de cliente (4xx) não melhoram tentando de novo.
                if (status && status >= 400 && status < 500) return false;
                return failureCount < 2;
            },
        },
    },
});
