/* Service worker das notificações push do JPL Solar. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
    let dados = {};
    try {
        dados = event.data ? event.data.json() : {};
    } catch (erro) {
        dados = { corpo: event.data ? event.data.text() : '' };
    }

    event.waitUntil(
        self.registration.showNotification(dados.titulo || 'JPL Solar', {
            body: dados.corpo || '',
            tag: dados.tag || undefined,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: { url: dados.url || '/' },
        }),
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const destino = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
            for (const janela of janelas) {
                if ('focus' in janela) {
                    if ('navigate' in janela) janela.navigate(destino);
                    return janela.focus();
                }
            }
            return self.clients.openWindow(destino);
        }),
    );
});
