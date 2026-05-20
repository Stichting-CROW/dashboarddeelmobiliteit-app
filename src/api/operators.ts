// Function that gets all available operators
export interface OperatorData {
    system_id: string,
    name: string,
    color: string,
    operator_url?: string
}

/**
 * /operators is global metadata that is effectively static for the duration of a
 * session. To avoid the same endpoint being fetched multiple times by independent
 * components on the same page (and by React StrictMode's double-mount in dev), we:
 *  - cache the successful response for the lifetime of the page; and
 *  - de-duplicate concurrent in-flight requests so a burst of callers share a
 *    single network request.
 */
let cachedOperators: OperatorData[] | null = null;
let inFlightOperatorsRequest: Promise<OperatorData[] | false> | null = null;

export const fetchOperators = async (): Promise<OperatorData[] | false> => {
    if (cachedOperators) {
        return cachedOperators;
    }
    if (inFlightOperatorsRequest) {
        return inFlightOperatorsRequest;
    }

    const promise = (async (): Promise<OperatorData[] | false> => {
        try {
            const url = `https://mds.dashboarddeelmobiliteit.nl/operators`;
            const response = await fetch(url);

            const result: { operators: OperatorData[] } = await response.json();
            const operators = result.operators.map((operator) => operator);
            cachedOperators = operators;
            return operators;
        } catch (error) {
            console.error('Error fetching operators', error);
            return false;
        }
    })();

    inFlightOperatorsRequest = promise;
    try {
        return await promise;
    } finally {
        if (inFlightOperatorsRequest === promise) {
            inFlightOperatorsRequest = null;
        }
    }
};
