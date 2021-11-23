import moment from 'moment';

export const fetchParkEvents = async (authentication, provider, dateTime) => {
  if(! authentication || ! authentication.user_data || ! dateTime) {
    return;
  }
  if(! provider) {
    return;
  }

  const formattedDateTime = moment(dateTime).format('YYYY-MM-DDTHH:mm:ss[Z]');
  let url = "https://api.deelfietsdashboard.nl/dashboard-api/park_events?timestamp="+formattedDateTime+"&operators="+provider;
  let options = { headers : { "authorization": "Bearer " + authentication.user_data.token }}

  const response = await fetch(url, options);

  if(! response.ok) {
    console.error("unable to fetch: %o", response);
    return false;
  }

  const json = await response.json();

  return json.park_events || false;
}