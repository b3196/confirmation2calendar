# Confirmation 2 Calendar
This Google Apps Script extract event details from booking and cancellation confirmation emails and creats or deletes events in Google Calendar respectively.

## How it works:
It loops through all emails with a specific label and checks whether it is a booking or a cancellation confirmation. 
- If it is a booking confirmation, it extracts event details from the mail body or pdf ticket and creates a new Google Calendar event.
- If it is a cancellation confirmation, it checks for matching Google Calendar and deletes the first match.

After the operation is exectured, it deletes the original confirmation email and, if desired, forwards it (with pdf attachments).

## Basic Setup for Wellpass:

1. Create a new Label `Wellpass` in Gmail.
2. Set up a filter in Gmail to automatically label incoming email confirmations.
3. Go to [Google Apps Script](https://script.google.com/home) and create a new project.
4. Import the library [Confirmation2Calendar](https://script.google.com/macros/library/d/1_NwafRVbnrmDZT9Y7fDhyugctS1zOLGPlkNZlrXwfCq7V6IetjUoKYg-/2) with Script ID `1_NwafRVbnrmDZT9Y7fDhyugctS1zOLGPlkNZlrXwfCq7V6IetjUoKYg-/2`
5. Create a function which calls ``Confirmation2Calendar.eventsForLabel("Wellpass", "primary", {method: "Wellpass"})``. Instead of `"primary"`, you can also provide a Google Calendar ID.
6. Set up a trigger to run your function in specific time intervals (e.g. every 10 min), so that it regularly checks your inbox and updates your calendar.
