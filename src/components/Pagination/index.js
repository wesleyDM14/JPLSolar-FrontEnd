import { PaginationButton, PaginationContainer } from "./styles"

const Pagination = ({ totalPages, currentPage, setPage }) => {

    return (
        <PaginationContainer>
            {
                Array.from({ length: totalPages }, (_, index) => (
                    <PaginationButton
                        key={index}
                        onClick={() => setPage(index + 1)}
                        disabled={currentPage === index + 1}
                    >
                        {index + 1}
                    </PaginationButton>
                ))
            }
        </PaginationContainer>
    );
}

export default Pagination;