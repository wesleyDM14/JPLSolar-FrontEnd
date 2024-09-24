import { ThreeDots } from "react-loader-spinner"
import { LoadingContainer, Logo } from "./style"
import { colors } from "../../utils/GlobalStyles"
import logo from '../../assets/logo.png';

const Loading = () => {

    return (
        <LoadingContainer>
            <Logo src={logo} alt='Logo da Empresa' />
            <ThreeDots color={colors.icon} height={49} width={100} />
        </LoadingContainer>
    );
}

export default Loading;