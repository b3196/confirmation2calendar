/**
 * checks each mail with label {labelName} and performs following operations
 * if booking: creates new calendar event in {calendarId}.
 * if cancellation: deletes matching calendar events.
 * @param {string} labelName - the label to get mails from
 * @param {string} calendarId - id of Google Calendar for which to create and delete events
 * @param {dictionary} options - dictionary containing additional specifications such as: defaultDuration for event creation; maxDuration for findind and deleting calendar events; method; apiKey for Google gemini.
*/
function eventsForLabel(labelName, calendarId, options) {
  const methods = ["Nightride", "Wellpass", "Ticket"];
  const defaultOptions = {
    "defaultDuration": 60,
    "maxDuration": 180,
    "deleteMessage": true,
    "forwardTo": "",
    "method": "",
    "apiKey": ""
  };

  // set missing options values to default
  for (const [key, value] of Object.entries(defaultOptions)) options[key] = options[key] || value;
  
  // if options.method not valid, throw error
  if (!methods.includes(options.method)) throw Error("ERROR: Method should be one of " + methods + " but " + option.method + " given.");
  
  // loop through messages with label {labelName}
  const threads = GmailApp.getUserLabelByName(labelName).getThreads();
  if (threads) threads.forEach((thread) => {
    const messages = thread.getMessages();
    messages.forEach((message) => {
      // if message in trash, skip
      if (message.isInTrash()) return;

      const subject = message.getSubject();

      if (/cancel/.exec(subject.toLowerCase())){
        // get eventDetails and delete matching event
        let eventDetails = getCancellationDetails(message, options);
        deleteEvent(eventDetails, calendarId, options.maxDuration);

      }else{
        // get eventDetails and create event
        let eventDetails = getBookingDetails(message, options);
        Logger.log(eventDetails);
        let event = createEvent(eventDetails, calendarId);
      
        // forwards email with pdf attachments
        if (options.forwardTo) {
          const subject = "Tickets: " + event.getTitle() + " on " + event.getStartTime().toString().substring(0,15);
          forwardPdfs(message, subject, options.forwardTo);
        }
      }

      // delete confirmation mail
      if (options.deleteMessage) deleteMessage(message);
    });
  });
}

/**
 * gets all pdf attachments of a message
 */
function forwardPdfs(message, subject, forwardTo) {
  const attachments = message.getAttachments();
  var pdfs = [];

  // loops through attachments and looks for pdfs
  if (attachments) attachments.forEach( (attachment) => {
    if (attachment.getContentType() == "application/pdf") pdfs = pdfs.concat(attachment);
  });

  // forward mail with pdf attachments and adjusted subject line
  GmailApp.sendEmail(
    forwardTo,
    subject,
    message.getPlainBody(),
    {
      "attachments": pdfs,
      "htmlBody": message.getBody()
    }
  );

  Logger.log(
    "Forwarded Mail: " + message.getSubject() + "\n" +
    "From: " + message.getDate().toString().substring(0,21) + "\n" + 
    "To: " + forwardTo 
  );
}

function getBookingDetails(message, options) {
  var eventDetails;
  switch (options.method) {
    case "Nightride":
      eventDetails = getNightrideBookingDetails(message);
      break;
    case "Wellpass":
      eventDetails = getWellpassBookingDetails(message);
      break;
    case "Tickets":
      
    
    default:
      throw Error("ERROR: Invalid method.");
  }
  
  eventDetails.duration = eventDetails.duration || options.defaultDuration;
  return eventDetails;
}

function getCancellationDetails(message, options) {
  switch (options.method) {
    case "Nightride":
      return getNightrideCancellationDetails(message);
    case "Wellpass":
      return getWellpassCancellationDetails(message);
    default:
      throw Error("ERROR: Invalid method.");
  }
}

/**
 * creates event in Google Calendar with id calendarId based on information in dictionary eventDetails.
 * @param {dictionary} eventDetails - dictionary with following fields 'title', 'venue', 'startTime', 'duration', 'endTime' (optional), 'location' (optional)
 * @param {string} calendarId - calendarId to create event
 */
function createEvent(eventDetails, calendarId) {  
  const startTime = new Date(eventDetails.startTime);
  const endTime = new Date(eventDetails.endTime || startTime.getTime() + eventDetails.duration * 60000);

  const event = CalendarApp.getCalendarById(calendarId).createEvent(
    eventDetails.title + " at " + eventDetails.venue,
    startTime,
    endTime,
    {
      location: eventDetails.location
    }
  );

  Logger.log(
    "Created event " + event.getTitle() + "\n" + 
    "Start: \t" + event.getStartTime().toString().substring(0,21) + "\n" + 
    "End: \t" + event.getEndTime().toString().substring(0,21)
  );
  return event;
}

/**
 * deletes event in Google Calendar matchin eventDetails with duration <= maxDuration.
 */
function deleteEvent(eventDetails, calendarId, maxDuration) {  
  const title = eventDetails.title + " at " + eventDetails.venue;

  const startTime = new Date(eventDetails.startTime);
  const endTime = new Date(startTime.getTime() + maxDuration * 60000);

  const calendar = CalendarApp.getCalendarById(calendarId);
  const events = calendar.getEvents(startTime, endTime);

  // loop through events starting at startTime with duration <= maxDuration and delete first match
  if (events) events.forEach( (event) => {
    if (event.getTitle() == title && event.getStartTime() - startTime == 0) {
      const endTime = event.getEndTime();

      event.deleteEvent();
      Logger.log(
        "Deleted Event: " + title + "\n" +
        "Start: \t" + startTime.toString().substring(0,21) + "\n" + 
        "End: \t" + endTime.toString().substring(0,21)
      );
      return true;
    }
  });
  return false;
}


/**
 * moves message to trash.
 */
function deleteMessage(message) {
  const subject = message.getSubject();
  const datetime = message.getDate();

  message.moveToTrash();
  Logger.log(
    "Deleted mail: " + subject + "\nFrom: " + datetime.toString().substring(0,21)
  );
}
