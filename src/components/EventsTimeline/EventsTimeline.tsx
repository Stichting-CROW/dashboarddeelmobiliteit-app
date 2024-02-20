import './EventsTimeline.css';

const EventsTimeline = () => {
    return <div className="EventsTimeline">
        <div className="inner">
            <div className="line" />
            <div className="events-wrapper">
                {[
                    '1 jan 2023',
                    '3 jun 2023',
                    '8 jul 2023'
                ].map(date => <div className="event dot-label">
                    <span className="event-title">
                        {date}
                    </span>
                    <span className="dot" />
                </div>)}
            </div>
        </div>
    </div>
}

export default EventsTimeline;
