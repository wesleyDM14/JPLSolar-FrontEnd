import { useEffect, useState } from "react";
import {
    CardCount,
    CardTitle,
    CardValue,
    FinanceiroContentContainer,
    FinanceiroHeader,
    FinanceiroMainCard,
    FinanceiroMainContainer,
    FinanceiroMainContent,
    FinanceiroTitleContainer,
    HeaderMenu,
    MenuItem,
    Title,
    TitleIcon,
} from "./styles";
import { FaMoneyBill, } from 'react-icons/fa';
import Loading from "../../components/Loading";
import { formatCurrencyBRL } from "../../utils/formatString";
import { getResumeInfo } from "../../services/financialServices";
import ClientsSegment from "./clientsSegment";
import BoletoSegment from "./boletosSegment";
import ContaSegment from "./contaSegment";

const Financial = ({ navigate, user }) => {

    const [section, setSection] = useState('main');
    const [data, setData] = useState({});

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loading) {
            getResumeInfo(setData, setLoading, user);
        }
    }, [loading, user]);

    return (
        <FinanceiroMainContainer>
            {
                loading ? (
                    <Loading />
                ) : (
                    <>
                        <FinanceiroHeader>
                            <FinanceiroTitleContainer onClick={() => setSection('main')}>
                                <TitleIcon>
                                    <FaMoneyBill />
                                </TitleIcon>
                                <Title>Financeiro</Title>
                            </FinanceiroTitleContainer>
                            <HeaderMenu>
                                <MenuItem onClick={() => setSection('conta')} $active={section === 'conta'}>Conta</MenuItem>
                                <MenuItem onClick={() => setSection('clientes')} $active={section === 'clientes'}>Clientes</MenuItem>
                                <MenuItem onClick={() => setSection('boletos')} $active={section === 'boletos'}>Boletos</MenuItem>
                            </HeaderMenu>
                        </FinanceiroHeader>
                        <FinanceiroContentContainer>
                            {
                                section === 'main' && (
                                    <>
                                        <Title>Resumo</Title>
                                        <FinanceiroMainContent>
                                            <FinanceiroMainCard>
                                                <CardTitle>RECEBIDO</CardTitle>
                                                <CardValue>{formatCurrencyBRL(data.recebido)}</CardValue>
                                                <CardCount>{data.num_pagos} boletos pagos</CardCount>
                                            </FinanceiroMainCard>
                                            <FinanceiroMainCard>
                                                <CardTitle>A RECEBER</CardTitle>
                                                <CardValue>{formatCurrencyBRL(data.a_receber)}</CardValue>
                                                <CardCount>{data.num_receber} boletos a vencer/vencidos</CardCount>
                                            </FinanceiroMainCard>
                                            <FinanceiroMainCard>
                                                <CardTitle>VENCIDAS</CardTitle>
                                                <CardValue>{formatCurrencyBRL(data.vencidas)}</CardValue>
                                                <CardCount>{data.num_vencidas} boletos vencidos</CardCount>
                                            </FinanceiroMainCard>
                                            <FinanceiroMainCard>
                                                <CardTitle>A VENCER</CardTitle>
                                                <CardValue>{formatCurrencyBRL(data.a_vencer)}</CardValue>
                                                <CardCount>{data.num_avencer} boletos a vencer</CardCount>
                                            </FinanceiroMainCard>
                                        </FinanceiroMainContent>
                                    </>
                                )
                            }
                            {
                                section === 'conta' && (
                                    <ContaSegment user={user} />
                                )
                            }
                            {
                                section === 'clientes' && (
                                    <ClientsSegment user={user} />
                                )
                            }
                            {
                                section === 'boletos' && (
                                    <BoletoSegment />
                                )
                            }
                        </FinanceiroContentContainer>
                    </>
                )
            }
        </FinanceiroMainContainer>
    )
}

export default Financial;