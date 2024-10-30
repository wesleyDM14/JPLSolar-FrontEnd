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
    LabelList
} from 'recharts';

const Graphic = ({ powerData, type, inverter, estimated }) => {

    const generateTimeData = () => {
        const data = [];
        let timeTemp = new Date('December 17, 1995 05:30:00');

        powerData.forEach(option => {
            if (option !== null) {
                const xTemp = typeof option === 'object' && option.y !== undefined
                    ? `${new Date(option.x).getHours()}:${new Date(option.x).getMinutes()}`
                    : `${timeTemp.getHours()}:${timeTemp.getMinutes()}`;

                timeTemp.setMinutes(timeTemp.getMinutes() + 5);
                const temp = { x: xTemp, y: option.y ?? option };
                data.push(temp);
            }
        });

        return data;
    }

    const generateGraphData = () => {
        let maxValue = 0;
        const data = powerData.map((option, index) => {
            const value = parseFloat(option.toFixed(2));
            maxValue = Math.max(maxValue, value);
            return { x: index + 1, real: value, estimado: estimated };
        });

        return { data, maxValue };
    }

    const generateYearOrDefaultData = () => {
        let maxValue = 0;
        const data = type === 'year'
            ? powerData.slice().reverse().map((option, index) => {
                const year = new Date().getFullYear() - index;
                const value = parseFloat(option.toFixed(2));
                maxValue = Math.max(maxValue, value);
                return { x: year, y: value };
            })
            : powerData.map((option, index) => {
                const value = parseFloat(option.toFixed(2));
                maxValue = Math.max(maxValue, value);
                return { x: index + 1, y: value };
            });

        return { data, maxValue };
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const value = inverter === 'deye' ? (payload[0].value * 1000).toFixed(2) : payload[0].value.toFixed(2);
            return <div className='custom-tooltip'><p className='label'>{`${value}W`}</p></div>;
        }
        return null;
    }

    switch (type) {
        case 'time': {
            const data = generateTimeData();
            return (
                <AreaChart
                    id='chart'
                    width={650}
                    height={400}
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <YAxis hide={true} />
                    <XAxis dataKey='x' />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type='monotone' dataKey='y' stroke='#00ff44' fill='#00ff4488' />
                </AreaChart>
            );
        }

        case 'graph': {
            const { data, maxValue } = generateGraphData();
            return (
                <BarChart
                    id='barChart'
                    width={650}
                    height={400}
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis domain={[0, maxValue + 100]} hide={true} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="real" fill="#00ff44">
                        <LabelList dataKey='real' position="insideEnd" angle={270} offset={25} fill="black" />
                    </Bar>
                    <Bar dataKey="estimado" fill="#00BBff">
                        <LabelList dataKey='estimado' position="insideEnd" angle={270} offset={150} fill="black" />
                    </Bar>
                </BarChart>
            );
        }

        case 'year':
        default: {
            const { data, maxValue } = generateYearOrDefaultData();
            return (
                <BarChart
                    id='barChart'
                    width={650}
                    height={400}
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis domain={[0, maxValue]} hide={true} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="y" fill="#00ff44" />
                </BarChart>
            );
        }
    }
};

export default Graphic;