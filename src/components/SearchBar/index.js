import { FaSearch } from "react-icons/fa"
import { SearchContainer, SearchIcon, SearchInput } from "./styles"

const SearchBar = ({ search, setSearch }) => {
    return (
        <SearchContainer>
            <SearchIcon>
                <FaSearch />
            </SearchIcon>
            <SearchInput
                id='search'
                type="text"
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </SearchContainer>
    )
}

export default SearchBar;