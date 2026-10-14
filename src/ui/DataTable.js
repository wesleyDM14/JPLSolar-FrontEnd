import styled, { keyframes } from 'styled-components';
import { Button } from './Button';
import { EmptyState, LoadingBlock } from './layout';
import { tokens } from './tokens';

const { colors } = tokens;

const entra = keyframes`
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Wrapper = styled.div`
    background: ${colors.surface};
    border-radius: 14px;
    border: 1px solid ${colors.border};
    box-shadow: ${tokens.shadow};
    overflow-x: auto;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    min-width: 560px;
`;

const Th = styled.th`
    text-align: left;
    padding: 12px 16px;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${colors.muted};
    border-bottom: 1px solid ${colors.border};
    background: ${colors.surfaceAlt};
    white-space: nowrap;
    cursor: ${({ $sortable }) => ($sortable ? 'pointer' : 'default')};
    user-select: none;
    position: sticky;
    top: 0;

    &:hover {
        color: ${({ $sortable }) => ($sortable ? colors.text : colors.muted)};
    }
`;

const Td = styled.td`
    padding: 12px 16px;
    font-size: 0.92rem;
    color: ${colors.text};
    border-bottom: 1px solid ${colors.border};
    vertical-align: middle;
`;

const Tr = styled.tr`
    cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
    animation: ${entra} 0.3s ease-out both;
    animation-delay: ${({ $i }) => Math.min($i, 12) * 22}ms;
    transition: background 0.12s, box-shadow 0.12s;

    &:hover {
        background: ${({ $clickable }) => ($clickable ? colors.rowHover : 'transparent')};
        box-shadow: ${({ $clickable }) => ($clickable ? `inset 3px 0 0 ${colors.primary}` : 'none')};
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }

    &:last-child td {
        border-bottom: none;
    }
`;

const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 4px 0;
    color: ${colors.muted};
    font-size: 0.88rem;
    flex-wrap: wrap;
`;

/**
 * columns: [{ key, header, render?(row), sortKey?, width? }]
 * sort: { field, direction } | onSort(field)
 */
export function DataTable({ columns, rows, loading, emptyTitle = 'Nada encontrado', emptyDescription, onRowClick, sort, onSort, rowKey = (row) => row.id }) {
    if (loading) {
        return <Wrapper><LoadingBlock /></Wrapper>;
    }

    if (!rows || rows.length === 0) {
        return <Wrapper><EmptyState title={emptyTitle} description={emptyDescription} /></Wrapper>;
    }

    return (
        <Wrapper>
            <Table>
                <thead>
                    <tr>
                        {columns.map((column) => {
                            const sortable = Boolean(column.sortKey && onSort);
                            const active = Boolean(sort && column.sortKey && sort.field === column.sortKey);
                            return (
                                <Th
                                    key={column.key}
                                    $sortable={sortable}
                                    style={{ width: column.width }}
                                    onClick={sortable ? () => onSort(column.sortKey) : undefined}
                                    aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                                >
                                    {column.header}
                                    {active ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                                </Th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <Tr key={rowKey(row)} $i={index} $clickable={Boolean(onRowClick)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                            {columns.map((column) => (
                                <Td key={column.key}>{column.render ? column.render(row) : row[column.key]}</Td>
                            ))}
                        </Tr>
                    ))}
                </tbody>
            </Table>
        </Wrapper>
    );
}

export function PaginationBar({ meta, onPageChange, label = 'registros' }) {
    if (!meta) return null;

    const { page, totalPages, total, pageSize } = meta;
    const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <Footer>
            <span>{first}–{last} de {total} {label}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
                <span>Página {page} de {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Próxima</Button>
            </div>
        </Footer>
    );
}
