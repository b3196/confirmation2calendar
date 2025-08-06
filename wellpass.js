function getWellpassBookingDetails(message) {
  const text = message.getPlainBody();
  const subject = message.getSubject();
  
  // get title and venue
  const eventRegex = /Booking.*:\s(?<title>\w+(.\w+)*)\sat\s(?<venue>\w+(.\w+)*)/;
  const event = eventRegex.exec(subject).groups;
  
  // get startTime
  const dateRegex = /Date:.?\s\w+,\s(?<longdate>.+)/;
  const timeRegex = /Time:.?\s(?<time>\d+:\d{2}\s?(AM|PM)?)/;
  const startTime = dateRegex.exec(text).groups.longdate + " " + timeRegex.exec(text).groups.time;

  // get duration
  const durationRegex = /Duration:.?\s((?<hours>\d+)\shours?)?\s?((?<minutes>\d+)\sminutes?)?/;
  let duration = durationRegex.exec(text).groups;
  duration.minutes *= 1;
  if (duration.hours) duration.minutes += duration.hours * 60;

  // get location
  const locationRegex = /(Address|Location):.?\s(?<loc>.+)/;
  const location = locationRegex.exec(text).groups.loc;

  return {
    "title": event.title,
    "venue": event.venue,
    "startTime": startTime,
    "duration": duration.minutes,
    "location": location
  };
}

function getWellpassCancellationDetails(message) {
  const text = message.getPlainBody();
  const subject = message.getPlainBody();

  let regex = /on\s+(..)?(?<day>\d+)\.(?<month>\d+)\.(?<year>\d{2}\d{2}?)\s+(.\s+)?at\s+(.\s+)?(?<time>\d+:\d{2}\s?(AM|PM)?)/;
  const date = regex.exec(text).groups;

  const event = /Cancellation.*:\s(?<title>\w+(.\w+)*)\sat\s(?<venue>\w+(.\w+)*)/.exec(subject).groups;

  return {
    "title": event.title,
    "venue": event.venue,
    "startTime": date.year + "-" + date.month + "-" + date.day + " " + date.time
  };
}
