import {
    AreaChart,
    BarChart,
    Area,
    YAxis,
    XAxis,
    Bar,
    CartesianGrid,
    Tooltip,
    Legend,
    LabelList,
    ResponsiveContainer
} from 'recharts';

const Graphic = ({ powerData, type, inverter, estimated, chartDate }) => {
    if (type === 'time') {
        const data = [];
        const baseDate = new Date(chartDate).setHours(0, 0, 0, 0);
        const now = new Date(); // Data e hora atuais
        const isToday = new Date(chartDate).toDateString() === now.toDateString();
        let timeTemp = new Date(baseDate);

        powerData.forEach(option => {
            let xTemp = {};
            let temp = {};

            if (option !== null && typeof option === 'object') {
                // Dados fornecidos por powerData
                if (option.y !== undefined) {
                    const xAxisTemp = new Date(option.x);
                    xTemp = `${xAxisTemp.getHours().toString().padStart(2, '0')}:${xAxisTemp.getMinutes().toString().padStart(2, '0')}`;
                    temp = { x: xTemp, y: option.y > 0 ? option.y : 0 };
                    data.push(temp);
                }
            } else {
                // Dados gerados dinamicamente
                if (
                    !isToday || // Não é hoje: preenche todos os horários
                    (timeTemp.getHours() < now.getHours() || (timeTemp.getHours() === now.getHours() && timeTemp.getMinutes() <= now.getMinutes()))
                ) {
                    xTemp = `${timeTemp.getHours().toString().padStart(2, '0')}:${timeTemp.getMinutes().toString().padStart(2, '0')}`;
                    temp = { x: xTemp, y: (option !== null && option > 0) ? option : 0 };
                    data.push(temp);
                    timeTemp.setMinutes(timeTemp.getMinutes() + 5); // Incrementa 5 minutos
                }
            }
        });

        const CustomTooltip = ({ active, payload }) => {
            if (active && payload && payload.length) {
                return (
                    <div className="custom-tooltip">
                        <p className="label">{inverter === 'deye' ? `${((payload[0].value) * 1000).toFixed(2)}W` : `${(payload[0].value).toFixed(2)}W`}</p>
                    </div>
                );
            }
            return null;
        };

        return (
            <ResponsiveContainer height="75%">
                <AreaChart
                    id='chart'
                    width={650}
                    height={400}
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <YAxis hide={true} />
                    <XAxis dataKey='x' className={'label-chart-responsive'} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type='monotone' dataKey='y' stroke='#00ff44' fill='#00ff4488' />
                </AreaChart>
            </ResponsiveContainer>
        );
    } else if (type === 'graph') {
        let data = [];
        let i = 0;
        let maxValue = 0;
        powerData.forEach(option => {
            let temp = { x: (i + 1), real: option.toFixed(2), estimado: estimated }
            data.push(temp);
            if (option > maxValue) {
                maxValue = option;
            }
            i++;
        });
        const CustomTooltip = ({ active, payload }) => {
            if (active && payload && payload.length) {
                return (
                    <div className="custom-tooltip">
                        <p className="label">{`${payload[0].value}kWh`}</p>
                    </div>
                );
            }
            return null;
        };

        return (
            <ResponsiveContainer height="75%">
                <BarChart
                    id='barChart'
                    width={650}
                    height={400}
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis domain={[0, maxValue + 100]} hide={true} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="real" fill="#00ff44">
                        <LabelList
                            dataKey='real'
                            position="insideEnd"
                            angle={270}
                            offset={25}
                            fill="black"
                        />
                    </Bar>
                    <Bar dataKey="estimado" fill="#00BBff">
                        <LabelList
                            dataKey='estimado'
                            position="insideEnd"
                            angle={270}
                            offset={150}
                            fill="black"

                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    } else {
        let data = [];
        let i = 0;
        var maxValue = 0;
        if (type === 'year') {
            let dataTemp = new Date();
            for (var index = powerData.length - 1; index >= 0; index--) {
                let temp = { x: (dataTemp.getFullYear() - i), y: powerData[index].toFixed(2) }
                if (powerData[index] > maxValue) {
                    maxValue = powerData[index];
                }
                data.push(temp);
                i++;
            }
            data = data.reverse();
        } else {
            powerData.forEach(option => {
                let temp = { x: (i + 1), y: option.toFixed(2) }
                data.push(temp);
                if (option > maxValue) {
                    maxValue = option;
                }
                i++;
            });
        }

        const CustomTooltip = ({ active, payload }) => {
            if (active && payload && payload.length) {
                return (
                    <div className="custom-tooltip">
                        <p className="label">{`${payload[0].value}kWh`}</p>
                    </div>
                );
            }
            return null;
        };

        return (
            <ResponsiveContainer height="75%">
                <BarChart
                    id='barChart'
                    width={650}
                    height={400}
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" interval={0} className={'label-chart-responsive'} />
                    <YAxis domain={[0, maxValue + 2]} hide={true} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="y" fill="#00ff44" />
                </BarChart>
            </ResponsiveContainer>
        );
    }
}

export default Graphic;