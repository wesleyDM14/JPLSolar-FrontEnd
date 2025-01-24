import axios from "axios";

export const getDashboardData = async (user, setLoading, setSolarPlants, setSolarPlantsWithError, setTotalUsinas, setTotalPowerInstaled) => {
    await axios.get(process.env.REACT_APP_BASE_URL + '/api/dashboardData', {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
        }
    }).then((response) => {
        const { data } = response;
        const { totalPlant, totalPowerInstalled, plants } = data;
        setTotalUsinas(totalPlant);
        setTotalPowerInstaled(totalPowerInstalled);

        let plantsResponse = [];
        let plantsErrorResponse = [];

        plants.forEach(plant => {
            if (plant.status === '-1') {
                plantsErrorResponse.push(plant);
            } else {
                plantsResponse.push(plant);
            }
        });

        setSolarPlants(plantsResponse);
        setSolarPlantsWithError(plantsErrorResponse);
        setLoading(false);

    }).catch((err) => {
        console.error(err);
        window.alert(err.response.data.message);
    });
}