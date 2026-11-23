package com.example.Openfest.dto;

import com.example.Openfest.entity.Event;
import com.example.Openfest.entity.EventStatus;
import com.example.Openfest.entity.Ticket;
import com.example.Openfest.entity.TicketStatus;

import java.time.LocalDateTime;

public class TicketResponse {

    private Long id;
    private String ticketCode;
    private TicketStatus status;
    private LocalDateTime issuedAt;
    private LocalDateTime checkedInAt;
    private String attendeeEmail;

    private Long eventId;
    private String eventTitle;
    private String eventDescription;
    private String eventLocation;
    private EventStatus eventStatus;
    private LocalDateTime eventCreatedAt;

    public TicketResponse() {
    }

    public static TicketResponse fromEntity(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.id = ticket.getId();
        response.ticketCode = ticket.getTicketCode();
        response.status = ticket.getStatus();
        response.issuedAt = ticket.getIssuedAt();
        response.checkedInAt = ticket.getCheckedInAt();

        if (ticket.getAttendee() != null) {
            response.attendeeEmail = ticket.getAttendee().getEmail();
        }

        Event event = ticket.getEvent();
        if (event != null) {
            response.eventId = event.getId();
            response.eventTitle = event.getTitle();
            response.eventDescription = event.getDescription();
            response.eventLocation = event.getLocation();
            response.eventStatus = event.getStatus();
            response.eventCreatedAt = event.getCreatedAt();
        }

        return response;
    }

    public Long getId() {
        return id;
    }

    public String getTicketCode() {
        return ticketCode;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public LocalDateTime getCheckedInAt() {
        return checkedInAt;
    }

    public String getAttendeeEmail() {
        return attendeeEmail;
    }

    public Long getEventId() {
        return eventId;
    }

    public String getEventTitle() {
        return eventTitle;
    }

    public String getEventDescription() {
        return eventDescription;
    }

    public String getEventLocation() {
        return eventLocation;
    }

    public EventStatus getEventStatus() {
        return eventStatus;
    }

    public LocalDateTime getEventCreatedAt() {
        return eventCreatedAt;
    }
}
