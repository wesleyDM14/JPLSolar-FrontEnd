import { useEffect, useMemo, useState } from "react";
import {
    AdminContainer,
    ClientFinancialContainer,
    ClientFinancialHeader,
    ClientFinancialListContainer,
    ClientFinancialListContent,
    ClientFinancialListHeader,
    ClientFinancialListLabel,
    ClientFinancialListValue,
    DeleteIconContainer,
    EditIconContainer,
} from "./styles";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { FaEdit, FaThumbsDown, FaThumbsUp, FaTrashAlt } from "react-icons/fa";
import Loading from "../../components/Loading";
import { formatCurrencyBRL } from "../../utils/formatString";

const ClientsSegment = () => {

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const filteredClients = useMemo(() => {
        if (loading) return [];
        return clients.filter(client =>
            client.nome?.toLowerCase().includes(search.toLowerCase())
        );
    }, [clients, search, loading]);

    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const currentPageItens = filteredClients.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    useEffect(() => {
        if (loading) {
            setTimeout(() => { // Simulação de delay no carregamento
                setClients([
                    { id: 'teste1', nome: 'Antonio Carlos de Negreiros', numParcelasTotal: 72, valorParcela: 356, pagTotal: 25632, custoImplantacao: 9038.52, lucro: 16593.48, numParcelasRest: 43, valorQuitado: 10324, valorRest: 15308, sePagou: true, notafiscal: true },
                    { id: 'teste2', nome: 'Ubernilda', numParcelasTotal: 36, valorParcela: 525.46, pagTotal: 18916.56, custoImplantacao: 14000, lucro: 4916.56, numParcelasRest: 27, valorQuitado: 4729.14, valorRest: 14187.42, sePagou: false, notafiscal: false }
                ]);
                setLoading(false); // Atualiza o estado para indicar que o carregamento foi concluído
            }, 1000);
        }
    }, [loading]);

    return (
        <ClientFinancialContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <ClientFinancialHeader>

                        </ClientFinancialHeader>
                        <SearchBar search={search} setSearch={setSearch} />
                        <ClientFinancialListContainer>
                            <ClientFinancialListHeader>
                                <ClientFinancialListLabel>Cliente</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Nº Parcelas</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Valor Parcela</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Pag. Total</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Custo</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Lucro Est.</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Parcelas Rest.</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Valor Quitado</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Valor Restante</ClientFinancialListLabel>
                                <ClientFinancialListLabel>Se Pagou?</ClientFinancialListLabel>
                            </ClientFinancialListHeader>
                            {
                                currentPageItens.map((client) => (
                                    <ClientFinancialListContent key={client.id}>
                                        <ClientFinancialListValue>{client.nome}</ClientFinancialListValue>
                                        <ClientFinancialListValue>{client.numParcelasTotal}</ClientFinancialListValue>
                                        <ClientFinancialListValue>{formatCurrencyBRL(client.valorParcela)}</ClientFinancialListValue>
                                        <ClientFinancialListValue>{formatCurrencyBRL(client.pagTotal)}</ClientFinancialListValue>
                                        <ClientFinancialListValue>{formatCurrencyBRL(client.custoImplantacao)}</ClientFinancialListValue>
                                        <ClientFinancialListValue>{formatCurrencyBRL(client.lucro)}</ClientFinancialListValue>
                                        <ClientFinancialListValue>{client.numParcelasRest}</ClientFinancialListValue>
                                        <ClientFinancialListValue>{formatCurrencyBRL(client.valorQuitado)}</ClientFinancialListValue>
                                        <ClientFinancialListValue>{formatCurrencyBRL(client.valorRest)}</ClientFinancialListValue>
                                        <ClientFinancialListValue>{client.sePagou ? <FaThumbsUp color='#0F0' /> : <FaThumbsDown color="#F00" />}</ClientFinancialListValue>
                                        <AdminContainer>
                                            <EditIconContainer><FaEdit /></EditIconContainer>
                                            <DeleteIconContainer><FaTrashAlt /></DeleteIconContainer>
                                        </AdminContainer>
                                    </ClientFinancialListContent>
                                ))
                            }
                            <Pagination currentPage={page} setPage={setPage} totalPages={totalPages} />
                        </ClientFinancialListContainer>
                    </>
                )
            }
        </ClientFinancialContainer>
    );
}

export default ClientsSegment;