function getNightrideBookingDetails(message) {
  const text = message.getPlainBody();
  
  // get event title, startTime and duration
  const eventRegex = /You\sbooked\s(?<title>NR.*)\son\s(?<startTime>.*)\swith\s(?<coach>\w+)/;
  const event = eventRegex.exec(text).groups;
  const duration = /NR(?<duration>\d+)/.exec(event.title).groups.duration;

  // get location
  const locationRegex = /address\sis\s(?<street>.*)\s\/\s(?<zip>\d{5})\s(?<city>\w+)/;
  const location = locationRegex.exec(text).groups;
  
  return {
    "title": event.title, 
    "venue": "NIGHTRIDE",
    "startTime": event.startTime,
    "duration": duration,
    "location": location.street + ", " + location.zip + " " + location.city,
    "coach": event.coach
  };
}

function getNightrideCancellationDetails(message) {
  const text = message.getPlainBody();
  
  const regex = /cancellation\sfor\sthe\s(?<title>\w+.*)\ssession\swith\s(?<coach>\w+)\sat\s(?<venue>\w+.*)\son\s(?<startTime>\d+\.\s\w+\s\d{4}\s\d{2}:\d{2})/;
  const event = regex.exec(text).groups;
  
  return event;
}
