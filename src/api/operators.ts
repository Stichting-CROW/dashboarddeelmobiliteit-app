// Function that gets all available operators
export interface OperatorData {
    system_id: string,
    name: string,
    color: string,
    operator_url?: string
}

export const fetchOperators = async (): Promise<OperatorData[] | false> => {
    try {
        const url = `https://mds.dashboarddeelmobiliteit.nl/operators`;
        const response = await fetch(url);
        
        const result: { operators: OperatorData[] } = await response.json();
        return result.operators.map((operator) => operator);
    } catch (error) {
        console.error('Error fetching operators', error);
        return false;
    }
}
