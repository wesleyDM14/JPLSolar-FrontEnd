const rolePermissions = {
    ADMIN: {
        menus: ['/dashboard', '/contratos', '/clientes', '/clientes/novo', '/contratos', '/contratos/novo', '/contratos/:contractId', '/financeiro', '/parceiros', '/parceiros/novo', '/parceiros/:partnerId', '/perfil', '/relatorios', '/plantas-solares', '/plantas-solares/:solarPlantId', '/plantas-solares/cliente/:clientId', '/plantas-solares/cliente/:clientId/nova', '/tarefas'],
        actions: ['edit-client', 'edit-solarPlant', 'download-report'],
    },
    MONTADOR: {
        menus: ['/dashboard', '/contratos', '/clientes', '/clientes/novo', '/contratos', '/contratos/novo', '/contratos/:contractId', '/financeiro', '/parceiros', '/parceiros/novo', '/parceiros/:partnerId', '/perfil', /*'/relatorios',*/ '/plantas-solares', '/plantas-solares/:solarPlantId', '/plantas-solares/cliente/:clientId', '/plantas-solares/cliente/:clientId/nova', '/tarefas'],
        actions: ['edit-client', 'edit-solarPlant', 'download-report'],
    },
    PARCEIRO: {
        menus: ['/dashboard', '/contratos', '/contratos/novo', '/contratos/:contractId', '/perfil',],
        actions: [],
    },
    CLIENTE: {
        menus: ['/dashboard', '/perfil', '/plantas-solares/:solarPlantId', '/plantas-solares/cliente/:clientId', '/financeiro', '/plantas-solares'],
        actions: [],
    },
};

export const hasPermission = (role, path) => {
    const allowedRoutes = rolePermissions[role]?.menus || [];

    if (path.includes('/novo') && !allowedRoutes.some(route => route === path)) {
        return false;
    }

    if (allowedRoutes.includes(path)) {
        return true;
    }

    return allowedRoutes.some(route => {
        const dynamicRoute = route.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${dynamicRoute}$`);

        const match = regex.test(path);

        return match;
    });
};

export const hasActionPermission = (role, action) => {
    return rolePermissions[role]?.actions?.includes(action) ?? false;
}