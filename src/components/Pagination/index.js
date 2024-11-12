import { PaginationButton, PaginationContainer } from "./styles"

const Pagination = ({ totalPages, currentPage, setPage }) => {

    const maxVisibleButtons = 7;
    const pageNumbers = [];

    if (totalPages <= maxVisibleButtons) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        pageNumbers.push(1);

        let start = Math.max(2, currentPage - 2);
        let end = Math.min(totalPages - 1, currentPage + 2);

        if (currentPage <= 4) {
            end = 5;
        }

        if (currentPage >= totalPages - 3) {
            start = totalPages - 4;
        }

        for (let i = start; i <= end; i++) {
            pageNumbers.push(i);
        }

        pageNumbers.push(totalPages);
    }

    return (
        <PaginationContainer>
            {
                pageNumbers.map((pageNumber, index) => (
                    <PaginationButton
                        key={index}
                        onClick={() => setPage(pageNumber)}
                        disabled={currentPage === pageNumber}
                    >
                        {pageNumber}
                    </PaginationButton>
                ))
            }
        </PaginationContainer>
    );
}

export default Pagination;