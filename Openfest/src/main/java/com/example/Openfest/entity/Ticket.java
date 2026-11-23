package com.example.Openfest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "tickets",
    indexes = {
        @Index(name = "idx_tickets_ticket_code", columnList = "ticket_code", unique = true),
        @Index(name = "idx_tickets_attendee_id", columnList = "attendee_id"),
        @Index(name = "idx_tickets_event_id", columnList = "event_id")
    }
)
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_code", nullable = false, unique = true, length = 32)
    private String ticketCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attendee_id", nullable = false)
    private User attendee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketStatus status;

    @Column(nullable = false)
    private LocalDateTime issuedAt;

    @Column
    private LocalDateTime checkedInAt;

    protected Ticket() {
        // Required by JPA
    }

    public Ticket(String ticketCode, Event event, User attendee) {
        this.ticketCode = ticketCode;
        this.event = event;
        this.attendee = attendee;
        this.status = TicketStatus.ACTIVE;
        this.issuedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTicketCode() {
        return ticketCode;
    }

    public Event getEvent() {
        return event;
    }

    public User getAttendee() {
        return attendee;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public LocalDateTime getCheckedInAt() {
        return checkedInAt;
    }

    public void markCheckedIn() {
        this.status = TicketStatus.CHECKED_IN;
        this.checkedInAt = LocalDateTime.now();
    }

    public void markCancelled() {
        this.status = TicketStatus.CANCELLED;
    }
}
