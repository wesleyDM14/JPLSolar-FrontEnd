import { addMonths, differenceInDays, } from "date-fns";

export const calculateRemaingDays = (startDate, gracePeriodDays) => {
    const today = new Date();
    const start = new Date(startDate);

    const daysPassed = differenceInDays(today, start);

    const remaingDays = gracePeriodDays - daysPassed;

    return remaingDays > 0 ? remaingDays : 0;
}

export const calculateLastDate = (startDate, quant) => {
    const start = new Date(startDate);

    const lastDate = addMonths(start, quant);

    return lastDate;
}