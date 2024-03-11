import {useEffect, useState} from 'react';

// Import components
import { useSearchParams } from 'react-router-dom'

import './EventsTimeline.css';

// https://mds.dashboarddeelmobiliteit.nl/public/service_area/history?municipalities=GM0599&operators=check&start_date=2024-01-21&end_date=2024-02-28

const EventsTimeline = ({
    changeHistory
}: {
    changeHistory: any
}) => {
    const [events, setEvents] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        populateHistoryTimeline();
    }, [
        changeHistory
    ])

    const populateHistoryTimeline = () => {
        if(! changeHistory) return;

        const events = changeHistory.map((x) => {
            return {
                ...x,
                valid_from_formatted: new Date(x.valid_from).toLocaleDateString('nl-NL')
            }
        }).slice(changeHistory.length-10, changeHistory.length);

        setEvents(events)
    }
    
    return <div className="EventsTimeline sm:rounded-3xl">
        <div className="inner">
            <div className="line" />
            <div className="events-wrapper">
                {events.map(x => <div className="event dot-label" key={`${x.operator}-${x.service_area_version_id}`}>
                    <span className="event-title">
                        {x.valid_from_formatted}
                    </span>
                    <span className="dot" onClick={() => {
                        searchParams.set('version', x.service_area_version_id);
                        setSearchParams(searchParams);
                    }} />
                </div>)}
            </div>
        </div>
    </div>
}

export default EventsTimeline;
