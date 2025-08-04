/**
 * checks each mail with label {labelName} and performs following operations
 * if booking: creates new calendar event in {calendarId} and deletes mail
 * if cancellation: deletes matching calendar events and, if match found, deletes mail
 * @param {labelName} the label to get mails from
 * @param {calendarId} GoogleCalendarId for which to create and delete events
 * @param {defaultDuration} default event duration in minutes to use if no duration could be identified in mail
 * @param {maxDuration} maximial duration in minutes to find matching events for deletion
*/
function updateCalendarFromMails(labelName="Wellpass", calendarId="primary", defaultDuration=60, maxDuration=180, useICS=false) {
  // checks all mails with labelName and performs following operations
  // for bookings: creates new calendar event
  // for cancellation: deletes matching calendar events

  const subjectRegex = /(?<type>(Cancellation|Booking)).*:\s(?<summary>.+)/
  const threads = GmailApp.getUserLabelByName(labelName).getThreads();
  
  if (threads) threads.forEach( (thread) => {
    let messages = thread.getMessages();
    messages.forEach( (message) => {
      // if message in trash, skip
      if (message.isInTrash()) {
        return;
      }
      
      const subject = message.getSubject();
      const head = subjectRegex.exec(subject).groups;
      const body = message.getPlainBody();

      var success = false;
      
      switch (head.type) {
        // create calendar event for bookings and delete email
        case "Booking":
          success = createEventFromText(head.summary, body, calendarId, defaultDuration);
          break;
        // delete matching calendar events and delete email, if match found
        case "Cancellation":
          success = deleteEventFromText(head.summary, body, calendarId, maxDuration);
          break;
        // returns error if classification fails
        default:
          throw "ERROR: Could not classify mail " + subject
      }

      // if successfully synched calendar, delete mail
      if (success) {
        let date = message.getDate();
        message.moveToTrash();
        Logger.log(
          "Deleted Mail: " + subject + "\nFrom Date: " + date.toString().substring(0,21)
        );
      }
    });
  });
}

function createEventFromText(title, text, calendarId, defaultDuration) {
  // get start time
  const dateRegex = /Date:.?\s\w+,\s(?<longdate>.+)/;
  const timeRegex = /Time:.?\s(?<time>\d+:\d{2}\s?(AM|PM)?)/;
  const startTime = new Date(dateRegex.exec(text).groups.longdate + " " + timeRegex.exec(text).groups.time);

  // get end time
  const durationRegex = /Duration:.?\s((?<hours>\d+)\shours?)?\s?((?<minutes>\d+)\sminutes?)?/;
  var duration = durationRegex.exec(text).groups;
  if (!duration.minutes) {
    duration.minutes = 0; // set to 0
  } else {
    duration.minutes *= 1; // cast to integer
  }
  if (duration.hours) {
    duration.minutes += duration.hours * 60;
  }else if (duration.minutes == 0){
      duration.minutes = defaultDuration;
      Logger.log(
        "WARNING: No event duration found. Event duration set to " + defaultDuration + " min."
      )
  }
  const endTime = new Date(startTime.getTime() + duration.minutes * 60000);

  // get location
  const locationRegex = /(Address|Location):.?\s(?<loc>.+)/;
  const location = locationRegex.exec(text).groups.loc;

  // create calendar event
  const calendar = CalendarApp.getCalendarById(calendarId);
  calendar.createEvent(title, startTime, endTime, {location: location});
  Logger.log(
    "Created Event: " + title + "\n" +
    "Start: " + startTime.toString().substring(0,21) + "\tDuration: " + duration.minutes + " min"
  );

  return true;
}

function deleteEventFromText(title, text, calendarId, maxDuration) {
  const regex = /on\s+(..)?(?<day>\d+)\.(?<month>\d+)\.(?<year>\d{2}\d{2}?)\s+(.\s+)?at\s+(.\s+)?(?<time>\d+:\d{2}\s?(AM|PM)?)/;
  const date = regex.exec(text).groups;
  
  const startTime = new Date(date.year + "-" + date.month + "-" + date.day + " " + date.time);
  const endTime = new Date(startTime.getTime() + maxDuration * 60000);
  
  const calendar = CalendarApp.getCalendarById(calendarId);
  const events = calendar.getEvents(startTime, endTime);

  let match = false;

  if (events) events.forEach( (event) => {
    if (event.getTitle() == title && event.getStartTime() - startTime == 0) {
      match = true;
      const duration = (event.getEndTime() - startTime) / 60000;

      event.deleteEvent();
      Logger.log(
        "Deleted Event: " + title + "\n" +
        "Start: " + startTime + "\tDuration: " + duration
      );
    }
  });

  return match;
}
